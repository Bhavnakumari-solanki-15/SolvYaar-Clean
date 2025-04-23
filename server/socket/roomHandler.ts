import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../lib/redis';

interface Room {
  code: string;
  participants: Participant[];
  chatMessages: ChatMessage[];
  drawEvents: DrawEvent[];
  hostId: string;
  createdAt: number;
}

interface Participant {
  id: string;
  name: string;
  joinedAt: number;
  isActive: boolean;
  isHost: boolean;
  socketId: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

interface DrawEvent {
  type: 'pen' | 'eraser' | 'clear';
  userId: string;
  userName: string;
  points: {x: number, y: number}[];
  color: string;
  timestamp: number;
  drawId: string;
}

// Redis key prefixes
const ROOM_PREFIX = 'room:';
const USER_PREFIX = 'user:';

// Helper functions for Redis operations
const getRoomKey = (roomCode: string) => `${ROOM_PREFIX}${roomCode}`;
const getUserKey = (userId: string) => `${USER_PREFIX}${userId}`;

const saveRoom = async (room: Room) => {
  await redisClient.set(getRoomKey(room.code), JSON.stringify(room));
};

const getRoom = async (roomCode: string): Promise<Room | null> => {
  const roomData = await redisClient.get(getRoomKey(roomCode));
  return roomData ? JSON.parse(roomData) : null;
};

const deleteRoom = async (roomCode: string) => {
  await redisClient.del(getRoomKey(roomCode));
};

const saveUserRoom = async (userId: string, roomCode: string) => {
  await redisClient.set(getUserKey(userId), roomCode);
};

const getUserRoom = async (userId: string): Promise<string | null> => {
  return await redisClient.get(getUserKey(userId));
};

const removeUserRoom = async (userId: string) => {
  await redisClient.del(getUserKey(userId));
};

export const setupRoomHandler = (io: Server, socket: Socket) => {
  // Join room handler
  socket.on('joinRoom', async ({ roomCode, userName, createNew = false }) => {
    try {
      // Get or create room
      let room = await getRoom(roomCode);
      
      if (!room && !createNew) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      if (!room && createNew) {
        room = {
          code: roomCode,
          participants: [],
          chatMessages: [],
          drawEvents: [],
          hostId: socket.id,
          createdAt: Date.now()
        };
        await saveRoom(room);
      }

      // Check if user already exists in the room
      const existingParticipant = room.participants.find(p => p.name === userName);
      const userId = existingParticipant?.id || uuidv4();

      // Update or add participant
      const participant = {
        id: userId,
        name: userName,
        joinedAt: Date.now(),
        isActive: true,
        isHost: createNew || socket.id === room.hostId,
        socketId: socket.id
      };

      room.participants = room.participants.filter(p => p.name !== userName);
      room.participants.push(participant);
      
      // Save updated room state
      await saveRoom(room);
      await saveUserRoom(userId, roomCode);
      
      // Join socket room
      socket.join(roomCode);
      
      // Store room info in socket
      socket.data.roomCode = roomCode;
      socket.data.userId = userId;
      socket.data.userName = userName;
      socket.data.isHost = participant.isHost;
      
      // Notify everyone in room
      io.to(roomCode).emit('participantJoined', participant);
      
      // Send room data to new participant
      socket.emit('roomJoined', {
        userId,
        participants: room.participants,
        chatMessages: room.chatMessages,
        drawEvents: room.drawEvents
      });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Disconnect handler
  socket.on('disconnect', async () => {
    try {
      const { roomCode, userId, userName, isHost } = socket.data;
      
      if (roomCode) {
        const room = await getRoom(roomCode);
        if (room) {
          // Mark the participant as inactive
          room.participants = room.participants.map(p => 
            p.id === userId ? { ...p, isActive: false, socketId: null } : p
          );

          // If host disconnected, assign new host or close the room
          if (isHost) {
            const nextActiveParticipant = room.participants.find(p => p.isActive && p.id !== userId);
            if (nextActiveParticipant) {
              // Assign new host
              nextActiveParticipant.isHost = true;
              room.hostId = nextActiveParticipant.socketId;
              
              // Notify room about host change
              const hostChangeMessage = {
                id: Date.now().toString(),
                userId: 'system',
                userName: 'System',
                message: `${userName} (host) left the room. ${nextActiveParticipant.name} is now the host.`,
                timestamp: Date.now()
              };
              room.chatMessages.push(hostChangeMessage);
              io.to(roomCode).emit('newChatMessage', hostChangeMessage);
              io.to(roomCode).emit('participantsUpdated', room.participants);
              io.to(roomCode).emit('hostChanged', {
                newHostId: nextActiveParticipant.id,
                newHostName: nextActiveParticipant.name
              });
            } else {
              // No active participants left, close the room
              const roomClosedMessage = {
                id: Date.now().toString(),
                userId: 'system',
                userName: 'System',
                message: `The host (${userName}) ended the room. This room will close.`,
                timestamp: Date.now()
              };
              io.to(roomCode).emit('newChatMessage', roomClosedMessage);
              io.to(roomCode).emit('roomClosed', { 
                message: `The host (${userName}) ended the room.`, 
                hostName: userName
              });
              
              // Remove the room after a short delay
              setTimeout(async () => {
                await deleteRoom(roomCode);
              }, 5000);
            }
          } else {
            // Regular participant left
            const leaveMessage = {
              id: Date.now().toString(),
              userId: 'system',
              userName: 'System',
              message: `${userName} left the room`,
              timestamp: Date.now()
            };
            room.chatMessages.push(leaveMessage);
            io.to(roomCode).emit('newChatMessage', leaveMessage);
            io.to(roomCode).emit('participantLeft', { 
              id: userId, 
              name: userName
            });
            io.to(roomCode).emit('participantsUpdated', room.participants);
          }

          // Save updated room state
          await saveRoom(room);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Leave room handler
  socket.on('leaveRoom', async ({ roomCode, userId, userName }) => {
    try {
      const room = await getRoom(roomCode);
      if (!room) return;

      // Update participant status
      room.participants = room.participants.map(p => 
        p.id === userId ? { ...p, isActive: false, socketId: null } : p
      );

      // Notify others
      io.to(roomCode).emit('participantLeft', { id: userId, name: userName });

      // If host left, notify everyone
      if (room.hostId === userId) {
        io.to(roomCode).emit('hostLeft');

        // Remove room if no active participants
        const activeParticipants = room.participants.filter(p => p.isActive);
        if (activeParticipants.length === 0) {
          await deleteRoom(roomCode);
        }
      }

      // Save updated room state
      await saveRoom(room);
      await removeUserRoom(userId);

      // Leave socket room
      socket.leave(roomCode);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Chat message handler
  socket.on('chatMessage', async ({ roomCode, message }) => {
    try {
      const room = await getRoom(roomCode);
      if (!room) return;

      const chatMessage = {
        id: Date.now().toString(),
        userId: socket.data.userId,
        userName: socket.data.userName,
        message,
        timestamp: Date.now()
      };

      room.chatMessages.push(chatMessage);
      await saveRoom(room);

      io.to(roomCode).emit('newChatMessage', chatMessage);
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  });

  // Draw event handler
  socket.on('drawEvent', async ({ roomCode, event }) => {
    try {
      const room = await getRoom(roomCode);
      if (!room) return;

      const drawEvent = {
        ...event,
        userId: socket.data.userId,
        userName: socket.data.userName,
        timestamp: Date.now()
      };

      room.drawEvents.push(drawEvent);
      await saveRoom(room);

      io.to(roomCode).emit('newDrawEvent', drawEvent);
    } catch (error) {
      console.error('Error sending draw event:', error);
    }
  });

  // Refresh participants handler
  socket.on('refreshParticipants', async ({ roomCode }) => {
    try {
      const room = await getRoom(roomCode);
      if (!room) return;

      io.to(roomCode).emit('participantsUpdated', room.participants);
    } catch (error) {
      console.error('Error refreshing participants:', error);
    }
  });
}; 