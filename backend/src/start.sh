#!/usr/bin/env bash

# Use libtcmalloc for better memory management
TCMALLOC="$(ldconfig -p | grep -Po "libtcmalloc.so.\d" | head -n 1)"
export LD_PRELOAD="${TCMALLOC}"

# Serve the API and don't shutdown the container
if [ "$SERVE_API_LOCALLY" == "true" ]; then
    echo "runpod-worker-comfy: Starting ComfyUI DEV"
    poetry run python3 /comfyui/main.py --disable-auto-launch --disable-metadata --listen --cpu &

    echo "runpod-worker-comfy: Starting RunPod Handler DEV"
    poetry run python3 -u /rp_handler.py --rp_serve_api --rp_api_host=0.0.0.0
else
    echo "runpod-worker-comfy: Starting ComfyUI PROD"
    poetry run python3 /comfyui/main.py --disable-auto-launch --disable-metadata &

    echo "runpod-worker-comfy: Starting RunPod Handler PROD"
    poetry run python3 -u /rp_handler.py
fi