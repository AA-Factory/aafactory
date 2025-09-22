import json
import base64
from pydantic import BaseModel
from processing.compute_tts import run_text_to_speech

from celery import Celery
import os
REDIS_HOST = "localhost"
REDIS_PORT = 6379

app = Celery(
    "zonos_worker",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
)

class TaskRequest(BaseModel):
    voice_sample: str
    text: str
    language: str



@app.task(name="custom_voice_to_audio", queue="zonos")
def custom_voice_to_audio(text: str, voice_sample: str, language: str) -> str:
    result = run_text_to_speech(text=text, voice_sample=voice_sample, language=language)
    return result.decode('utf-8')
