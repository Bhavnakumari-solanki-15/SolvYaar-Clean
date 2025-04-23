export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'persona';
  timestamp: Date;
}

export interface ChatHistory {
  sessionId: string;
  messages: Message[];
  personaId: string;
  startedAt: Date;
  endedAt?: Date;
  xpEarned: number;
} 