#!/bin/bash
set -e

# Start redis-server in the background
redis-server --protected-mode no &

uv run celery -A celery_worker.app worker --loglevel=info -Q infinite_talk -P solo &

# Start the Python app
uv run uvicorn --host 0.0.0.0 --port 8001 main:app
