import { Json } from './supabase';
import { InputType, ToolType } from './history';

export interface MathHistory {
  id: string;
  user_id: string;
  tool_used: ToolType;
  input_type: InputType;
  topic?: string;
  content: {
    query: string;
    imageUrl?: string;
    audioUrl?: string;
    fileUrl?: string;
  };
  result: {
    solution: string;
    steps?: string[];
    error?: string;
  };
  timestamp: string;
}

export interface MathScrollRow {
  id: string;
  problem: string;
  solution: string;
  image_url: string;
  wallet_address: string;
  timestamp: string;
  tx_hash: string;
}

export type Database = {
  public: {
    Tables: {
      math_history: {
        Row: MathHistory;
        Insert: Omit<MathHistory, 'id' | 'timestamp'>;
        Update: Partial<Omit<MathHistory, 'id' | 'timestamp'>>;
      };
      math_scrolls: {
        Row: MathScrollRow;
        Insert: Omit<MathScrollRow, 'id'>;
        Update: Partial<Omit<MathScrollRow, 'id'>>;
      };
    };
  };
}; 