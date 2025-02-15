import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({ url: process.env.REDIS_URL }); // General Redis client
const pubClient = redisClient.duplicate(); // Publisher for pub/sub
const subClient = redisClient.duplicate(); // Subscriber for pub/sub

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
pubClient.on("error", (err) => console.error("Redis Pub Client Error:", err));
subClient.on("error", (err) => console.error("Redis Sub Client Error:", err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    await pubClient.connect();
    await subClient.connect();
    console.log("✅ Connected to Redis");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  }
};

process.on("SIGINT", async () => {
  await redisClient.quit();
  await pubClient.quit();
  await subClient.quit();
  console.log("🛑 Redis clients disconnected");
  process.exit(0);
});

connectRedis();

export { redisClient, pubClient, subClient }; // Export all clients
