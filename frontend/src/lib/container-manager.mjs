#!/usr/bin/env node

/**
 * Container Manager Script
 * Manages Docker containers: stop, rebuild, and restart
 */

import { execSync } from 'child_process';

class ContainerManager {
  /**
   * Execute a shell command and return the output
   */
  executeCommand(command) {
    try {
      const output = execSync(command, { encoding: 'utf-8' });
      return { success: true, output: output.trim() };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr?.toString() || '',
      };
    }
  }

  /**
   * Stop a container by name or ID
   */
  stopContainer(containerName) {
    console.log(`Stopping container: ${containerName}`);
    return this.executeCommand(`docker stop ${containerName}`);
  }

  /**
   * Remove a container by name or ID
   */
  removeContainer(containerName) {
    console.log(`Removing container: ${containerName}`);
    return this.executeCommand(`docker rm ${containerName}`);
  }

  /**
   * Rebuild and start a container using docker-compose
   */
  rebuildWithCompose(serviceName, composeFile = './docker-compose.yml') {
    console.log(`Rebuilding service: ${serviceName}`);
    const command = `docker compose -p aafactory -f ${composeFile} up -d ${serviceName} --no-deps`;
    return this.executeCommand(command);
  }

  /**
   * Stop and rebuild a specific service using docker-compose
   */
  stopAndRebuildCompose(serviceName, composeFile = './docker-compose.yml') {
    console.log(`Stopping and rebuilding service: ${serviceName}`);

    // Stop the service
    const stopResult = this.executeCommand(
      `docker compose -p aafactory -f ${composeFile} stop ${serviceName}`
    );

    if (!stopResult.success) {
      return stopResult;
    }

    // Rebuild and start
    return this.rebuildWithCompose(serviceName, composeFile);
  }

  /**
   * Rebuild a container from an image without docker-compose
   */
  rebuildContainer(containerName, imageName, options = {}) {
    console.log(`Rebuilding container: ${containerName} from image: ${imageName}`);

    // Stop and remove existing container
    this.stopContainer(containerName);
    this.removeContainer(containerName);

    // Build the docker run command
    let runCommand = `docker run -d --name ${containerName}`;

    if (options.ports) {
      options.ports.forEach(port => {
        runCommand += ` -p ${port}`;
      });
    }

    if (options.volumes) {
      options.volumes.forEach(volume => {
        runCommand += ` -v ${volume}`;
      });
    }

    if (options.env) {
      options.env.forEach(env => {
        runCommand += ` -e ${env}`;
      });
    }

    if (options.network) {
      runCommand += ` --network ${options.network}`;
    }

    runCommand += ` ${imageName}`;

    return this.executeCommand(runCommand);
  }

  /**
   * Get list of running containers
   */
  listContainers() {
    console.log('Listing running containers...');
    return this.executeCommand('docker ps --format "{{.ID}}|{{.Names}}|{{.Status}}"');
  }

  /**
   * Get container logs
   */
  getContainerLogs(containerName, lines = 100) {
    return this.executeCommand(`docker logs --tail ${lines} ${containerName}`);
  }

  /**
   * Restart all services in a docker-compose file
   */
  restartAllServices(composeFile = './docker-compose.yml') {
    console.log('Restarting all services...');
    return this.executeCommand(`docker compose -p aafactory -f ${composeFile} restart`);
  }

  /**
   * Pull latest image and rebuild
   */
  pullAndRebuild(imageName, containerName, options = {}) {
    console.log(`Pulling latest image: ${imageName}`);

    const pullResult = this.executeCommand(`docker pull ${imageName}`);
    if (!pullResult.success) {
      return pullResult;
    }

    return this.rebuildContainer(containerName, imageName, options);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new ContainerManager();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'stop':
      console.log(manager.stopContainer(args[1]));
      break;
    case 'rebuild-compose':
      console.log(manager.stopAndRebuildCompose(args[1], args[2]));
      break;
    case 'rebuild':
      console.log(manager.rebuildContainer(args[1], args[2]));
      break;
    case 'list':
      console.log(manager.listContainers());
      break;
    case 'logs':
      console.log(manager.getContainerLogs(args[1], args[2] || 100));
      break;
    default:
      console.log(`
Usage:
  node container-manager.js stop <container-name>
  node container-manager.js rebuild-compose <service-name> [compose-file]
  node container-manager.js rebuild <container-name> <image-name>
  node container-manager.js list
  node container-manager.js logs <container-name> [lines]
      `);
  }
}

export default ContainerManager;