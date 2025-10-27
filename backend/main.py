from typing import Any, Literal, Dict
import uvicorn
import os
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from celery.result import AsyncResult
from pydantic import BaseModel
from loguru import logger
import docker
import time

from celery_worker import send_task_to_server

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://react:3000","http://46.62.236.231:3000","http://aafactory-demo.xyz:3000"],  # React container
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskRequest(BaseModel):
    server_name: Literal["infinite_talk", "zonos", "qwen_image", "mock"]
    task_name: Literal["prompt_image_audio_to_video", "custom_voice_to_audio", "text_to_image", "image_to_image_edit"]
    payload: Dict[str, Any]


class UpdateEnvRequest(BaseModel):
    env_vars: Dict[str, str]


@app.post("/run_task/")
def run_task(request: TaskRequest) -> JSONResponse:
    task = send_task_to_server.delay(server_name=request.server_name, task_name=request.task_name, payload=request.payload)
    return JSONResponse({"task_id": task.id, "status": task.status})

@app.get("/task_status/{task_id}")
def task_status(task_id: str) -> JSONResponse:
    task = send_task_to_server.AsyncResult(task_id)

    response = {
        "task_id": task.id,
        "status": task.status,
    }
    logger.info(f"Task status: {task.status}")
    if task.status == "SUCCESS":
        subtask_id = task.result
        logger.info(f"Subtask ID: {subtask_id}")
        # Try to follow the sub-task if the result looks like a task id (UUID)
        subtask = AsyncResult(subtask_id)
        logger.info(f"Subtask status: {subtask.status}")
        if subtask.status == "SUCCESS":
            response["result"] = subtask.result
        elif subtask.status == "FAILURE":
            response["status"] = "FAILURE"
        else:
            response["status"] = "PENDING"
            logger.info("Subtask not ready yet.")

    return JSONResponse(response)


def restart_containers_background(compose_file: str, project_name: str, endpoint: str = "redis:6379"):
    print('endpoint: ', endpoint)
    """Background task to restart containers using docker-compose after response is sent."""
    # Wait a bit to ensure response is sent
    time.sleep(2)

    logger.info("Starting background container restart process using docker-compose")

    try:
        # Services to restart
        services = ['celery-worker', 'flower']

        # Prepare environment variables
        env = os.environ.copy()
        env['CELERY_BROKER_URL'] = endpoint
        env['CELERY_RESULT_BACKEND'] = endpoint

        # Use docker-compose to restart services with updated env vars
        for service in services:
            try:
                # Step 1: Stop the service
                logger.info(f"Killing {service}")
                kill_result = subprocess.run(
                    ['docker-compose', '-f', compose_file, '-p', project_name, 'kill', service],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    env=env
                )

                if kill_result.returncode == 0:
                    logger.info(f"Successfully killed {service}")
                else:
                    logger.warning(f"Kill command for {service} returned: {kill_result.stderr}")

                time.sleep(1)

                # Step 2: Remove the service container
                logger.info(f"Removing {service} container")
                rm_result = subprocess.run(
                    ['docker-compose', '-f', compose_file, '-p', project_name, 'rm', '-f', service],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    env=env
                )
                
                if rm_result.returncode == 0:
                    logger.info(f"Successfully removed {service} container")
                else:
                    logger.warning(f"Remove command for {service} returned: {rm_result.stderr}")

                time.sleep(1)

                # Step 3: Start the service with updated environment variables
                logger.info(f"Starting {service} with CELERY_BROKER_URL={endpoint} and CELERY_RESULT_BACKEND={endpoint}")
                up_result = subprocess.run(
                    ['docker-compose', '-f', compose_file, '-p', project_name, 'up', '-d', '--no-deps', service],
                    capture_output=True,
                    text=True,
                    timeout=60,
                    env=env
                )

                if up_result.returncode == 0:
                    logger.info(f"Successfully started {service}")
                    logger.debug(f"Output: {up_result.stdout}")
                else:
                    logger.error(f"Failed to start {service}: {up_result.stderr}")

                # Small delay between service restarts
                time.sleep(2)

            except subprocess.TimeoutExpired:
                logger.error(f"Timeout while restarting {service}")
            except Exception as e:
                logger.error(f"Error restarting {service}: {e}")

    except Exception as e:
        logger.error(f"Failed to restart containers: {e}")

@app.post("/update_env/")
def update_env(request: UpdateEnvRequest, background_tasks: BackgroundTasks) -> JSONResponse:
    """
    Update environment variables in .env file and recreate affected Docker containers.
    """
    try:
        # Path to .env file at project root (mounted at /.env)
        env_file_path = Path("/.env")

        # Read existing .env file
        env_vars = {}
        if env_file_path.exists():
            with open(env_file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()

        # Update with new values
        env_vars.update(request.env_vars)

        # Write back to .env file
        with open(env_file_path, 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")

        logger.info(f"Updated .env file with: {request.env_vars}")

        # Get docker-compose file path and project name from container labels
        try:
            client = docker.from_env()
            container = client.containers.get('backend-app')
            labels = container.labels

            # The compose file is mounted at /docker-compose.yml inside the container
            compose_file = '/docker-compose.yml'
            project_name = labels.get('com.docker.compose.project', 'aafactory')

            # If compose_file is a comma-separated list, take the first one
            if ',' in compose_file:
                compose_file = compose_file.split(',')[0]

            logger.info(f"Using compose file: {compose_file}, project: {project_name}")

            # Read the updated CELERY_BROKER_URL from .env file
            celery_broker_url = env_vars.get('CELERY_BROKER_URL', 'redis://redis:6379/0')

            # Schedule container restart in background
            background_tasks.add_task(restart_containers_background, compose_file, project_name, celery_broker_url)

            # Return immediately after scheduling restart
            return JSONResponse({
                "message": "Environment variables updated. Services are restarting.",
                "updated_vars": list(request.env_vars.keys())
            })

        except Exception as e:
            logger.error(f"Failed to get docker-compose info: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get docker-compose configuration: {str(e)}"
            )

    except Exception as e:
        logger.error(f"Failed to update environment: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update environment: {str(e)}"
        )


@app.get("/health")
def health_check() -> JSONResponse:
    """Health check endpoint for container status verification."""
    return JSONResponse({"status": "healthy"})


if __name__ == "__main__":
    uvicorn.run(app)
