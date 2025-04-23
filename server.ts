import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store room data in memory (in production, use a database)
const rooms = new Map();

interface Participant {
  id: string;
  name: string;
  joinedAt: number;
  isActive: boolean;
  isHost?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

interface DrawEvent {
  type: 'startDraw' | 'drawMove' | 'endDraw';
  userId: string;
  userName: string;
  points: {x: number, y: number}[];
  color: string;
  timestamp: number;
  drawId: string;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle joining a room
  socket.on('joinRoom', async ({ roomCode, userName, createNew }) => {
    try {
      // Join the Socket.IO room
      await socket.join(roomCode);

      // Initialize room data if it doesn't exist
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, {
          participants: [],
          chatMessages: [],
          drawEvents: []
        });
      }

      const roomData = rooms.get(roomCode);
      const participant: Participant = {
        id: socket.id,
        name: userName,
        joinedAt: Date.now(),
        isActive: true,
        isHost: createNew
      };

      // Add or update participant
      const existingParticipantIndex = roomData.participants.findIndex(
        (p: Participant) => p.id === socket.id
      );

      if (existingParticipantIndex >= 0) {
        roomData.participants[existingParticipantIndex] = participant;
      } else {
        roomData.participants.push(participant);
      }

      // Send room data to the client
      socket.emit('roomJoined', {
        roomCode,
        userId: socket.id,
        participants: roomData.participants,
        chatMessages: roomData.chatMessages,
        drawEvents: roomData.drawEvents
      });

      // Notify other participants
      socket.to(roomCode).emit('participantJoined', participant);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle chat messages
  socket.on('chatMessage', ({ roomCode, message }) => {
    const roomData = rooms.get(roomCode);
    if (!roomData) return;

    const participant = roomData.participants.find(
      (p: Participant) => p.id === socket.id
    );
    if (!participant) return;

    const chatMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: socket.id,
      userName: participant.name,
      message,
      timestamp: Date.now()
    };

    roomData.chatMessages.push(chatMessage);
    io.to(roomCode).emit('newChatMessage', chatMessage);
  });

  // Handle draw events
  socket.on('drawEvent', ({ roomCode, event }) => {
    const roomData = rooms.get(roomCode);
    if (!roomData) return;

    const participant = roomData.participants.find(
      (p: Participant) => p.id === socket.id
    );
    if (!participant) return;

    const drawEvent: DrawEvent = {
      ...event,
      userId: socket.id,
      userName: participant.name,
      timestamp: Date.now()
    };

    roomData.drawEvents.push(drawEvent);
    socket.to(roomCode).emit('newDrawEvent', drawEvent);
  });

  // Handle participant leaving
  socket.on('leaveRoom', ({ roomCode }) => {
    handleParticipantLeave(socket, roomCode);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Find all rooms this socket was in and handle leaving
    const roomCodes = Array.from(rooms.keys());
    roomCodes.forEach(roomCode => {
      handleParticipantLeave(socket, roomCode);
    });
  });
});

// Helper function to handle participant leaving
function handleParticipantLeave(socket: any, roomCode: string) {
  const roomData = rooms.get(roomCode);
  if (!roomData) return;

  const participantIndex = roomData.participants.findIndex(
    (p: Participant) => p.id === socket.id
  );

  if (participantIndex >= 0) {
    const participant = roomData.participants[participantIndex];
    participant.isActive = false;
    
    // Remove participant if they're not the host
    if (!participant.isHost) {
      roomData.participants.splice(participantIndex, 1);
    }

    // Notify other participants
    socket.to(roomCode).emit('participantLeft', participant);

    // Clean up empty rooms
    if (roomData.participants.length === 0) {
      rooms.delete(roomCode);
    }
  }

  socket.leave(roomCode);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 