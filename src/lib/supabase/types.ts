import { Database } from './database.types';

export type PracticeSession = {
  id: string;
  user_id: string;
  topic: string;
  score: number;
  questions_count: number;
  correct_answers: number;
  time_spent: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed_at: string | null;
  created_at: string;
};

export type PracticeAnswer = {
  id: string;
  practice_session_id: string;
  question_text: string;
  selected_option: string | null;
  correct_option: string;
  is_correct: boolean;
  created_at: string;
};

export type Tables = Database['public']['Tables'];
export type TablesInsert = {
  [TableName in keyof Tables]: {
    Insert: Tables[TableName]['Insert'];
  };
}['practice_sessions' | 'practice_answers'];

export type PracticeSessionInsert = Tables['practice_sessions']['Insert'];
export type PracticeAnswerInsert = Tables['practice_answers']['Insert']; 