# AI Avatar Factory

⚡ AI Avatar Factory is an interface for creating and managing AI avatars. ⚡

[![Website](https://img.shields.io/badge/website-000000?style=for-the-badge&logo=AAFactory.xyz&logoColor=white)](https://aafactory.xyz/)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/C2Rjy8Q2ER)

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Git

### Setup and Run

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd aafactory
   ```

2. **Configure environment variables**
   By default, the application uses a local Redis instance. To connect to a remote Redis server (e.g., RunPod):

   ```bash
   # Use remote Redis endpoint
   RUNPOD_ENDPOINT=213.173.99.24:36261 docker-compose --profile local up
   ```

   When `RUNPOD_ENDPOINT` is not set, the application defaults to:

   - Local Redis (`redis:6379`)
   - Mock server mode enabled (`NEXT_PUBLIC_MOCK_SERVER=true`)

3. **Build and start the application (first time)**

   ```bash
   docker-compose --profile local up --build
   ```

4. **Start the application (subsequent runs)**

   ```bash
   docker-compose --profile local up
   ```

5. **Access the application**
   - **Frontend (Next.js)**: http://localhost:3000
   - **Backend API (FastAPI)**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **MongoDB**: localhost:27017
   - **Redis**: localhost:6379
   - **Celery Flower (Task Monitor)**: http://localhost:5556
   - **Infinite Talk Server**: http://localhost:8001 _(requires `--profile servers`)_
   - **Zonos Server**: http://localhost:8002 _(requires `--profile servers`)_

## What's Available

### Core Services

- **Next.js Frontend** (Port 3000): Modern React-based user interface with video editing capabilities
- **FastAPI Backend** (Port 8000): Python API server with automatic documentation
- **MongoDB** (Port 27017): Document database for flexible data storage
- **Redis** (Port 6379): In-memory data store for caching and message brokering

### Development Tools

- **Celery Worker**: Background task processing for heavy operations
- **Flower** (Port 5556): Real-time monitoring of Celery tasks

## Service Profiles

The application uses Docker Compose profiles to run different combinations of services:

### Available Profiles

**Local Development (Recommended)**

```bash
docker-compose --profile local up --build
```

Includes: Frontend, Backend API, MongoDB, Redis, Celery, Flower
_Excludes AI servers (infinite-talk-server, zonos-server)_

**Frontend Only**

```bash
docker-compose --profile frontend up --build
```

Includes: Next.js frontend + MongoDB

**Backend Only**

```bash
docker-compose --profile backend-local up --build
```

Includes: FastAPI, Redis, Celery, Flower

**AI Servers Only**

```bash
docker-compose --profile servers up --build
```

Includes: infinite-talk-server, zonos-server (requires GPU)

**Everything**

```bash
docker-compose --profile local --profile servers up --build
```

Includes all services

## Development Commands

### Stop all services

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f [service-name]
```

### Rebuild specific profile

```bash
docker-compose --profile [profile-name] up --build
```

## Architecture

- **Frontend**: Next.js with TypeScript, Tailwind CSS, and Fabric.js for video editing
- **Backend**: FastAPI with Python, using UV for dependency management
- **Task Queue**: Celery with Redis for background processing
- **Databases**: MongoDB for documents
- **Containerization**: Docker Compose for local development

## Additional Resources

- [MongoDB Community Download](https://www.mongodb.com/try/download/community)

## Notes

The video editor component was initially cloned from: [fabric-video-editor](https://github.com/AmitDigga/fabric-video-editor/issues)

## Contributing

Join our [Discord community](https://discord.gg/C2Rjy8Q2ER) for discussions and support.
