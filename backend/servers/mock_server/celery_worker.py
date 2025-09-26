import json
from time import sleep
from celery import Celery
import os


REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = os.getenv("REDIS_PORT", 6379)

app = Celery(
    "mock_worker",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
)


@app.task(name="custom_voice_to_audio", queue="mock")
def custom_voice_to_audio(prompt: str, voice_bytes: str, language: str) -> str:
    with open("mock_responses.json", "r", encoding="utf-8") as f:
        responses = json.load(f)  # Parse JSON into a Python dict
    sleep(120)
    return responses["custom_voice_to_audio"]


@app.task(name="prompt_image_audio_to_video", queue="mock")
def prompt_image_audio_to_video(prompt: str, image_bytes: str, audio_bytes: str) -> str:
    with open("mock_responses.json", "r", encoding="utf-8") as f:
        responses = json.load(f)  # Parse JSON into a Python dict
    sleep(120)
    return responses["prompt_image_audio_to_video"]
