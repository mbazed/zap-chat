import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter"; // Redis Adapter
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import messageRoutes from "./routes/messages.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { pubClient, subClient, redisClient } from "./utils/redis.js"; // Import Redis clients
import { getCachedMessages, cacheMessages } from "./utils/messageCache.js";
import Participant from "./models/participant.js";
import Message from "./models/message.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

const MESSAGE_STATUS = {
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
};

const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;
  console.log("Received Token:", token);
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication failed"));
    socket.userId = decoded.id;
    next();
  });
};

// Use Redis Adapter for Socket.io Scaling (Only needed for multiple servers)
// io.adapter(createAdapter(pubClient, subClient));

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);

io.use(socketAuthMiddleware);
// WebSocket Events
io.on("connection", async (socket) => {
  try {
    const userId = socket.userId;
    console.log(`🔵 User Connected: ${userId}`);

    // Set user online status in Redis
    await redisClient.set(`user:${userId}:status`, "online", "EX", 300); // Auto-expire after 5 minutes
    await redisClient.sAdd("online_users", userId);
    // Broadcast to other users that this user is online
    socket.broadcast.emit("userOnline", { userId });

    const userConversations = await Participant.findAll({
      where: { user_id: userId },
      attributes: ["conversation_id"],
    });

    userConversations.forEach((p) => {
      socket.join(`conversation_${p.conversation_id}`);
      console.log(`🚪 User ${userId} joined conversation ${p.conversation_id}`);
    });

    socket.on("sendMessage", async ({ content, conversationId }, ack) => {
      try {
        const isParticipant = await Participant.findOne({
          where: { user_id: userId, conversation_id: conversationId },
        });
        if (!isParticipant) throw new Error("Not in conversation");

        const message = await Message.create({
          content: content.trim(),
          sender_id: userId,
          conversation_id: conversationId,
        });

        const cachedMessages = (await getCachedMessages(conversationId)) || [];
        await cacheMessages(conversationId, [...cachedMessages, message]);

        io.to(`conversation_${conversationId}`).emit("receiveMessage", {
          ...message.get(),
          status: MESSAGE_STATUS.SENT,
        });

        io.to(`conversation_${conversationId}`).emit("messageStatus", {
          messageId: message.id,
          status: MESSAGE_STATUS.DELIVERED,
        });

        ack({ success: true, message });
      } catch (error) {
        console.error("Message error:", error);
        ack({ success: false, error: error.message });
      }
    });

    socket.on("markAsRead", async (messageIds) => {
      await Message.update(
        { status: MESSAGE_STATUS.READ },
        { where: { id: messageIds } }
      );

      // Notify sender
      messageIds.forEach((messageId) => {
        io.emit("messageStatus", {
          messageId,
          status: MESSAGE_STATUS.READ,
        });
      });
    });

    let typingTimeout;
    socket.on("typing", (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit("typing", {
        userId,
        conversationId,
      });

      // Clear previous timeout
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.to(`conversation_${conversationId}`).emit("stopTyping", {
          userId,
          conversationId,
        });
      }, 1500);
    });

    socket.on("disconnect", async () => {
      console.log(`🔴 User Disconnected: ${userId}`);
      // Mark user as offline in Redis
      await redisClient.set(`user:${userId}:status`, "offline", "EX", 300);
      // Notify other users
      socket.broadcast.emit("userOffline", { userId });
    });
  } catch (error) {
    console.error("Authentication error:", error);
    socket.disconnect();
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, async () => {
    console.log(`🚀 Server Running on Port ${PORT}`);
  });
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`⚠️ Received ${signal}. Shutting down...`);
  if (server) {
    server.close(() => console.log("🛑 Server Closed"));
  }
  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
