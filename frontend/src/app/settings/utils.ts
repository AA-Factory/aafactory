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
