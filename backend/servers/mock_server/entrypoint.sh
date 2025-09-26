#!/bin/bash
set -e

uv run celery -A celery_worker.app worker --loglevel=info -Q mock -P solo 
