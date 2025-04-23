import express, { Request, Response } from "express";
import { WebSocketServer, WebSocket } from "ws";
import Redis from "ioredis";
import cors from "cors";

interface QueryEvent {
  userId: string;
  topic: string;
  latex: string;
  formulaType: string;
  timestamp: number;
  id?: string;
}

interface UserConnection {
  userId: string;
  name?: string;
  connections: Set<string>;
}

// Create Redis client for pub/sub - handle possible Redis connection issues gracefully
let redisSub;
let redis;

try {
  // Create Redis client for pub/sub
  redisSub = new Redis();
  // Create Redis client for commands
  redis = new Redis();
  console.log("Redis clients created successfully");
} catch (error) {
  console.log("Redis connection failed, using in-memory storage instead:", error);
  // Implement fallback storage if Redis is not available
}

// Create Express app
const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST"]
}));
app.use(express.json());

// Create HTTP server
const server = app.listen(4000, '0.0.0.0', () => {
  console.log(`HTTP server listening on http://0.0.0.0:4000`);
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });
console.log("WebSocket server listening on ws://0.0.0.0:4000");

// Store active WebSocket connections and user IDs with their connection IDs
const clients = new Set<WebSocket>();
const activeUsers = new Map<string, UserConnection>(); // userId -> UserConnection

// In-memory storage for when Redis is not available
const inMemoryQueries = [];

// Initialize server
const init = async () => {
  try {
    if (redis) {
      // Check Redis connection
      await redis.ping();
      console.log("Connected to Redis successfully");
      
      // Get current data count
      const count = await redis.llen("math_queries");
      console.log(`Found ${count} existing queries in Redis`);
    } else {
      console.log("Using in-memory storage for queries");
    }
  } catch (err) {
    console.error("Failed to initialize Redis connection:", err);
    console.log("Using in-memory storage for queries");
  }
};

init().catch(console.error);

// Broadcast active users count to all clients
const broadcastActiveUsers = () => {
  // Count unique users (not connections)
  const uniqueUsers = Array.from(activeUsers.values()).filter(conn => conn.connections.size > 0);
  
  console.log('Active users:', {
    uniqueUsers: uniqueUsers.map(u => u.userId),
    count: uniqueUsers.length,
    connections: uniqueUsers.map(u => ({
      userId: u.userId,
      connectionCount: u.connections.size
    }))
  });
  
  const message = JSON.stringify({ 
    type: "active_users", 
    count: uniqueUsers.length
  });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Subscribe to Redis channel for events if Redis is available
if (redisSub) {
  redisSub.subscribe("fluvio_math_events", (err) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err);
      return;
    }
    console.log("Subscribed to Redis channel: fluvio_math_events");
  });

  redisSub.on("message", (channel, message) => {
    if (channel === "fluvio_math_events") {
      console.log("Received message from Redis channel:", message);
      // Broadcast to all WebSocket clients
      const event = JSON.parse(message);
      const formattedMessage = JSON.stringify({
        type: 'query_event',
        data: event
      });
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(formattedMessage);
        }
      });
    }
  });
}

// Handle POST /event endpoint
app.post("/event", async (req: Request, res: Response) => {
  try {
    const event: QueryEvent = req.body;
    event.timestamp = Date.now();
    
    // Add a unique ID if not present
    if (!event.id) {
      event.id = `${event.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Store event in Redis or in-memory
    const eventString = JSON.stringify(event);
    if (redis) {
      try {
        await redis.lpush("math_queries", eventString);
        console.log("Stored event in Redis:", eventString);
      } catch (error) {
        console.error("Error storing in Redis, using in-memory:", error);
        inMemoryQueries.push(event);
      }
    } else {
      inMemoryQueries.push(event);
      console.log("Stored event in-memory:", eventString);
    }

    // Broadcast directly to WebSocket clients
    const message = JSON.stringify({
      type: 'query_event',
      data: event
    });
    console.log("Broadcasting new event to clients");
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    res.status(200).json({ message: "Event received" });
  } catch (error) {
    console.error("Error handling event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Handle new WebSocket connections
wss.on("connection", (ws) => {
  const connectionId = Math.random().toString(36).substr(2, 6);
  console.log(`New WebSocket client connected: ${connectionId}`);
  
  // Store connection metadata in WebSocket instance
  (ws as any).connectionId = connectionId;
  (ws as any).userId = null;
  clients.add(ws);

  // Remove client and user when they disconnect
  ws.on("close", () => {
    console.log(`WebSocket client disconnected: ${connectionId}`);
    clients.delete(ws);
    
    // Remove user's connection
    const userId = (ws as any).userId;
    if (userId) {
      const userConnection = activeUsers.get(userId);
      if (userConnection) {
        userConnection.connections.delete(connectionId);
        if (userConnection.connections.size === 0) {
          activeUsers.delete(userId);
          console.log(`User ${userId} removed - no more active connections`);
        } else {
          console.log(`Connection ${connectionId} removed for user ${userId} - ${userConnection.connections.size} connections remaining`);
        }
        broadcastActiveUsers();
      }
    }
  });

  // Handle messages from clients
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === "ping") {
        return; // Ignore ping messages
      }
      
      console.log('Received message:', data);

      if (data.type === "user_active" && data.userId) {
        const userId = data.userId;
        const userName = data.name;
        
        // Check if this is a new connection for an existing user
        if ((ws as any).userId === userId) {
          console.log(`Duplicate user_active message for user ${userId}`);
          return;
        }

        // Remove old connection if it exists
        const oldUserId = (ws as any).userId;
        if (oldUserId) {
          const oldConnection = activeUsers.get(oldUserId);
          if (oldConnection) {
            oldConnection.connections.delete(connectionId);
            if (oldConnection.connections.size === 0) {
              activeUsers.delete(oldUserId);
              console.log(`User ${oldUserId} removed - no more active connections`);
            }
          }
        }

        // Add new connection
        (ws as any).userId = userId;
        if (!activeUsers.has(userId)) {
          activeUsers.set(userId, {
            userId,
            name: userName,
            connections: new Set([connectionId])
          });
        } else {
          activeUsers.get(userId)!.connections.add(connectionId);
        }
        console.log(`User ${userId} active with connection ${connectionId}`);
        
        // Send recent events to the new connection
        try {
          let recentEvents = [];
          
          if (redis) {
            try {
              const events = await redis.lrange("math_queries", 0, 99);
              console.log(`Found ${events.length} events in Redis`);
              
              if (events.length > 0) {
                recentEvents = events
                  .map(event => JSON.parse(event))
                  .reverse(); // Most recent first
              }
            } catch (error) {
              console.error("Error fetching from Redis, using in-memory events:", error);
              recentEvents = [...inMemoryQueries].reverse();
            }
          } else {
            recentEvents = [...inMemoryQueries].reverse();
            console.log(`Found ${recentEvents.length} events in memory`);
          }
          
          if (recentEvents.length > 0) {
            console.log('Sending initial events to client:', recentEvents);
            ws.send(JSON.stringify({
              type: 'initial_events',
              data: recentEvents
            }));
          } else {
            console.log('No events found');
          }
        } catch (error) {
          console.error("Error fetching recent events:", error);
        }
        
        // Broadcast active users after setting the user ID
        broadcastActiveUsers();
      }

      // Handle event subscriptions
      if (data.type === "subscribe_events") {
        (ws as any).subscribed = true;
        console.log(`Client ${connectionId} subscribed to events`);
      }

      if (data.type === "unsubscribe_events") {
        (ws as any).subscribed = false;
        console.log(`Client ${connectionId} unsubscribed from events`);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Make sure PORT is properly configured
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 