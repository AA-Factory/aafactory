# Stage 1: Base image with common dependencies
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Prevents prompts from packages asking for user input during installation
ENV DEBIAN_FRONTEND=noninteractive
# Prefer binary wheels over source distributions for faster pip installations
ENV PIP_PREFER_BINARY=1
# Ensures output from python is printed immediately to the terminal without buffering
ENV PYTHONUNBUFFERED=1 
# Speed up some cmake builds
ENV CMAKE_BUILD_PARALLEL_LEVEL=8

# Install Python, git and other necessary tools
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    libglib2.0-0 \
    git \
    wget \
    libgl1 \
    && ln -sf /usr/bin/python3.10 /usr/bin/python \
    && ln -sf /usr/bin/pip3 /usr/bin/pip \
    && apt install -y espeak-ng

# Clean up to reduce image size
RUN apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install comfy-cli
RUN pip install comfy-cli

# Install ComfyUI
RUN /usr/bin/yes | comfy --workspace /comfyui install --cuda-version 11.8 --nvidia --version 0.3.30

# Change working directory to ComfyUI
WORKDIR /comfyui

# Install runpod
RUN pip install runpod requests poetry

# Support for the network volume
ADD src/extra_model_paths.yaml ./

# Go back to the root
WORKDIR /

# Add scripts
ADD server-requirements.txt pyproject.toml README.md src/start.sh src/restore_snapshot.sh src/rp_handler.py test_input.json ./
RUN chmod +x /start.sh /restore_snapshot.sh
RUN poetry install --no-root
RUN pip install -r server-requirements.txt 

# Optionally copy the snapshot file
ADD *snapshot*.json /

# Restore the snapshot to install custom nodes
RUN /restore_snapshot.sh

# Change working directory to ComfyUI
WORKDIR /comfyui
RUN pip install -r /comfyui/requirements.txt

# Create necessary directories
RUN mkdir -p models/checkpoints models/vae

# Install Zonos
RUN git clone https://github.com/BuffMcBigHuge/ComfyUI-Zonos /comfyui/custom_nodes/ComfyUI-Zonos
RUN cd /comfyui/custom_nodes/ComfyUI-Zonos && git submodule update --init --recursive
RUN cd /comfyui/custom_nodes/ComfyUI-Zonos && git clone https://github.com/Zyphra/Zonos.git
RUN pip install -r /comfyui/custom_nodes/ComfyUI-Zonos/requirements.txt

# Install civitdl and system dependencies
RUN pip3 install civitdl && \
    apt-get update -y && \
    apt-get install -y g++ build-essential libssl-dev libffi-dev python3-dev unzip && \
    rm -rf /var/lib/apt/lists/*

# Configure civitdl with API key
# Commented out until models are added
# COPY models /comfyui/models
RUN wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors -O /comfyui/models/checkpoints/sd_xl_base_1.0.safetensors

WORKDIR /

CMD ["/start.sh"]