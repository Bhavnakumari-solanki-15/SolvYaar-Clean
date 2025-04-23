// Event types
export enum EventType {
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_ENDED = 'room_ended',
  CHAT_MESSAGE = 'chat_message',
  DRAW_EVENT = 'draw_event',
  USER_TYPING = 'user_typing',
  QUERY_EVENT = 'query_event'
}

// Base event interface
export interface BaseEvent {
  type: EventType;
  timestamp: number;
  roomId: string;
  userId: string;
  userName: string;
}

// Room event interfaces
export interface RoomCreatedEvent extends BaseEvent {
  type: EventType.ROOM_CREATED;
  hostName: string;
}

export interface RoomJoinedEvent extends BaseEvent {
  type: EventType.ROOM_JOINED;
}

export interface RoomLeftEvent extends BaseEvent {
  type: EventType.ROOM_LEFT;
}

export interface RoomEndedEvent extends BaseEvent {
  type: EventType.ROOM_ENDED;
  reason: string;
}

// Chat event interfaces
export interface ChatMessageEvent extends BaseEvent {
  type: EventType.CHAT_MESSAGE;
  message: string;
}

export interface UserTypingEvent extends BaseEvent {
  type: EventType.USER_TYPING;
  isTyping: boolean;
}

// Drawing event interfaces
export interface DrawEvent extends BaseEvent {
  type: EventType.DRAW_EVENT;
  drawData: {
    type: 'pen' | 'eraser' | 'clear';
    points: { x: number; y: number }[];
    color: string;
    drawId: string;
  };
}

// Query event interface
export interface QueryEvent extends BaseEvent {
  type: EventType.QUERY_EVENT;
  query: string;
  response?: string;
  status: 'pending' | 'completed' | 'error';
}

// Type union for all events
export type FluvioEvent = 
  | RoomCreatedEvent 
  | RoomJoinedEvent 
  | RoomLeftEvent 
  | RoomEndedEvent 
  | ChatMessageEvent 
  | UserTypingEvent 
  | DrawEvent
  | QueryEvent;

// WebSocket-based Fluvio client
export class FluvioClient {
  private static instance: FluvioClient;
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, Set<(event: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;

  private constructor() {}

  static async getInstance(): Promise<FluvioClient> {
    if (!FluvioClient.instance) {
      FluvioClient.instance = new FluvioClient();
      await FluvioClient.instance.initialize();
    }
    return FluvioClient.instance;
  }

  private async initialize() {
    const wsUrl = import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:4000';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = this.eventHandlers.get(data.type);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initialize();
      }, this.reconnectTimeout * this.reconnectAttempts);
    }
  }

  // Room events
  async publishRoomEvent(event: FluvioEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  // Chat events
  async publishChatMessage(roomId: string, event: ChatMessageEvent | UserTypingEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  // Drawing events
  async publishDrawEvent(roomId: string, event: DrawEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  // Query events
  async publishQueryEvent(roomId: string, event: QueryEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  // Subscribe to room events
  async subscribeToRoomEvents(callback: (event: FluvioEvent) => void) {
    this.addEventHandler(EventType.ROOM_CREATED, callback);
    this.addEventHandler(EventType.ROOM_JOINED, callback);
    this.addEventHandler(EventType.ROOM_LEFT, callback);
    this.addEventHandler(EventType.ROOM_ENDED, callback);
  }

  // Subscribe to chat events
  async subscribeToChat(roomId: string, callback: (event: ChatMessageEvent | UserTypingEvent) => void) {
    this.addEventHandler(EventType.CHAT_MESSAGE, callback);
    this.addEventHandler(EventType.USER_TYPING, callback);
  }

  // Subscribe to drawing events
  async subscribeToDrawing(roomId: string, callback: (event: DrawEvent) => void) {
    this.addEventHandler(EventType.DRAW_EVENT, callback);
  }

  // Subscribe to query events
  async subscribeToQueries(roomId: string, callback: (event: QueryEvent) => void) {
    this.addEventHandler(EventType.QUERY_EVENT, callback);
  }

  private addEventHandler(type: string, callback: (event: any) => void) {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }
    this.eventHandlers.get(type)?.add(callback);
  }

  // Cleanup
  async cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
  }
}

// Helper function for query events
export const sendQueryEvent = async (roomId: string, query: string, userId: string, userName: string): Promise<void> => {
  const client = await FluvioClient.getInstance();
  await client.publishQueryEvent(roomId, {
    type: EventType.QUERY_EVENT,
    timestamp: Date.now(),
    roomId,
    userId,
    userName,
    query,
    status: 'pending'
  });
}; 