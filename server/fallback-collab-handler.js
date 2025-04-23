const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Room tracking
class Room {
  constructor(code, hostId, hostName) {
    this.code = code;
    this.hostId = hostId;
    this.participants = new Map();
    this.participants.set(hostId, {
      name: hostName,
      joinedAt: Date.now(),
      isActive: true
    });
    this.createdAt = Date.now();
    this.chatHistory = [];
    this.drawEvents = [];
  }
}

// In-memory store of active rooms
const activeRooms = new Map();

// WebSocket clients by user ID
const clients = new Map();

// Set of user active rooms
const userActiveRooms = new Map();

// Setup WebSocket server
const setupFallbackServer = (server, existingWss = null) => {
  console.log('Setting up fallback collaboration server (no Fluvio)');
  
  // Setup WebSocket server or use the existing one
  const wss = existingWss || new WebSocket.Server({ server });
  
  if (!existingWss) {
    console.log('Created new WebSocket server for fallback handler');
  } else {
    console.log('Using existing WebSocket server for fallback handler');
  }
  
  wss.on('connection', (ws) => {
    let userId = null;
    
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle connection initialization
        if (data.type === 'init') {
          // Store previous user ID if it exists
          const oldUserId = userId;
          
          // Update with new user ID
          userId = data.userId || uuidv4();
          
          // If user ID changed, update clients map
          if (oldUserId && oldUserId !== userId) {
            console.log(`User ID changed from ${oldUserId} to ${userId}, updating clients map`);
            clients.delete(oldUserId);
          }
          
          // Store the client connection
          clients.set(userId, ws);
          
          // Initialize user's active rooms if needed
          if (!userActiveRooms.has(userId)) {
            userActiveRooms.set(userId, new Set());
          }
          
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
            
            // Store room info
            const room = new Room(
              roomCode,
              userId,
              data.userName || 'Anonymous'
            );
            activeRooms.set(roomCode, room);
            
            // Add to user's active rooms
            const userRooms = userActiveRooms.get(userId);
            if (userRooms) {
              userRooms.add(roomCode);
            }
            
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
            console.log(`[JOIN] User ${userId} (${userName}) attempting to join room ${roomCode}`);
            console.log(`[JOIN] Current clients connected: ${clients.size}`);
            
            // Validate room exists
            const room = activeRooms.get(roomCode);
            if (!room) {
              console.log(`[JOIN] Room ${roomCode} not found`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Room not found'
              }));
              return;
            }
            
            console.log(`[JOIN] Room ${roomCode} found with ${room.participants.size} participants`);
            console.log(`[JOIN] Current participants in room:`, Array.from(room.participants.entries()).map(([id, info]) => ({ id, name: info.name })));
            
            // Check if user is already in the room
            const wasAlreadyInRoom = room.participants.has(userId);
            
            if (wasAlreadyInRoom) {
              console.log(`[JOIN] User ${userId} already in room, updating info`);
              
              // Update user info
              room.participants.set(userId, {
                name: userName || 'Anonymous',
                joinedAt: Date.now(),
                isActive: true
              });
            } else {
              console.log(`[JOIN] Adding user ${userId} to room ${roomCode}`);
              
              // Add user to room
              room.participants.set(userId, {
                name: userName || 'Anonymous',
                joinedAt: Date.now(),
                isActive: true
              });
            }
            
            // Add to user's active rooms
            const userRooms = userActiveRooms.get(userId) || new Set();
            userRooms.add(roomCode);
            userActiveRooms.set(userId, userRooms);
            
            // Convert participants for sending to client
            const participants = Array.from(room.participants.entries()).map(([id, info]) => ({
              id,
              name: info.name,
              joinedAt: info.joinedAt,
              isActive: info.isActive
            }));
            
            console.log(`[JOIN] Sending room_joined response with ${participants.length} participants to ${userId}`);
            console.log(`[JOIN] Participants data being sent:`, JSON.stringify(participants));
            
            // Send room info to client
            ws.send(JSON.stringify({
              type: 'room_joined',
              roomCode,
              isHost: room.hostId === userId,
              participants,
              chatHistory: room.chatHistory,
              timestamp: Date.now()
            }));
            
            // Notify other participants of user_joined if this is a new user
            if (!wasAlreadyInRoom) {
              console.log(`[JOIN] Broadcasting user_joined to other participants`);
              broadcastToRoom(roomCode, {
                type: 'user_joined',
                roomCode,
                userId,
                userName: userName || 'Anonymous',
                timestamp: Date.now()
              }, userId);
            }
            
            // Always send participants_update to all clients to ensure consistency
            console.log(`[JOIN] Sending participants_update to all clients`);
            broadcastToRoom(roomCode, {
              type: 'participants_update',
              roomCode,
              participants,
              timestamp: Date.now()
            });
            
            console.log(`[JOIN] User ${userId} successfully joined room ${roomCode}`);
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
            const room = activeRooms.get(roomCode);
            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Room not found'
              }));
              return;
            }
            
            const userInfo = room.participants.get(userId);
            if (!userInfo) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not a participant in this room'
              }));
              return;
            }
            
            // Create message
            const message = {
              id: uuidv4(),
              userId,
              userName: userInfo.name,
              content,
              timestamp: Date.now()
            };
            
            // Add to room history
            room.chatHistory.push(message);
            
            // Broadcast to all participants
            broadcastToRoom(roomCode, {
              type: 'chat_message',
              roomCode,
              message
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
            const room = activeRooms.get(roomCode);
            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Room not found'
              }));
              return;
            }
            
            const userInfo = room.participants.get(userId);
            if (!userInfo) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not a participant in this room'
              }));
              return;
            }
            
            // Create event with user info
            const event = {
              ...drawEvent,
              userId,
              userName: userInfo.name,
              timestamp: Date.now()
            };
            
            // Add to draw events if it's a start or end (to save memory)
            if (drawEvent.type === 'startDraw' || drawEvent.type === 'drawEnd') {
              room.drawEvents.push(event);
            }
            
            // Broadcast to all participants except sender
            broadcastToRoom(roomCode, {
              type: 'draw_event',
              roomCode,
              event
            }, userId);
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
              const userRooms = userActiveRooms.get(userId);
              if (userRooms) {
                userRooms.delete(roomCode);
              }
              
              // If this was the host and others remain, assign a new host
              if (room.hostId === userId && room.participants.size > 0) {
                room.hostId = Array.from(room.participants.keys())[0];
              }
              
              // If room is now empty, clean it up
              if (room.participants.size === 0) {
                activeRooms.delete(roomCode);
              } else {
                // Notify others
                broadcastToRoom(roomCode, {
                  type: 'user_left',
                  roomCode,
                  userId,
                  userName: userInfo?.name || 'Anonymous',
                  timestamp: Date.now()
                });
              }
              
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
    ws.on('close', () => {
      if (userId) {
        console.log(`Client disconnected: ${userId}`);
        
        // Clean up client
        clients.delete(userId);
        
        // Handle user leaving all active rooms
        const userRooms = userActiveRooms.get(userId);
        if (userRooms) {
          for (const roomCode of userRooms) {
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
              } else {
                // Notify others
                broadcastToRoom(roomCode, {
                  type: 'user_left',
                  roomCode,
                  userId,
                  userName: userInfo?.name || 'Anonymous',
                  timestamp: Date.now()
                });
              }
              
              console.log(`User ${userId} auto-left room ${roomCode} due to disconnect`);
            }
          }
        }
        
        // Remove user's rooms tracking
        userActiveRooms.delete(userId);
      }
    });
  });
  
  console.log('Fallback collaboration WebSocket server initialized');
  
  return { wss };
};

// Helper function to broadcast a message to all participants in a room
function broadcastToRoom(roomCode, message, excludeUserId = null) {
  const room = activeRooms.get(roomCode);
  if (!room) {
    console.error(`[BROADCAST] Room ${roomCode} not found`);
    return;
  }
  
  console.log(`[BROADCAST] Broadcasting to room ${roomCode}, message type: ${message.type}`);
  console.log(`[BROADCAST] Room has ${room.participants.size} participants, excluding: ${excludeUserId}`);
  
  if (message.type === 'participants_update') {
    console.log(`[BROADCAST] Participants update data:`, JSON.stringify(message.participants));
  }
  
  let broadcasted = 0;
  for (const [participantId, participantInfo] of room.participants) {
    if (excludeUserId && participantId === excludeUserId) {
      console.log(`[BROADCAST] Skipping excluded user: ${participantId}`);
      continue;
    }
    
    const clientWs = clients.get(participantId);
    console.log(`[BROADCAST] Participant ${participantId} (${participantInfo.name}) has WebSocket: ${!!clientWs}`);
    
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      try {
        const messageJson = JSON.stringify(message);
        clientWs.send(messageJson);
        broadcasted++;
        console.log(`[BROADCAST] Sent message to participant: ${participantId}`);
      } catch (error) {
        console.error(`[BROADCAST] Error sending message to ${participantId}:`, error);
      }
    } else if (clientWs) {
      console.log(`[BROADCAST] WebSocket not open for ${participantId}, state: ${clientWs.readyState}`);
    } else {
      console.log(`[BROADCAST] No WebSocket for participant ${participantId}`);
    }
  }
  
  console.log(`[BROADCAST] Successfully broadcasted to ${broadcasted} of ${room.participants.size - (excludeUserId ? 1 : 0)} eligible participants`);
}

// REST API routes
const addCollabRoutes = (app) => {
  // Get room participants
  app.get('/collab/participants', (req, res) => {
    const { roomCode } = req.query;
    
    if (!roomCode) {
      return res.status(400).json({ error: 'Room code is required' });
    }
    
    const room = activeRooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const participants = Array.from(room.participants.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      joinedAt: info.joinedAt,
      isActive: info.isActive
    }));
    
    res.json({ participants });
  });
  
  // Get chat history
  app.get('/collab/chat-history', (req, res) => {
    const { roomCode } = req.query;
    
    if (!roomCode) {
      return res.status(400).json({ error: 'Room code is required' });
    }
    
    const room = activeRooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({ messages: room.chatHistory });
  });
  
  // Create room
  app.post('/collab/create-room', (req, res) => {
    const { roomCode, hostId, hostName } = req.body;
    
    if (!roomCode || !hostId) {
      return res.status(400).json({ error: 'Room code and host ID are required' });
    }
    
    if (activeRooms.has(roomCode)) {
      return res.status(409).json({ error: 'Room already exists' });
    }
    
    const room = new Room(roomCode, hostId, hostName || 'Anonymous');
    activeRooms.set(roomCode, room);
    
    // Add to user's active rooms
    let userRooms = userActiveRooms.get(hostId);
    if (!userRooms) {
      userRooms = new Set();
      userActiveRooms.set(hostId, userRooms);
    }
    userRooms.add(roomCode);
    
    res.status(201).json({ 
      success: true,
      roomCode,
      timestamp: Date.now()
    });
  });
  
  // Join room
  app.post('/collab/join-room', (req, res) => {
    const { roomCode, userId, userName } = req.body;
    
    if (!roomCode || !userId) {
      return res.status(400).json({ error: 'Room code and user ID are required' });
    }
    
    const room = activeRooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Add user to room
    room.participants.set(userId, {
      name: userName || 'Anonymous',
      joinedAt: Date.now(),
      isActive: true
    });
    
    // Add to user's active rooms
    let userRooms = userActiveRooms.get(userId);
    if (!userRooms) {
      userRooms = new Set();
      userActiveRooms.set(userId, userRooms);
    }
    userRooms.add(roomCode);
    
    res.json({ success: true });
  });
  
  // Handle chat messages
  app.post('/collab/chat', (req, res) => {
    const { roomCode, message } = req.body;
    
    if (!roomCode || !message) {
      return res.status(400).json({ error: 'Room code and message are required' });
    }
    
    const room = activeRooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Add to room history
    room.chatHistory.push(message);
    
    // Broadcast to all participants
    broadcastToRoom(roomCode, {
      type: 'chat_message',
      roomCode,
      message
    });
    
    res.json({ success: true });
  });
  
  // Handle drawing events
  app.post('/collab/draw', (req, res) => {
    const { roomCode, event } = req.body;
    
    if (!roomCode || !event) {
      return res.status(400).json({ error: 'Room code and event are required' });
    }
    
    const room = activeRooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Add to draw events if it's a start or end (to save memory)
    if (event.type === 'startDraw' || event.type === 'drawEnd') {
      room.drawEvents.push(event);
    }
    
    // Broadcast to all participants except sender
    broadcastToRoom(roomCode, {
      type: 'draw_event',
      roomCode,
      event
    }, event.userId);
    
    res.json({ success: true });
  });
  
  // Handle room events
  app.post('/collab/room-event', (req, res) => {
    const { type, userId, userName, roomId, timestamp } = req.body;
    
    if (!type || !userId || !roomId) {
      return res.status(400).json({ error: 'Type, user ID, and room ID are required' });
    }
    
    const room = activeRooms.get(roomId);
    
    // For join events, create room if it doesn't exist
    if (type === 'join' && !room) {
      const newRoom = new Room(roomId, userId, userName || 'Anonymous');
      activeRooms.set(roomId, newRoom);
      
      // Add to user's active rooms
      let userRooms = userActiveRooms.get(userId);
      if (!userRooms) {
        userRooms = new Set();
        userActiveRooms.set(userId, userRooms);
      }
      userRooms.add(roomId);
    } else if (room) {
      // For leave events, handle user leaving
      if (type === 'leave') {
        room.participants.delete(userId);
        
        // Remove from user's active rooms
        const userRooms = userActiveRooms.get(userId);
        if (userRooms) {
          userRooms.delete(roomId);
        }
        
        // If this was the host and others remain, assign a new host
        if (room.hostId === userId && room.participants.size > 0) {
          room.hostId = Array.from(room.participants.keys())[0];
        }
        
        // If room is now empty, clean it up
        if (room.participants.size === 0) {
          activeRooms.delete(roomId);
        }
      }
    }
    
    // Broadcast event to room participants
    if (room) {
      broadcastToRoom(roomId, {
        type: 'room_event',
        roomId,
        event: { type, userId, userName, timestamp: timestamp || Date.now() }
      }, type === 'leave' ? userId : null);
    }
    
    res.json({ success: true });
  });
  
  // Analytics endpoint (just logs in this fallback implementation)
  app.post('/collab/analytics', (req, res) => {
    console.log('Analytics event:', req.body);
    res.json({ success: true });
  });
};

module.exports = {
  setupFallbackServer,
  addCollabRoutes
}; 