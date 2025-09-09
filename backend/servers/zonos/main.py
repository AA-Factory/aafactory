import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from processing.compute_tts import run_text_to_speech

app = FastAPI()

class TaskRequest(BaseModel):
    voice_sample: str
    text: str
    language: str


class Response(BaseModel):
    bytes: str


@app.post("/custom_voice_to_audio/")
async def custom_voice_to_audio(request: TaskRequest) -> JSONResponse:
    result = run_text_to_speech(
        voice_sample=request.voice_sample,
        text=request.text,
        language=request.language
    )
    return JSONResponse(content={"message": result.decode('utf-8')})


if __name__ == "__main__":
    uvicorn.run(app)