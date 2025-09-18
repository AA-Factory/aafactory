#!/bin/bash
set -e


uv run huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./weights/Wan2.1-I2V-14B-480P &
uv run huggingface-cli download TencentGameMate/chinese-wav2vec2-base --local-dir ./weights/chinese-wav2vec2-base & 
uv run huggingface-cli download TencentGameMate/chinese-wav2vec2-base model.safetensors --revision refs/pr/1 --local-dir ./weights/chinese-wav2vec2-base & 
uv run huggingface-cli download MeiGen-AI/InfiniteTalk --local-dir ./weights/InfiniteTalk &
# Start redis-server in the background
redis-server --protected-mode no &

uv run celery -A celery_worker.app worker --loglevel=info -Q infinite_talk -P solo &

# Start the Python app
uv run uvicorn --host 0.0.0.0 --port 8001 main:app
