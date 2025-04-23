-- Add hints column to math_history table
ALTER TABLE math_history ADD COLUMN IF NOT EXISTS hints JSONB;

-- Update RLS policies to include the new column
ALTER POLICY "Users can view their own math history" ON math_history
  USING (auth.uid() = user_id);

ALTER POLICY "Users can insert their own math history" ON math_history
  WITH CHECK (auth.uid() = user_id);

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_math_history_hints ON math_history USING GIN (hints);

-- Comment on the new column
COMMENT ON COLUMN math_history.hints IS 'Array of hints for the math problem solution'; 