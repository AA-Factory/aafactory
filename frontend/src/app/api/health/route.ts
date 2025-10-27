import { NextResponse } from 'next/server';

export async function GET() {
  const healthChecks = await Promise.allSettled([
    // Check backend-app
    fetch('http://backend-app:8000/health', {
      signal: AbortSignal.timeout(5000)
    }).then(r => ({ service: 'backend', status: r.ok ? 'healthy' : 'unhealthy' })),

    // Check Flower
    fetch('http://flower:5555/healthcheck', {
      signal: AbortSignal.timeout(5000)
    }).then(r => ({ service: 'flower', status: r.ok ? 'healthy' : 'unhealthy' })),

    // Check Celery worker (via backend endpoint - see below)
    fetch('http://backend-app:8000/celery/health', {
      signal: AbortSignal.timeout(5000)
    }).then(r => ({ service: 'celery-worker', status: r.ok ? 'healthy' : 'unhealthy' })),
  ]);

  const results = healthChecks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      service: ['backend', 'flower', 'celery-worker'][index],
      status: 'unhealthy',
      error: result.reason.message
    };
  });

  const allHealthy = results.every(r => r.status === 'healthy');

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      services: results,
      timestamp: new Date().toISOString()
    },
    { status: allHealthy ? 200 : 503 }
  );
}