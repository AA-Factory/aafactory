#!/usr/bin/env bash

# Use libtcmalloc for better memory management
TCMALLOC="$(ldconfig -p | grep -Po "libtcmalloc.so.\d" | head -n 1)"
export LD_PRELOAD="${TCMALLOC}"

# Serve the API and don't shutdown the container

echo "runpod-worker-comfy: Starting ComfyUI PROD"
echo "JUPYTER_PASSWORD: $JUPYTER_PASSWORD"

# Start jupyter lab
echo "Starting Jupyter Lab..."
mkdir -p /workspace && \
cd / && \
nohup python3 -m jupyter lab --allow-root --no-browser --port=8888 --ip=* --FileContentsManager.delete_to_trash=False --ServerApp.terminado_settings='{"shell_command":["/bin/bash"]}' --ServerApp.token=$JUPYTER_PASSWORD --ServerApp.allow_origin=* --ServerApp.preferred_dir=/workspace &> /jupyter.log &
echo "Jupyter Lab started"

# Download models
huggingface-cli download LeonJoe13/Sonic --local-dir  ./models/sonic
huggingface-cli download stabilityai/stable-video-diffusion-img2vid-xt --local-dir  ./models/sonic/stable-video-diffusion-img2vid-xt
huggingface-cli download openai/whisper-tiny --local-dir ./models/sonic/whisper-tiny
mv models/sonic/stable-video-diffusion-img2vid-xt/svd_xt.safetensors models/checkpoints/
mv models/sonic/Sonic/* models/sonic/

poetry run python3 /comfyui/main.py --disable-auto-launch --disable-metadata &

echo "runpod-worker-comfy: Starting RunPod Handler PROD"
python3 -u /rp_handler.py