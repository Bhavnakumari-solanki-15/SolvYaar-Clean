import Fluvio from '@fluvio/client';
import WebSocket from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Fluvio client
const initFluvio = async () => {
  try {
    // Check if WSL IP is provided in environment
    const wslIp = process.env.VITE_FLUVIO_WSL_IP;
    let fluvio;
    
    if (wslIp) {
      console.log(`Connecting to Fluvio on WSL at IP: ${wslIp}`);
      // Create a new Fluvio instance with custom endpoint
      fluvio = new Fluvio();
      await fluvio.connect({ brokers: [`${wslIp}:9003`] });
    } else {
      // Use default connection
      fluvio = new Fluvio();
      await fluvio.connect();
    }
    
    console.log("Connected to Fluvio for collaboration service");
    return fluvio;
  } catch (error) {
    console.error("Failed to connect to Fluvio:", error);
    throw error;
  }
};

// Ensure topics exist
const ensureTopicExists = async (fluvio: any, topicName: string) => {
  try {
    // Check if topic exists, if not create it
    const admin = await fluvio.admin();
    const topics = await admin.listTopics();
    
    if (!topics.includes(topicName)) {
      await admin.createTopic(topicName);
      console.log(`Created topic: ${topicName}`);
    }
    
    return fluvio.topic(topicName);
  } catch (error) {
    console.error(`Error ensuring topic ${topicName} exists:`, error);
    throw error;
  }
};

// Topic names
const TOPICS = {
  ROOMS: 'collab_rooms',
  CHAT_PREFIX: 'collab_chat_',
  DRAWING_PREFIX: 'collab_draw_',
  ANALYTICS: 'collab_analytics'
};

// Room tracking
interface Room {
  code: string;
  hostId: string;
  participants: Map<string, {
    name: string;
    joinedAt: number;
    isActive: boolean;
  }>;
  createdAt: number;
}

// In-memory store of active rooms
const activeRooms = new Map<string, Room>();

// WebSocket clients by user ID
const clients = new Map<string, WebSocket>();

// Set of active rooms per user
interface UserRooms {
  userId: string;
  rooms: Set<string>;
}

// Set of user active rooms
const userActiveRooms = new Map<string, Set<string>>();

// Setup WebSocket server
export const setupCollabServer = async (server: http.Server) => {
  // Initialize Fluvio
  const fluvio = await initFluvio();
  
  // Ensure base topics exist
  const roomsTopic = await ensureTopicExists(fluvio, TOPICS.ROOMS);
  const analyticsTopic = await ensureTopicExists(fluvio, TOPICS.ANALYTICS);
  
  // Setup WebSocket server
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    let userId: string | null = null;
    let activeRooms: Set<string> = new Set();
    
    console.log('New WebSocket connection');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle connection initialization
        if (data.type === 'init') {
          userId = data.userId || uuidv4();
          clients.set(userId, ws);
          
          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'init_ack',
            userId
          }));
          
          console.log(`Client initialized with ID: ${userId}`);
          return;
        }
        
        // Ensure userId is set for all other message types
        if (!userId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Not initialized'
          }));
          return;
        }
        
        // Handle room creation
        if (data.type === 'create_room') {
          try {
            // Generate room code if not provided
            const roomCode = data.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // Create room-specific topics
            await ensureTopicExists(fluvio, `${TOPICS.CHAT_PREFIX}${roomCode}`);
            await ensureTopicExists(fluvio, `${TOPICS.DRAWING_PREFIX}${roomCode}`);
            
            // Store room info
            activeRooms.set(roomCode, {
              code: roomCode,
              hostId: userId,
              participants: new Map([[userId, {
                name: data.userName || 'Anonymous',
                joinedAt: Date.now(),
                isActive: true
              }]]),
              createdAt: Date.now()
            });
            
            // Add to user's active rooms
            activeRooms.add(roomCode);
            
            // Send room created event to Fluvio
            const producer = await roomsTopic.producer();
            await producer.send({
              type: 'room_created',
              roomCode,
              hostId: userId,
              hostName: data.userName || 'Anonymous',
              timestamp: Date.now()
            });
            
            // Send success response
            ws.send(JSON.stringify({
              type: 'room_created',
              roomCode,
              timestamp: Date.now()
            }));
            
            console.log(`Room created: ${roomCode} by user ${userId}`);
          } catch (error) {
            console.error('Error creating room:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to create room'
            }));
          }
          return;
        }
        
        // Handle joining a room
        if (data.type === 'join_room') {
          try {
            const { roomCode, userName } = data;
            
            // Validate room exists
            const room = activeRooms.get(roomCode);
            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Room not found'
              }));
              return;
            }
            
            // Add user to room
            room.participants.set(userId, {
              name: userName || 'Anonymous',
              joinedAt: Date.now(),
              isActive: true
            });
            
            // Add to user's active rooms
            activeRooms.add(roomCode);
            
            // Setup consumers for room topics
            setupRoomConsumers(fluvio, roomCode, userId, ws);
            
            // Send join event to Fluvio
            const producer = await roomsTopic.producer();
            await producer.send({
              type: 'user_joined',
              roomCode,
              userId,
              userName: userName || 'Anonymous',
              timestamp: Date.now()
            });
            
            // Send room info to client
            const participants = Array.from(room.participants.entries()).map(([id, info]) => ({
              id,
              name: info.name,
              joinedAt: info.joinedAt,
              isActive: info.isActive
            }));
            
            ws.send(JSON.stringify({
              type: 'room_joined',
              roomCode,
              isHost: room.hostId === userId,
              participants,
              timestamp: Date.now()
            }));
            
            console.log(`User ${userId} joined room ${roomCode}`);
          } catch (error) {
            console.error('Error joining room:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to join room'
            }));
          }
          return;
        }
        
        // Handle room message (chat)
        if (data.type === 'chat_message') {
          try {
            const { roomCode, content } = data;
            
            // Validate room exists and user is in it
            if (!activeRooms.has(roomCode)) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not in room'
              }));
              return;
            }
            
            const room = activeRooms.get(roomCode);
            const userInfo = room?.participants.get(userId);
            
            if (!userInfo) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not a participant in this room'
              }));
              return;
            }
            
            // Send chat message to Fluvio
            const chatTopic = await fluvio.topic(`${TOPICS.CHAT_PREFIX}${roomCode}`);
            const producer = await chatTopic.producer();
            
            const message = {
              id: uuidv4(),
              userId,
              userName: userInfo.name,
              content,
              timestamp: Date.now()
            };
            
            await producer.send(message);
            
            // Send analytics event
            const analyticsProducer = await analyticsTopic.producer();
            await analyticsProducer.send({
              type: 'chat',
              roomCode,
              userId,
              timestamp: Date.now()
            });
            
            console.log(`Chat message sent in room ${roomCode} by user ${userId}`);
          } catch (error) {
            console.error('Error sending chat message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to send chat message'
            }));
          }
          return;
        }
        
        // Handle drawing events
        if (data.type === 'draw_event') {
          try {
            const { roomCode, drawEvent } = data;
            
            // Validate room exists and user is in it
            if (!activeRooms.has(roomCode)) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not in room'
              }));
              return;
            }
            
            const room = activeRooms.get(roomCode);
            const userInfo = room?.participants.get(userId);
            
            if (!userInfo) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not a participant in this room'
              }));
              return;
            }
            
            // Send drawing event to Fluvio
            const drawingTopic = await fluvio.topic(`${TOPICS.DRAWING_PREFIX}${roomCode}`);
            const producer = await drawingTopic.producer();
            
            const event = {
              ...drawEvent,
              userId,
              userName: userInfo.name,
              timestamp: Date.now()
            };
            
            await producer.send(event);
            
            // Send analytics for start/end events (not moves to avoid flooding)
            if (drawEvent.type === 'startDraw' || drawEvent.type === 'drawEnd') {
              const analyticsProducer = await analyticsTopic.producer();
              await analyticsProducer.send({
                type: 'draw',
                roomCode,
                userId,
                timestamp: Date.now()
              });
            }
          } catch (error) {
            console.error('Error sending drawing event:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to send drawing event'
            }));
          }
          return;
        }
        
        // Handle leaving a room
        if (data.type === 'leave_room') {
          try {
            const { roomCode } = data;
            
            // Get room
            const room = activeRooms.get(roomCode);
            
            if (room) {
              // Get user info
              const userInfo = room.participants.get(userId);
              
              // Remove user from room
              room.participants.delete(userId);
              
              // Remove from user's active rooms
              activeRooms.delete(roomCode);
              
              // If this was the host and others remain, assign a new host
              if (room.hostId === userId && room.participants.size > 0) {
                room.hostId = Array.from(room.participants.keys())[0];
              }
              
              // If room is now empty, clean it up
              if (room.participants.size === 0) {
                activeRooms.delete(roomCode);
              }
              
              // Send leave event to Fluvio
              const producer = await roomsTopic.producer();
              await producer.send({
                type: 'user_left',
                roomCode,
                userId,
                userName: userInfo?.name || 'Anonymous',
                timestamp: Date.now()
              });
              
              // Send analytics
              const analyticsProducer = await analyticsTopic.producer();
              await analyticsProducer.send({
                type: 'room_leave',
                roomCode,
                userId,
                timestamp: Date.now()
              });
              
              // Confirm to client
              ws.send(JSON.stringify({
                type: 'room_left',
                roomCode,
                timestamp: Date.now()
              }));
              
              console.log(`User ${userId} left room ${roomCode}`);
            }
          } catch (error) {
            console.error('Error leaving room:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to leave room'
            }));
          }
          return;
        }
        
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', async () => {
      if (userId) {
        console.log(`Client disconnected: ${userId}`);
        
        // Clean up client
        clients.delete(userId);
        
        // Handle user leaving all active rooms
        for (const roomCode of activeRooms) {
          try {
            const room = activeRooms.get(roomCode);
            
            if (room) {
              // Get user info
              const userInfo = room.participants.get(userId);
              
              // Remove user from room
              room.participants.delete(userId);
              
              // If this was the host and others remain, assign a new host
              if (room.hostId === userId && room.participants.size > 0) {
                room.hostId = Array.from(room.participants.keys())[0];
              }
              
              // If room is now empty, clean it up
              if (room.participants.size === 0) {
                activeRooms.delete(roomCode);
              }
              
              // Send leave event to Fluvio
              const producer = await roomsTopic.producer();
              await producer.send({
                type: 'user_left',
                roomCode,
                userId,
                userName: userInfo?.name || 'Anonymous',
                timestamp: Date.now()
              });
              
              console.log(`User ${userId} auto-left room ${roomCode} due to disconnect`);
            }
          } catch (error) {
            console.error(`Error handling disconnect for room ${roomCode}:`, error);
          }
        }
      }
    });
  });
  
  console.log('Collaboration WebSocket server initialized');
  
  return { wss, fluvio };
};

// Set up consumers for room topics
const setupRoomConsumers = async (fluvio: any, roomCode: string, userId: string, ws: WebSocket) => {
  try {
    // Set up chat consumer
    const chatTopic = await fluvio.topic(`${TOPICS.CHAT_PREFIX}${roomCode}`);
    const chatConsumer = await chatTopic.consumer();
    
    chatConsumer.stream((record: any) => {
      try {
        const message = record.value;
        
        // Forward to client
        ws.send(JSON.stringify({
          type: 'chat_message',
          roomCode,
          message
        }));
      } catch (error) {
        console.error('Error processing chat message from Fluvio:', error);
      }
    });
    
    // Set up drawing consumer
    const drawingTopic = await fluvio.topic(`${TOPICS.DRAWING_PREFIX}${roomCode}`);
    const drawingConsumer = await drawingTopic.consumer();
    
    drawingConsumer.stream((record: any) => {
      try {
        const event = record.value;
        
        // Don't send events back to the originator
        if (event.userId !== userId) {
          // Forward to client
          ws.send(JSON.stringify({
            type: 'draw_event',
            roomCode,
            event
          }));
        }
      } catch (error) {
        console.error('Error processing drawing event from Fluvio:', error);
      }
    });
    
    // Set up room events consumer
    const roomsTopic = await fluvio.topic(TOPICS.ROOMS);
    const roomsConsumer = await roomsTopic.consumer();
    
    roomsConsumer.stream((record: any) => {
      try {
        const event = record.value;
        
        // Only process events for this room
        if (event.roomCode === roomCode) {
          // Forward to client
          ws.send(JSON.stringify({
            type: 'room_event',
            roomCode,
            event
          }));
        }
      } catch (error) {
        console.error('Error processing room event from Fluvio:', error);
      }
    });
    
    console.log(`Set up consumers for room ${roomCode} for user ${userId}`);
  } catch (error) {
    console.error(`Error setting up consumers for room ${roomCode}:`, error);
    throw error;
  }
}; 