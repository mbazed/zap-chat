import express from "express";
import { redisClient } from "../utils/redis.js"; // ✅ Import Redis client

const router = express.Router();

// Get Online Users
router.get("/online-users", async (req, res) => {
  try {
    const keys = await redisClient.keys("user:*:status"); // Get all user status keys
    const onlineUsers = [];

    for (const key of keys) {
      const userId = key.split(":")[1]; // Extract user ID from key
      const status = await redisClient.get(key);
      if (status === "online") {
        onlineUsers.push(userId);
      }
    }

    res.json({ onlineUsers });
  } catch (error) {
    console.error("❌ Error fetching online users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
