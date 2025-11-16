export interface RedisEndpointParsed {
  host: string;
  port: string;
}

export const parseRedisEndpoint = (
  endpoint: string,
): RedisEndpointParsed | null => {
  if (endpoint === 'redis:6379') return null;
  const parts = endpoint.split(':');
  if (parts.length === 2) {
    return { host: parts[0], port: parts[1] };
  }
  return null;
};

export const isMockMode = (endpoint: string): boolean => {
  return endpoint === 'redis:6379';
};

export const formatRedisEnvVars = (parsed: RedisEndpointParsed): string => {
  return `REDIS_HOST=${parsed.host}\nREDIS_PORT=${parsed.port}`;
};


//a function that takes publicIp and portMappings and returns the full endpoint URL
export const buildRedisEndpoint = (pod: {
  publicIp?: string;
  portMappings?: Record<string, string | number>
}): string | null => {
  if (!pod.publicIp || !pod.portMappings) return null;
  // Assuming Redis port is the first port in portMappings
  const redisPort = Object.values(pod.portMappings)[0];
  return `${pod.publicIp}:${redisPort}`;
}

export const checkforRedisInEnvVars = (
  envVars: Record<string, string>,
): boolean => {
  return 'REDIS_HOST' in envVars && 'REDIS_PORT' in envVars;
};