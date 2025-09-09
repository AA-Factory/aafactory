import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from processing.compute_audio_to_video import run_audio_to_video

app = FastAPI()

class TaskRequest(BaseModel):
    prompt: str
    image_bytes: bytes
    audio_bytes: bytes



@app.post("/prompt_image_audio_to_video/")
async def prompt_image_audio_to_video(request: TaskRequest) -> JSONResponse:
    result = run_audio_to_video(
        prompt=request.prompt,
        image_bytes=request.image_bytes,
        audio_bytes=request.audio_bytes
    )
    return JSONResponse(content={"message": result.decode('utf-8')})


if __name__ == "__main__":
    uvicorn.run(app)