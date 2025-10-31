# AI Avatar Factory

**Create and manage AI-powered avatars with ease.**

[![Website](https://img.shields.io/badge/website-aafactory.xyz-blue?style=for-the-badge)](https://aafactory.xyz/)
[![Discord](https://img.shields.io/badge/join-discord-7289DA?style=for-the-badge&logo=discord)](https://discord.gg/C2Rjy8Q2ER)

---

## Tutorial video

[![Tutorial: AI Avatar Factory — Quick Start](https://img.youtube.com/vi/YRMNtwCiU_U/maxresdefault.jpg)](https://www.youtube.com/watch?v=YRMNtwCiU_U)

Official quick-start walkthrough (10 min). Follow along to clone the repo, configure Redis (local or remote), start services with Docker Compose, and create your first AI avatar.

---

## What is AI Avatar Factory?

AI Avatar Factory is a platform for creating and managing AI avatars. Whether you're building virtual assistants, digital characters, or interactive AI personalities, this tool provides an easy-to-use interface with powerful video editing capabilities.

**Key Features:**

- 🎭 Create custom AI avatars
- 🎬 Built-in video editor
- 🤖 Support for multiple AI models
- 🚀 Easy deployment with Docker
- 🌐 Remote Redis support for distributed processing

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- (Optional) Remote Redis server for distributed processing

### Quick Start (5 minutes)

**1. Download the code**

```bash
git clone <repository-url>
cd aafactory
```

**2. Configure Redis (Important)**

You can use either local or remote Redis:

**Option A: Local Redis (Development)**

```bash
docker-compose --profile local up
```

**Option B: Remote Redis (Recommended for Production)**

Remote Redis enables distributed processing across multiple servers. To connect:

1. Get your Redis URL from your remote server (e.g., RunPod dashboard):

   ![Select Remote URL Screenshot](assets/select_remote_redis_url_in_running_pod.png)

2. Start the application and set the redis URL in the frontend settings:

   ```bash
   docker-compose --profile local up
   ```

3. Share the same Redis URL with other running instances for distributed processing:

   ![Share URL Screenshot](assets/share_redis_url_to_remote_instances.png)

**3. Access the application**

Once running, access these services:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Celery Flower (Task Monitor)**: http://localhost:5556

### Stopping the Application

Press `Ctrl+C` in the terminal, then run:

```bash
docker-compose down
```

---

## Service Architecture

### Core Services

| Service     | Port  | Purpose                   |
| ----------- | ----- | ------------------------- |
| Frontend    | 3000  | Next.js user interface    |
| Backend API | 8000  | FastAPI REST API          |
| MongoDB     | 27017 | Database                  |
| Redis       | 6379  | Cache & message broker    |
| Flower      | 5556  | Task monitoring dashboard |

### System Flow

```mermaid
sequenceDiagram
    participant Client
    participant FastAPI as FastAPI Container
    participant Redis as Redis (Remote)<br/>redis:6379
    participant RouterWorker as Router Worker<br/>(local queue)
    participant InfiniteTalk as infinite_talk Worker<br/>(infinite_talk queue)
    participant Zonos as zonos Worker<br/>(zonos queue)

    Client->>FastAPI: HTTP Request with task
    FastAPI->>Redis: Enqueue send_task_to_server<br/>queue: "local"

    Redis->>RouterWorker: Poll task from "local" queue
    RouterWorker->>RouterWorker: Execute send_task_to_server()<br/>server_name, task_name, payload

    alt Route to infinite_talk
        RouterWorker->>Redis: app.send_task()<br/>queue: "infinite_talk"
        Redis->>InfiniteTalk: Poll from "infinite_talk" queue
        InfiniteTalk->>InfiniteTalk: Process task_name<br/>with payload
        InfiniteTalk->>Redis: Store result
        Redis->>RouterWorker: Return task.id
    else Route to zonos
        RouterWorker->>Redis: app.send_task()<br/>queue: "zonos"
        Redis->>Zonos: Poll from "zonos" queue
        Zonos->>Zonos: Process task_name<br/>with payload
        Zonos->>Redis: Store result
        Redis->>RouterWorker: Return task.id
    end

    RouterWorker->>Redis: Return task.id
    Redis->>FastAPI: Task result (task.id)
    FastAPI->>Client: HTTP Response with task.id

    Note over Client,Redis: Polling Phase

    loop Poll for result
        Client->>FastAPI: GET /task_status/{task_id}
        FastAPI->>Redis: Check task status/result
        Redis->>FastAPI: Status (PENDING/SUCCESS/result)
        FastAPI->>Client: Response (status or result)
    end
```

---

## Advanced Usage

### Docker Compose Profiles

Run different combinations of services based on your needs:

| Profile           | Command                                       | Services                              |
| ----------------- | --------------------------------------------- | ------------------------------------- |
| **Full Local**    | `docker-compose --profile local up`           | Frontend + Backend + Database + Queue |
| **Frontend Only** | `docker-compose --profile frontend up`        | Next.js app + MongoDB                 |
| **Backend Only**  | `docker-compose --profile backend-local up`   | API + Redis + Celery                  |
| **Everything**    | `docker-compose --profile local --profile up` | All services                          |

### Useful Commands

**View logs from a specific service:**

```bash
docker-compose logs -f backend
```

**Restart a single service:**

```bash
docker-compose restart frontend
```

**Rebuild after updates:**

```bash
docker-compose --profile local up --build
```

**Check running containers:**

```bash
docker-compose ps
```

**Clean everything and start fresh:**

```bash
docker-compose down -v
docker system prune -a
```

---

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Fabric.js
- **Backend**: FastAPI, Python, UV package manager
- **Database**: MongoDB
- **Queue**: Celery with Redis
- **Deployment**: Docker Compose

### Project Structure

```
aafactory/
├── frontend/          # Next.js application
├── backend/           # FastAPI server
├── docker-compose.yml # Service orchestration
└── README.md         # This file
```

---

## Troubleshooting

**Port already in use?**

```bash
# Find what's using the port
lsof -i :3000
# Kill it or change the port in docker-compose.yml
```

**Container won't start?**

```bash
# View detailed error logs
docker-compose logs [service-name]
```

**Need to reset everything?**

```bash
docker-compose down -v
docker system prune -a
```

**Still stuck?**
Join our [Discord](https://discord.gg/C2Rjy8Q2ER) for help!

---

## Contributing

We welcome contributions! Join our [Discord community](https://discord.gg/C2Rjy8Q2ER) to:

- Ask questions and get support
- Report bugs and suggest features
- Share your avatars and projects
- Collaborate with other developers

---

## Credits

Video editor component based on [fabric-video-editor](https://github.com/AmitDigga/fabric-video-editor).
