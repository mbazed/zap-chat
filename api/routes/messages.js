import express from "express";
import { getCachedMessages, cacheMessages } from "../utils/messageCache.js"; // Or move these to a separate util
import Message from "../models/message.js";

const router = express.Router();

// Get messages for conversation (with Redis caching)
router.get("/:conversationId", async (req, res) => {
  try {
    const cached = await getCachedMessages(req.params.conversationId);
    if (cached) return res.json(cached);

    const messages = await Message.findAll({
      where: { conversation_id: req.params.conversationId },
      order: [["created_at", "ASC"]],
    });

    await cacheMessages(req.params.conversationId, messages);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

export default router;
