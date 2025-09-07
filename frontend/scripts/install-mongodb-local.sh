#!/bin/bash

set -e

# Configuration
MONGO_VERSION="8.0.11"  # Change to desired version
ARCHITECTURE="arm64"    # Use "x86_64" if you're on Intel
DOWNLOAD_URL="https://fastdl.mongodb.org/osx/mongodb-macos-${ARCHITECTURE}-${MONGO_VERSION}.tgz"
INSTALL_DIR="/usr/local/mongodb"
DATA_DIR="$HOME/mongodb-data"
ALIAS_COMMAND='alias mongod="mongod --dbpath=$HOME/mongodb-data"'

echo "Downloading MongoDB $MONGO_VERSION..."
curl -LO "$DOWNLOAD_URL"

ARCHIVE_NAME=$(basename "$DOWNLOAD_URL")

echo "Extracting..."
tar -zxvf "$ARCHIVE_NAME"

EXTRACTED_DIR=$(tar -tf "$ARCHIVE_NAME" | head -1 | cut -f1 -d"/")

echo "Installing to $INSTALL_DIR..."
sudo rm -rf "$INSTALL_DIR"
sudo mv "$EXTRACTED_DIR" "$INSTALL_DIR"

echo "Cleaning up..."
rm "$ARCHIVE_NAME"

# Add MongoDB to PATH in shell config
SHELL_CONFIG=""
if [[ "$SHELL" == *"zsh" ]]; then
  SHELL_CONFIG="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash" ]]; then
  SHELL_CONFIG="$HOME/.bash_profile"
fi

if [ -n "$SHELL_CONFIG" ]; then
  if ! grep -q 'export PATH="/usr/local/mongodb/bin:$PATH"' "$SHELL_CONFIG"; then
    echo "Adding MongoDB to PATH..."
    echo 'export PATH="/usr/local/mongodb/bin:$PATH"' >> "$SHELL_CONFIG"
  fi

  if ! grep -Fxq "$ALIAS_COMMAND" "$SHELL_CONFIG"; then
    echo "Adding mongod alias..."
    echo "$ALIAS_COMMAND" >> "$SHELL_CONFIG"
  fi

  source "$SHELL_CONFIG"
else
  echo "Warning: Add this to your shell config manually:"
  echo 'export PATH="/usr/local/mongodb/bin:$PATH"'
  echo "$ALIAS_COMMAND"
fi

# Create data directory
if [ ! -d "$DATA_DIR" ]; then
  echo "Creating data directory..."
  mkdir -p "$DATA_DIR"
fi