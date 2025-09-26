import json
import base64
from infinite_talk.processing.compute_audio_to_video import run_audio_to_video

from celery import Celery
import os


REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", 6379)

app = Celery(
    "infinite_talk_worker",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
)

@app.task(name="prompt_image_audio_to_video", queue="infinite_talk")
def prompt_image_audio_to_video(prompt: str, image_bytes: str, audio_bytes: str, config: str = "low_vram") -> str:
    image_path = f"examples/single/temp_image.png"
    audio_path = f"examples/single/temp_audio.wav"

    image_bytes = base64.b64decode(image_bytes)
    audio_bytes = base64.b64decode(audio_bytes)

    with open(image_path, "wb") as img_file:
        img_file.write(image_bytes)
    with open(audio_path, "wb") as aud_file:
        aud_file.write(audio_bytes)
    with open("single_example_image.json", "r") as f:
        data = json.load(f)

    data["prompt"] = prompt
    data["cond_video"] = image_path
    data["cond_audio"]["person1"] = audio_path

    with open("single_example_image.json", "w") as f:
        json.dump(data, f, indent=2)
    result = run_audio_to_video(config=config)
    return result.decode('utf-8')
