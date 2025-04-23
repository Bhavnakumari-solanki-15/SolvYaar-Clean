-- Create saved_memes table
CREATE TABLE IF NOT EXISTS saved_memes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    meme_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    template_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster user-based queries
CREATE INDEX idx_saved_memes_user_id ON saved_memes(user_id);

-- Enable RLS
ALTER TABLE saved_memes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own memes"
    ON saved_memes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memes"
    ON saved_memes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memes"
    ON saved_memes
    FOR DELETE
    USING (auth.uid() = user_id); 