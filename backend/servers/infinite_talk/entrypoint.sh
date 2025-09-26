#!/bin/bash
set -e


uv run hf download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./weights/Wan2.1-I2V-14B-480P &
uv run hf download TencentGameMate/chinese-wav2vec2-base --local-dir ./weights/chinese-wav2vec2-base & 
uv run hf download TencentGameMate/chinese-wav2vec2-base model.safetensors --revision refs/pr/1 --local-dir ./weights/chinese-wav2vec2-base & 
uv run hf download MeiGen-AI/InfiniteTalk --local-dir ./weights/InfiniteTalk &

# Wait for all background downloads to finish
wait

# Start redis-server in the background
redis-server --protected-mode no &

uv run celery -A celery_worker.app worker --loglevel=info -Q infinite_talk -P solo
