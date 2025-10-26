FROM python:3.12

WORKDIR /backend

ARG BUILD_ENV=local
ENV BUILD_ENV=${BUILD_ENV}

RUN apt-get update && \
    # necessary for legolas to run
    apt-get install -y poppler-utils \
    docker.io \
    docker-compose \
    python3-pip

RUN pip install uv

COPY main.py Dockerfile celery_worker.py pyproject.toml uv.lock /backend/

RUN uv sync

ENV PYTHONBUFFERED=1
EXPOSE 8000

