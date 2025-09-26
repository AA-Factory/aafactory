from processing.compute_tts import run_text_to_speech

from celery import Celery
import os


REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", 6379)

app = Celery(
    "zonos_worker",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
)


@app.task(name="custom_voice_to_audio", queue="zonos")
def custom_voice_to_audio(prompt: str, voice_bytes: str, language: str) -> str:
    result = run_text_to_speech(prompt=prompt, voice_bytes=voice_bytes, language=language)
    return result.decode('utf-8')
