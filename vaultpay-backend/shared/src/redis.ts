import Redis from 'ioredis';
import { logger } from './logger';

class RedisClient {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      RedisClient.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
      });

      RedisClient.instance.on('connect', () => {
        logger.info('Connected to Redis successfully');
      });

      RedisClient.instance.on('error', (err) => {
        logger.error({ err }, 'Redis connection error');
      });
    }
    return RedisClient.instance;
  }
}

export const getRedisClient = () => RedisClient.getInstance();
