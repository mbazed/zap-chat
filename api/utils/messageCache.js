const getCachedMessages = async (conversationId) => {
  const cacheKey = `messages:${conversationId}`;
  const cachedMessages = await redisClient.get(cacheKey);
  return cachedMessages ? JSON.parse(cachedMessages) : null;
};

const cacheMessages = async (conversationId, messages) => {
  const cacheKey = `messages:${conversationId}`;
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(messages)); // 1 hour cache
};

export { getCachedMessages, cacheMessages };
