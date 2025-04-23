// Practice session and answer interfaces for Supabase integration

export interface PracticeSession {
  id: string;
  user_id: string;
  topic: string;
  score: number;
  questions_count: number;
  correct_answers: number;
  time_spent: number;
  difficulty: string;
  completed_at: string;
  created_at: string;
}

export interface PracticeAnswer {
  id: string;
  practice_session_id: string;
  question_text: string;
  selected_option: string | null;
  correct_option: string;
  is_correct: boolean;
  created_at: string;
}

export interface PracticeSessionWithAnswers extends PracticeSession {
  practice_answers: PracticeAnswer[];
} 