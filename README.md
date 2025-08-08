# AI Avatar Factory

⚡ AI Avatar Factory is an interface for creating and managing AI avatars. ⚡

[![Website](https://img.shields.io/badge/website-000000?style=for-the-badge&logo=AAFactory.xyz&logoColor=white
)](https://aafactory.xyz/)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/C2Rjy8Q2ER)

## Development Setup

Choose one of the following development approaches:

### Option 1: Docker Development (Recommended)

#### Prerequisites
- Docker
- Docker Compose

#### Setup Steps

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd ai-avatar-factory
   ```

2. Build the container
   ```bash
   docker-compose build
   ```

3. Start the container
   ```bash
   docker-compose up
   ```

The application will be available at the configured port once the containers are running.

### Option 2: Local Development

#### Prerequisites
- Node.js (recommended version: 18+ or latest LTS)
- MongoDB

#### Setup Steps

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd ai-avatar-factory
   ```

2. Install Node.js
   - Download and install from [nodejs.org](https://nodejs.org/)
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

3. Set up MongoDB locally
   ```bash
   chmod +x scripts/install-mongodb-local.sh
   ./scripts/install-mongodb-local.sh
   ```

4. Install project dependencies
   ```bash
   npm install
   ```

5. Start MongoDB service
   ```bash
   mongod
   ```

6. Start the development server
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000` (or the configured port). The MongoDB service should be running in the background.

## Additional Resources

- [MongoDB Community Download](https://www.mongodb.com/try/download/community)

## Notes

The video editor component was initially cloned from: [fabric-video-editor](https://github.com/AmitDigga/fabric-video-editor/issues)

## Contributing

Join our [Discord community](https://discord.gg/C2Rjy8Q2ER) for discussions and support.