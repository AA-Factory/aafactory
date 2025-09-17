import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from celery_worker import prompt_image_audio_to_video

app = FastAPI()

class TaskRequest(BaseModel):
    prompt: str
    image_bytes: str
    audio_bytes: str


@app.post("/run_task/")
def run_task(request: TaskRequest) -> JSONResponse:
    task = prompt_image_audio_to_video.delay(prompt=request.prompt, image_bytes=request.image_bytes, audio_bytes=request.audio_bytes)
    return JSONResponse({"task_id": task.id, "status": task.status})

@app.get("/task_status/{task_id}")
def task_status(task_id: str) -> JSONResponse:
    task = prompt_image_audio_to_video.AsyncResult(task_id)
    
    response = {
        "task_id": task.id,
        "status": task.status,
    }
    
    if task.status == "SUCCESS":
        response["result"] = task.result  # result is available after success
    
    return JSONResponse(response)

if __name__ == "__main__":
    uvicorn.run(app)