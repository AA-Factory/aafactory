import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RUNPOD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RunPod API key not configured' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      templateId,
      podName,
      gpuCount = 1,
      vcpuCount = 16,
      computeType = 'GPU',
      globalNetworking = true,
      minRAMPerGPU = 48,
      minVCPUPerGPU,
      gpuTypeIds,
      ports = ['8888/http', '6379/tcp'],
      redisEndpoint,
    } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    if (!podName) {
      return NextResponse.json(
        { error: 'Pod name is required' },
        { status: 400 }
      );
    }

    // Build environment variables
    const env: Record<string, string> = {};
    if (redisEndpoint) {
      const [host, port] = redisEndpoint.split(':');
      env['REDIS_HOST'] = host;
      env['REDIS_PORT'] = port;
    }

    const payload = {
      name: podName,
      templateId,
      gpuCount,
      vcpuCount,
      computeType,
      globalNetworking,
      ports,
      minRAMPerGPU,
      minVCPUPerGPU,
      gpuTypeIds: [gpuTypeIds],
      ...(Object.keys(env).length > 0 && { env }),
    };
    console.log('✌️payload --->', payload);

    const response = await fetch('https://rest.runpod.io/v1/pods', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to deploy pod', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract Redis endpoint if this is a Redis pod
    let extractedRedisEndpoint = null;
    if (data.id && podName.toLowerCase().includes('redis')) {
      // Get pod details to extract the endpoint
      const podResponse = await fetch(`https://rest.runpod.io/v1/pods/${data.id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (podResponse.ok) {
        const podData = await podResponse.json();
        // Extract the external IP and port for Redis (typically port 6379)
        if (podData.runtime?.ports) {
          const redisPort = podData.runtime.ports.find((p: any) =>
            p.privatePort === 6379 || p.publicPort === 6379
          );
          if (redisPort && podData.runtime.gpus?.[0]?.publicIp) {
            extractedRedisEndpoint = `${podData.runtime.gpus[0].publicIp}:${redisPort.publicPort}`;
          }
        }
      }
    }

    return NextResponse.json({
      ...data,
      redisEndpoint: extractedRedisEndpoint,
    });
  } catch (error) {
    console.error('Failed to deploy RunPod pod:', error);
    return NextResponse.json(
      { error: 'Failed to deploy RunPod pod' },
      { status: 500 }
    );
  }
}
