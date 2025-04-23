import Fluvio from '@fluvio/client';

// Initialize Fluvio client
const fluvio = new Fluvio();

// Topic names
const ROOM_EVENTS_TOPIC = 'room-events';
const CHAT_TOPIC_PREFIX = 'chat-';
const DRAWING_TOPIC_PREFIX = 'drawing-';

// Event types
export enum EventType {
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_ENDED = 'room_ended',
  CHAT_MESSAGE = 'chat_message',
  DRAW_EVENT = 'draw_event',
  USER_TYPING = 'user_typing'
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

// Type union for all events
export type FluvioEvent = 
  | RoomCreatedEvent 
  | RoomJoinedEvent 
  | RoomLeftEvent 
  | RoomEndedEvent 
  | ChatMessageEvent 
  | UserTypingEvent 
  | DrawEvent;

// Fluvio client class
export class FluvioClient {
  private static instance: FluvioClient;
  private producer: any;
  private consumers: Map<string, any> = new Map();

  private constructor() {}

  static async getInstance(): Promise<FluvioClient> {
    if (!FluvioClient.instance) {
      FluvioClient.instance = new FluvioClient();
      await FluvioClient.instance.initialize();
    }
    return FluvioClient.instance;
  }

  private async initialize() {
    await fluvio.connect();
    this.producer = await fluvio.producer();
  }

  // Room events
  async publishRoomEvent(event: FluvioEvent) {
    await this.producer.send(ROOM_EVENTS_TOPIC, JSON.stringify(event));
  }

  // Chat events
  async publishChatMessage(roomId: string, event: ChatMessageEvent | UserTypingEvent) {
    const topic = `${CHAT_TOPIC_PREFIX}${roomId}`;
    await this.producer.send(topic, JSON.stringify(event));
  }

  // Drawing events
  async publishDrawEvent(roomId: string, event: DrawEvent) {
    const topic = `${DRAWING_TOPIC_PREFIX}${roomId}`;
    await this.producer.send(topic, JSON.stringify(event));
  }

  // Subscribe to room events
  async subscribeToRoomEvents(callback: (event: FluvioEvent) => void) {
    const consumer = await fluvio.consumer(ROOM_EVENTS_TOPIC);
    this.consumers.set(ROOM_EVENTS_TOPIC, consumer);
    
    for await (const record of consumer) {
      const event = JSON.parse(record.value) as FluvioEvent;
      callback(event);
    }
  }

  // Subscribe to chat events
  async subscribeToChat(roomId: string, callback: (event: ChatMessageEvent | UserTypingEvent) => void) {
    const topic = `${CHAT_TOPIC_PREFIX}${roomId}`;
    const consumer = await fluvio.consumer(topic);
    this.consumers.set(topic, consumer);
    
    for await (const record of consumer) {
      const event = JSON.parse(record.value) as ChatMessageEvent | UserTypingEvent;
      callback(event);
    }
  }

  // Subscribe to drawing events
  async subscribeToDrawing(roomId: string, callback: (event: DrawEvent) => void) {
    const topic = `${DRAWING_TOPIC_PREFIX}${roomId}`;
    const consumer = await fluvio.consumer(topic);
    this.consumers.set(topic, consumer);
    
    for await (const record of consumer) {
      const event = JSON.parse(record.value) as DrawEvent;
      callback(event);
    }
  }

  // Cleanup
  async cleanup() {
    for (const [topic, consumer] of this.consumers) {
      await consumer.close();
    }
    this.consumers.clear();
    await fluvio.disconnect();
  }
}

// Helper functions
export const getChatTopic = (roomId: string) => `${CHAT_TOPIC_PREFIX}${roomId}`;
export const getDrawingTopic = (roomId: string) => `${DRAWING_TOPIC_PREFIX}${roomId}`; 