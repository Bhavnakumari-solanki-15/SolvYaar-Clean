-- Practice Sessions Table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic VARCHAR NOT NULL,
  score FLOAT NOT NULL DEFAULT 0,
  questions_count INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  difficulty VARCHAR NOT NULL DEFAULT 'medium',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Practice Answers Table
CREATE TABLE IF NOT EXISTS practice_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  selected_option TEXT,
  correct_option TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Set up Row Level Security
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_answers ENABLE ROW LEVEL SECURITY;

-- Policies for practice_sessions
CREATE POLICY "Users can view their own practice sessions"
  ON practice_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice sessions"
  ON practice_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions"
  ON practice_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for practice_answers
CREATE POLICY "Users can view their own practice answers"
  ON practice_answers
  FOR SELECT
  USING (
    practice_session_id IN (
      SELECT id FROM practice_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own practice answers"
  ON practice_answers
  FOR INSERT
  WITH CHECK (
    practice_session_id IN (
      SELECT id FROM practice_sessions WHERE user_id = auth.uid()
    )
  ); 