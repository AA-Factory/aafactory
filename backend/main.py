from typing import Any, Literal, Dict
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from celery_worker import send_task_to_server

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://react:3000"],  # React container
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskRequest(BaseModel):
    server_name: Literal["infinite_talk", "zonos"]
    task_name: Literal["prompt_image_audio_to_video", "custom_voice_to_audio"]
    payload: Dict[str, Any]


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
    
    if task.status == "SUCCESS":
        response["result"] = task.result  # result is available after success
    
    return JSONResponse(response)

if __name__ == "__main__":
    uvicorn.run(app)