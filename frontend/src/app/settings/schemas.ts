import { z } from 'zod';

const REDIS_ENDPOINT_REGEX = /^(\d{1,3}\.){3}\d{1,3}:\d+$/;

export const redisSettingsSchema = z.object({
  redisEndpoint: z
    .string()
    .min(1, 'Redis endpoint is required')
    .refine(
      (value) => value === 'redis:6379' || REDIS_ENDPOINT_REGEX.test(value),
      {
        message:
          'Endpoint must be redis:6379 or an IP:port format (e.g., 123.45.67.89:6379)',
      },
    ),
});

export type RedisSettingsFormData = z.infer<typeof redisSettingsSchema>;
