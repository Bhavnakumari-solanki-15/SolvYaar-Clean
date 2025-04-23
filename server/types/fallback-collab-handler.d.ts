import { Application } from 'express';
import { Server } from 'http';
import { WebSocketServer } from 'ws';

declare class Room {
  constructor(code: string, hostId: string, hostName: string);
  code: string;
  hostId: string;
  createdAt: number;
  participants: Map<string, {
    name: string;
    joinedAt: number;
    isActive: boolean;
  }>;
  chatHistory: any[];
  drawEvents: any[];
  documentState: any;
}

/**
 * Sets up a fallback WebSocket server for collaboration features
 * @param server The HTTP server to attach the WebSocket server to
 * @returns Object containing the WebSocket server instance
 */
export function setupFallbackServer(server: Server): { wss: WebSocketServer };

/**
 * Adds collaboration-related REST API routes to the Express application
 * @param app The Express application instance
 */
export function addCollabRoutes(app: Application): void;

/**
 * Broadcasts a message to all participants in a room
 * @param roomCode The code of the room to broadcast to
 * @param message The message to broadcast
 * @param excludeUserId Optional user ID to exclude from broadcast
 */
export function broadcastToRoom(roomCode: string, message: any, excludeUserId?: string | null): void; 