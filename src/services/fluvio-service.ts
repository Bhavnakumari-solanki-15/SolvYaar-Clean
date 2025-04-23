import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, DrawEvent, RoomEvent, Participant } from '../contexts/CollaborativeRoomContext';

// Topics to use with Fluvio
const TOPICS = {
  ROOMS: 'collab_rooms',
  CHAT: 'collab_chat_',  // Will be appended with roomCode
  DRAWING: 'collab_draw_', // Will be appended with roomCode
  ANALYTICS: 'collab_analytics'
};

// Base URL for API requests from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Create a new collaborative room
 * @param roomCode - Unique room identifier
 * @param hostId - User ID of the room host
 * @param hostName - Display name of the host
 */
export const createRoom = async (roomCode: string, hostId: string, hostName: string): Promise<boolean> => {
  try {
    // Create room topics in Fluvio
    const response = await fetch(`${API_BASE_URL}/collab/create-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        hostId,
        hostName,
        timestamp: Date.now()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    // Send initial room event
    await sendRoomEvent({
      type: 'join',
      userId: hostId,
      userName: hostName,
      roomId: roomCode,
      timestamp: Date.now()
    });

    return true;
  } catch (error) {
    console.error('Error creating room:', error);
    return false;
  }
};

/**
 * Join an existing collaborative room
 * @param roomCode - Room code to join
 * @param userId - User ID of the joining participant
 * @param userName - Display name of the joining participant
 */
export const joinRoom = async (roomCode: string, userId: string, userName: string): Promise<boolean> => {
  try {
    // Check if room exists
    const response = await fetch(`${API_BASE_URL}/collab/join-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        userId,
        userName,
        timestamp: Date.now()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to join room');
    }

    // Send room join event
    await sendRoomEvent({
      type: 'join',
      userId,
      userName,
      roomId: roomCode,
      timestamp: Date.now()
    });

    return true;
  } catch (error) {
    console.error('Error joining room:', error);
    return false;
  }
};

/**
 * Leave a collaborative room
 * @param roomCode - Room code to leave
 * @param userId - User ID of the leaving participant
 * @param userName - Display name of the leaving participant
 */
export const leaveRoom = async (roomCode: string, userId: string, userName: string): Promise<boolean> => {
  try {
    // Send room leave event
    await sendRoomEvent({
      type: 'leave',
      userId,
      userName,
      roomId: roomCode,
      timestamp: Date.now()
    });

    return true;
  } catch (error) {
    console.error('Error leaving room:', error);
    return false;
  }
};

/**
 * Send a chat message to a room
 * @param roomCode - Target room code
 * @param message - Chat message to send
 */
export const sendChatMessage = async (roomCode: string, message: Omit<ChatMessage, 'id'>): Promise<boolean> => {
  try {
    const fullMessage: ChatMessage = {
      ...message,
      id: uuidv4()
    };

    // Send to the chat topic for this room
    const response = await fetch(`${API_BASE_URL}/collab/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        message: fullMessage
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send chat message');
    }

    // Log analytics event
    sendAnalyticsEvent({
      type: 'chat',
      roomCode,
      userId: message.userId,
      timestamp: message.timestamp
    });

    return true;
  } catch (error) {
    console.error('Error sending chat message:', error);
    return false;
  }
};

/**
 * Send a drawing event to a room
 * @param roomCode - Target room code
 * @param event - Drawing event to send
 */
export const sendDrawEvent = async (roomCode: string, event: DrawEvent): Promise<boolean> => {
  try {
    // Send to the drawing topic for this room
    const response = await fetch(`${API_BASE_URL}/collab/draw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        event
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send drawing event');
    }

    // Only send analytics for start and end events to avoid flooding
    if (event.type !== 'drawMove') {
      sendAnalyticsEvent({
        type: 'draw',
        roomCode,
        userId: event.userId,
        timestamp: event.timestamp
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending drawing event:', error);
    return false;
  }
};

/**
 * Send a room event (join/leave)
 * @param event - Room event to send
 */
export const sendRoomEvent = async (event: RoomEvent): Promise<boolean> => {
  try {
    // Send to the rooms topic
    const response = await fetch(`${API_BASE_URL}/collab/room-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to send room event');
    }

    // Log analytics event
    sendAnalyticsEvent({
      type: `room_${event.type}`,
      roomCode: event.roomId,
      userId: event.userId,
      timestamp: event.timestamp
    });

    return true;
  } catch (error) {
    console.error('Error sending room event:', error);
    return false;
  }
};

/**
 * Get participant list for a room
 * @param roomCode - Room code to get participants for
 */
export const getRoomParticipants = async (roomCode: string): Promise<Participant[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/collab/participants?roomCode=${roomCode}`);
    
    if (!response.ok) {
      throw new Error('Failed to get room participants');
    }
    
    const data = await response.json();
    return data.participants;
  } catch (error) {
    console.error('Error getting room participants:', error);
    return [];
  }
};

/**
 * Get chat history for a room
 * @param roomCode - Room code to get chat history for
 */
export const getChatHistory = async (roomCode: string): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/collab/chat-history?roomCode=${roomCode}`);
    
    if (!response.ok) {
      throw new Error('Failed to get chat history');
    }
    
    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
};

/**
 * Send an analytics event
 * @param event - Analytics event to log
 */
const sendAnalyticsEvent = async (event: {
  type: string;
  roomCode: string;
  userId: string;
  timestamp: number;
}): Promise<void> => {
  try {
    // In a production app, we would batch these events
    await fetch(`${API_BASE_URL}/collab/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Error sending analytics event:', error);
  }
}; 