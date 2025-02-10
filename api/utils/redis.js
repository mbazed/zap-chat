import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
};

process.on('SIGINT', async () => {
  await redisClient.quit();
  console.log('Redis client disconnected');
  process.exit(0);
});

connectRedis();

export default redisClient;
