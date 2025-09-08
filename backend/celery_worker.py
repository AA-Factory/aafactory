import json
from celery import Celery
import os
import requests
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

@app.task(name="send_task_to_server")
def send_task_to_server(task_name: str, payload: dict) -> str:
    with open(SERVER_TO_URL_MAPPING_PATH, "r") as f:
        server_to_url_mapping = json.load(f)
    endpoint_url = server_to_url_mapping[task_name]
    logger.info(f"Sending task to {endpoint_url} with payload: {payload}")
    response = requests.post(endpoint_url, json={"payload": payload})
    return response.json()