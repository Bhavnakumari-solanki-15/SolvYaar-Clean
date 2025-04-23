import { Server } from 'socket.io';
import express from 'express';
import http from 'http';
import cors from 'cors';

// Create Express app
const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active rooms and participants
interface Participant {
  id: string;
  name: string;
  joinedAt: number;
  isActive: boolean;
  isHost: boolean;
}

interface Room {
  code: string;
  hostId: string;
  participants: Map<string, Participant>;
  chatMessages: any[];
  drawEvents: any[];
}

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle room creation/joining
  socket.on('joinRoom', ({ roomCode, userName, createNew }) => {
    try {
      let room = rooms.get(roomCode);
      
      // Create room if it doesn't exist and createNew is true
      if (!room && createNew) {
        room = {
          code: roomCode,
          hostId: socket.id,
          participants: new Map(),
          chatMessages: [],
          drawEvents: []
        };
        rooms.set(roomCode, room);
      }
      
      // Join existing room
      if (room) {
        socket.join(roomCode);
        
        // Add participant
        room.participants.set(socket.id, {
          id: socket.id,
          name: userName,
          joinedAt: Date.now(),
          isActive: true,
          isHost: socket.id === room.hostId
        });
        
        // Notify room joined
        socket.emit('roomJoined', {
          userId: socket.id,
          participants: Array.from(room.participants.values()),
          chatMessages: room.chatMessages,
          drawEvents: room.drawEvents
        });
        
        // Notify others
        socket.to(roomCode).emit('participantJoined', {
          id: socket.id,
          name: userName,
          joinedAt: Date.now(),
          isActive: true,
          isHost: socket.id === room.hostId
        });
        
        console.log(`User ${userName} (${socket.id}) joined room ${roomCode}`);
      } else {
        socket.emit('error', { message: 'Room not found' });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle chat messages
  socket.on('chatMessage', ({ roomCode, message }) => {
    try {
      const room = rooms.get(roomCode);
      if (room && room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id);
        const chatMessage = {
          id: Date.now().toString(),
          userId: socket.id,
          userName: participant.name,
          message,
          timestamp: Date.now()
        };
        
        room.chatMessages.push(chatMessage);
        io.to(roomCode).emit('newChatMessage', chatMessage);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  });

  // Handle draw events
  socket.on('drawEvent', ({ roomCode, event }) => {
    try {
      const room = rooms.get(roomCode);
      if (room && room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id);
        const drawEvent = {
          ...event,
          userId: socket.id,
          userName: participant.name,
          timestamp: Date.now()
        };
        
        room.drawEvents.push(drawEvent);
        io.to(roomCode).emit('newDrawEvent', drawEvent);
      }
    } catch (error) {
      console.error('Error sending draw event:', error);
    }
  });

  // Handle participant list refresh
  socket.on('refreshParticipants', ({ roomCode }) => {
    try {
      const room = rooms.get(roomCode);
      if (room) {
        io.to(roomCode).emit('participantsUpdated', 
          Array.from(room.participants.values())
        );
      }
    } catch (error) {
      console.error('Error refreshing participants:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Update participant status in all rooms
    rooms.forEach((room, roomCode) => {
      if (room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id) as Participant;
        participant.isActive = false;
        
        // Create leave message
        const leaveMessage = {
          id: Date.now().toString(),
          userId: 'system',
          userName: 'System',
          message: `${participant.name} left the room`,
          timestamp: Date.now()
        };
        
        // Add to chat history
        room.chatMessages.push(leaveMessage);
        
        // Notify room about participant leaving and new chat message
        io.to(roomCode).emit('participantLeft', participant);
        io.to(roomCode).emit('newChatMessage', leaveMessage);
        
        // If host left, notify everyone
        if (socket.id === room.hostId) {
          io.to(roomCode).emit('hostLeft');
        }
        
        // Clean up empty rooms
        if (Array.from(room.participants.values()).every((p: Participant) => !p.isActive)) {
          rooms.delete(roomCode);
        }
      }
    });
  });

  // Handle explicit room leave
  socket.on('leaveRoom', ({ roomCode, userId, userName }) => {
    try {
      const room = rooms.get(roomCode);
      if (room && room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id);
        participant.isActive = false;
        
        // Create leave message
        const leaveMessage = {
          id: Date.now().toString(),
          userId: 'system',
          userName: 'System',
          message: `${participant.name} left the room`,
          timestamp: Date.now()
        };
        
        // Add to chat history
        room.chatMessages.push(leaveMessage);
        
        // Notify room about participant leaving and new chat message
        io.to(roomCode).emit('participantLeft', participant);
        io.to(roomCode).emit('newChatMessage', leaveMessage);
        
        // Leave the socket room
        socket.leave(roomCode);
        
        // If host left, notify everyone
        if (socket.id === room.hostId) {
          io.to(roomCode).emit('hostLeft');
        }
        
        // Clean up empty rooms
        if (Array.from(room.participants.values()).every((p: Participant) => !p.isActive)) {
          rooms.delete(roomCode);
        }
        
        console.log(`User ${userName} (${socket.id}) left room ${roomCode}`);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 