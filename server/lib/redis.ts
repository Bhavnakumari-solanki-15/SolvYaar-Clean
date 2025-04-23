import { createClient } from 'redis';

// Create a Redis client with a specific database number for collaborative rooms
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  database: 1 // Use database 1 for collaborative rooms (assuming dashboard uses database 0)
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Handle connection errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Handle reconnection
redisClient.on('reconnecting', () => {
  console.log('Redis client reconnecting...');
});

// Handle successful connection
redisClient.on('connect', () => {
  console.log('Redis client connected');
});

export default redisClient; 