-- Create math_scrolls table for storing Monad NFTs
CREATE TABLE IF NOT EXISTS public.math_scrolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  fortune_text TEXT NOT NULL,
  image_url TEXT NOT NULL,
  token_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS math_scrolls_wallet_address_idx ON public.math_scrolls (wallet_address);
CREATE INDEX IF NOT EXISTS math_scrolls_token_id_idx ON public.math_scrolls (token_id);

-- Add RLS policies
ALTER TABLE public.math_scrolls ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own math scrolls
CREATE POLICY "Users can view their own math scrolls"
  ON public.math_scrolls
  FOR SELECT
  USING (auth.uid()::text = wallet_address);

-- Policy to allow users to insert their own math scrolls
CREATE POLICY "Users can insert their own math scrolls"
  ON public.math_scrolls
  FOR INSERT
  WITH CHECK (auth.uid()::text = wallet_address);

-- Policy to allow users to update their own math scrolls
CREATE POLICY "Users can update their own math scrolls"
  ON public.math_scrolls
  FOR UPDATE
  USING (auth.uid()::text = wallet_address);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_math_scrolls_updated_at
BEFORE UPDATE ON public.math_scrolls
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 