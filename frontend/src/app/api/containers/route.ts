// frontend/src/app/api/containers/route.ts
import { NextResponse } from 'next/server';
import ContainerManager from '@/lib/container-manager.mjs';

export async function POST(request: Request) {
  const body = await request.json();
  const { action, containerName, serviceName, imageName, composeFile, options } = body;

  const manager = new ContainerManager();

  try {
    let result;

    switch (action) {
      case 'stop':
        result = manager.stopContainer(containerName);
        break;

      case 'rebuild-compose':
        result = manager.stopAndRebuildCompose(serviceName, composeFile || '/docker-compose.yml');
        break;

      case 'rebuild':
        result = manager.rebuildContainer(containerName, imageName, options || {});
        break;

      case 'pull-and-rebuild':
        result = manager.pullAndRebuild(imageName, containerName, options || {});
        break;

      case 'list':
        result = manager.listContainers();
        break;

      case 'logs':
        result = manager.getContainerLogs(containerName, options?.lines || 100);
        break;

      case 'restart-all':
        result = manager.restartAllServices(composeFile || '/docker-compose.yml');
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ success: true, data: result.output });
    } else {
      return NextResponse.json(
        { success: false, error: result.error, stderr: result.stderr },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}