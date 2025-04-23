-- Create the badge category enum type if it doesn't exist
CREATE TYPE public.badge_category AS ENUM (
  'algebra',
  'geometry',
  'trigonometry',
  'calculus',
  'statistics',
  'arithmetic',
  'linear_algebra',
  'number_theory',
  'discrete_math',
  'set_theory',
  'transformations'
);

-- Create badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category badge_category NOT NULL,
  icon TEXT
);

-- Enable Row Level Security
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT ALL ON public.badges TO authenticated;

-- Create policy for users to view all badges
CREATE POLICY "Users can view all badges"
  ON public.badges
  FOR SELECT
  USING (true);

-- Create policy for users to insert their own badges
CREATE POLICY "Users can insert their own badges"
  ON public.badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own badges
CREATE POLICY "Users can update their own badges"
  ON public.badges
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own badges
CREATE POLICY "Users can delete their own badges"
  ON public.badges
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS badges_user_id_idx ON public.badges (user_id);

-- Create unique constraint to prevent duplicate badges per category per user
CREATE UNIQUE INDEX IF NOT EXISTS user_category_unique ON public.badges (user_id, category);

-- Add a comment to the table
comment on table public.badges is 'Stores achievement badges earned by users'; 