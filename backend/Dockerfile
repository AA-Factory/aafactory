FROM python:3.12

WORKDIR /aafactory_backend

ARG BUILD_ENV=local
ENV BUILD_ENV=${BUILD_ENV}

RUN apt-get update && \
    # necessary for legolas to run
    apt-get install -y poppler-utils \
    python3-pip

RUN pip install uv

COPY server_to_url_mapping.json main.py celery_worker.py pyproject.toml uv.lock /aafactory_backend/

RUN uv sync

ENV PYTHONBUFFERED=1
EXPOSE 8000

