from celery import Celery
import os
from loguru import logger
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(".env")

app = Celery(
    "worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0"),
)
SERVER_TO_URL_MAPPING_PATH = Path("server_to_url_mapping.json")

@app.task(name="send_task_to_server", queue="local")
def send_task_to_server(server_name: str, task_name: str, payload: dict) -> str:
    logger.info(f"Sending task to {server_name} for task: {task_name}")
    task = app.send_task(
        task_name,
        kwargs=payload,
        queue=server_name  # 👈 match the worker queue
    )
    return task.id
