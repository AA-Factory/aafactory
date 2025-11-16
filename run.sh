#!/bin/bash

# Script to run docker-compose in normal or test mode
# Usage: ./run.sh [test]

if [ "$1" == "test" ]; then
    echo "Starting in TEST mode..."
    docker-compose --profile local --env-file .env.test up
else
    echo "Starting in NORMAL mode..."
    docker-compose --profile local up
fi
