import express, { Request, Response, RequestHandler } from "express";
import { WebSocketServer, WebSocket } from "ws";
import Redis from "ioredis";
import cors from "cors";

// Import the fallback implementation with type assertion
// @ts-ignore
import * as fallbackHandler from "./fallback-collab-handler.js";
const { setupFallbackServer, addCollabRoutes } = fallbackHandler;

// In-memory storage for when Redis is unavailable
const inMemoryStorage = {
  mathQueries: [],
  addQuery: function(query) {
    this.mathQueries.unshift(query); // Add to beginning to mimic Redis LPUSH
    if (this.mathQueries.length > 100) { // Keep only 100 recent items
      this.mathQueries.pop();
    }
  },
  getQueries: function(start = 0, end = 99) {
    return this.mathQueries.slice(start, end + 1);
  }
};

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

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = app.listen(4000, "0.0.0.0", () => {
  console.log(`HTTP server listening on http://0.0.0.0:4000`);
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });
console.log("WebSocket server listening on ws://0.0.0.0:4000");

// Store active WebSocket connections and user IDs with their connection IDs
const clients = new Set<WebSocket>();
const activeUsers = new Map<string, UserConnection>(); // userId -> UserConnection

// Create Redis clients with error handling
let redis = null;
let redisSub = null;

try {
  // Redis connection options with explicit host and port
  const redisOptions = {
    host: '127.0.0.1',
    port: 6379,
    connectTimeout: 5000,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log(`Redis connection failed after ${times} attempts, giving up`);
        return null; // stop retrying
      }
      const delay = Math.min(times * 500, 3000);
      console.log(`Redis reconnecting in ${delay}ms...`);
      return delay;
    }
  };
  
  console.log("Attempting to connect to Redis at 127.0.0.1:6379...");
  
  // Create Redis client for commands
  redis = new Redis(redisOptions);
  // Create Redis client for pub/sub
  redisSub = new Redis(redisOptions);
  
  // Handle connection successful
  redis.on('connect', () => {
    console.log('Redis connection established successfully');
  });
  
  // Handle Redis connection errors
  redis.on('error', (err) => {
    console.log('Redis connection error:', err.message);
    // Only log once and don't keep trying after a few attempts
    if (redis && redis.status === 'end') {
      redis = null;
    }
  });
  
  redisSub.on('error', (err) => {
    console.log('Redis subscription connection error:', err.message);
    // Only log once and don't keep trying after a few attempts
    if (redisSub && redisSub.status === 'end') {
      redisSub = null;
    }
  });
} catch (error) {
  console.error('Error creating Redis client:', error);
  redis = null;
  redisSub = null;
}

// Initialize server
const init = async () => {
  try {
    if (redis) {
      try {
        // Check Redis connection
        await redis.ping();
        console.log("Connected to Redis successfully");
        
        // Get current data count
        const count = await redis.llen("math_queries");
        console.log(`Found ${count} existing queries in Redis`);
        
        // Load existing data into in-memory storage
        const events = await redis.lrange("math_queries", 0, 99);
        if (events.length > 0) {
          events.forEach(event => {
            inMemoryStorage.mathQueries.push(JSON.parse(event));
          });
          console.log(`Loaded ${events.length} queries from Redis to in-memory storage`);
        }
        
        // Set up Redis subscription
        if (redisSub) {
          redisSub.subscribe("fluvio_math_events", (err) => {
            if (err) {
              console.error("Failed to subscribe to Redis channel:", err);
              return;
            }
            console.log("Subscribed to Redis channel: fluvio_math_events");
          });
        }
      } catch (redisError) {
        console.error("Redis connection failed:", redisError);
        redis = null;
        redisSub = null;
      }
    } else {
      console.log("Redis is not available - using in-memory storage");
    }
    
    // Setup fallback implementation regardless of Redis status
    try {
      console.log("Setting up fallback collaboration implementation");
      setupFallbackServer(server, wss);
      addCollabRoutes(app);
    } catch (err) {
      console.error("Error setting up fallback server:", err);
    }
  } catch (err) {
    console.error("Failed to initialize server:", err);
  }
};

init().catch(console.error);

// Create sample data for testing if no events exist
setTimeout(() => {
  if (inMemoryStorage.mathQueries.length === 0) {
    console.log("Adding sample math events for testing");
    const sampleEvents = [
      {
        id: `${Date.now()}-sample1`,
        userId: "system",
        topic: "algebra",
        latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        formulaType: "equation",
        timestamp: Date.now() - 60000
      },
      {
        id: `${Date.now()}-sample2`,
        userId: "system",
        topic: "calculus",
        latex: "\\int_a^b f(x) \\, dx",
        formulaType: "integral",
        timestamp: Date.now() - 30000
      }
    ];
    
    sampleEvents.forEach(event => {
      inMemoryStorage.addQuery(event);
    });
    
    // Broadcast to all connected clients
    const message = JSON.stringify({
      type: "query_event",
      data: sampleEvents[0]
    });
    
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}, 2000);

// Broadcast active users count to all clients
const broadcastActiveUsers = () => {
  // Count unique users (not connections)
  const uniqueUsers = Array.from(activeUsers.values()).filter(conn => conn.connections.size > 0);
  
  console.log("Active users:", {
    uniqueUsers: uniqueUsers.map(u => u.userId),
    count: uniqueUsers.length
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

// Handle Redis pub/sub messages if Redis is available
if (redisSub) {
  redisSub.on("message", (channel, message) => {
    if (channel === "fluvio_math_events") {
      console.log("Received message from Fluvio via Redis:", message);
      // Broadcast to all WebSocket clients
      const event = JSON.parse(message);
      const formattedMessage = JSON.stringify({
        type: "query_event",
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

// Handle POST /api/generate-questions endpoint
app.post("/api/generate-questions", (async (req: Request, res: Response) => {
  try {
    const { topic, difficulty, count } = req.body;
    
    if (!topic) {
      res.status(400).json({ message: "Topic is required" });
      return;
    }

    // Generate mock questions for now
    const questions = Array(count || 5).fill(null).map((_, index) => ({
      id: index + 1,
      text: `Sample question ${index + 1} for ${topic}`,
      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: "This is a sample explanation",
      topic: topic,
      difficulty: difficulty || "medium",
      hint: "This is a sample hint"
    }));

    res.status(200).json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ message: "Failed to generate questions" });
  }
}) as RequestHandler);

// Handle POST /event endpoint
app.post("/event", ((req: Request, res: Response) => {
  try {
    const event: QueryEvent = req.body;
    event.timestamp = Date.now();
    
    // Add a unique ID if not present
    if (!event.id) {
      event.id = `${event.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    }

    console.log("Received event:", event);

    // Store event in Redis if available, otherwise use in-memory storage
    const eventString = JSON.stringify(event);
    if (redis) {
      redis.lpush("math_queries", eventString)
        .then(() => {
          console.log("Stored event in Redis:", eventString);
        })
        .catch(err => {
          console.error("Error storing event in Redis:", err);
          // Fallback to in-memory storage if Redis fails
          inMemoryStorage.addQuery(event);
          console.log("Stored event in memory after Redis failure");
        });
    } else {
      // Store in memory
      inMemoryStorage.addQuery(event);
      console.log("Stored event in memory (Redis not available)");
    }

    // Broadcast directly to WebSocket clients
    const message = JSON.stringify({
      type: "query_event",
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
}) as RequestHandler);

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
      
      console.log("Received message:", data);

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
        
        // Send recent events to the new connection, using in-memory if Redis is unavailable
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
            console.error("Error fetching recent events from Redis:", error);
            // Fall back to in-memory storage
            recentEvents = inMemoryStorage.getQueries();
            console.log(`Using ${recentEvents.length} events from in-memory storage (Redis failed)`);
          }
        } else {
          // Use in-memory storage
          recentEvents = inMemoryStorage.getQueries();
          console.log(`Using ${recentEvents.length} events from in-memory storage (Redis unavailable)`);
        }
        
        console.log(`Sending ${recentEvents.length} initial events to client`);
        ws.send(JSON.stringify({
          type: "initial_events",
          data: recentEvents
        }));
        
        // Broadcast active users after setting the user ID
        broadcastActiveUsers();
      }
      else if (data.type === "get_initial_events") {
        let recentEvents = [];
        
        if (redis) {
          try {
            const events = await redis.lrange("math_queries", 0, 99);
            console.log(`Found ${events.length} events in Redis for initial load`);
            
            if (events.length > 0) {
              recentEvents = events
                .map(event => JSON.parse(event))
                .reverse(); // Most recent first
            }
          } catch (error) {
            console.error("Error fetching recent events from Redis:", error);
            // Fall back to in-memory storage
            recentEvents = inMemoryStorage.getQueries();
            console.log(`Using ${recentEvents.length} events from in-memory storage (Redis failed)`);
          }
        } else {
          // Use in-memory storage
          recentEvents = inMemoryStorage.getQueries();
          console.log(`Using ${recentEvents.length} events from in-memory storage (Redis unavailable)`);
        }
        
        console.log(`Sending ${recentEvents.length} initial events to client`);
        ws.send(JSON.stringify({
          type: "initial_events",
          data: recentEvents
        }));
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });
});
