.PHONY: dev prod up-dev up-prod down clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev          - Set up .env for development (local redis)"
	@echo "  make prod         - Set up .env for production (remote redis)"
	@echo "  make up-dev       - Start development services"
	@echo "  make up-prod      - Start production services"
	@echo "  make down         - Stop all services"
	@echo "  make clean        - Stop and remove all containers, volumes, and networks"
	@echo ""
	@echo "Quick start:"
	@echo "  make dev && make up-dev      # For local development"
	@echo "  make prod && make up-prod    # For production"

# Copy dev environment file to .env
dev:
	@echo "Setting up development environment..."
	@cp .env.dev .env
	@echo "✓ Development environment configured"

# Copy prod environment file to .env
prod:
	@echo "Setting up production environment..."
	@cp .env.prod .env
	@echo "✓ Production environment configured"

# Start development services (frontend-app-dev, backend, redis, mongodb)
up-dev:
	@echo "Starting development services..."
	docker compose --profile local up -d
	@echo "✓ Development services started"

# Start production services (frontend-app, backend, redis, mongodb)
up-prod:
	@echo "Starting production services..."
	docker compose --profile frontend-prod up -d
	@echo "✓ Production services started"

# Stop all services
down:
	@echo "Stopping all services..."
	docker compose --profile local --profile frontend-prod down
	@echo "✓ All services stopped"

# Clean up everything
clean:
	@echo "Cleaning up all containers, volumes, and networks..."
	docker compose --profile local --profile frontend-prod down -v
	@echo "✓ Cleanup complete"

# Rebuild a specific service
rebuild-%:
	@echo "Rebuilding service: $*..."
	docker compose build $*
	docker compose up -d $*
	@echo "✓ Service $* rebuilt"
