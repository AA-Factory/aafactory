#!/bin/bash
set -e

# Start redis-server in the background
redis-server --protected-mode no &

uv run celery -A celery_worker.app worker --loglevel=info -Q zonos -P solo
