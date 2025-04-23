-- Create power_cards table
CREATE TABLE IF NOT EXISTS public.power_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    animation_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_power_cards_user_id ON public.power_cards(user_id);

-- Create unique constraint to prevent duplicate cards for the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_power_cards_user_title ON public.power_cards(user_id, title);

-- Enable Row Level Security
ALTER TABLE public.power_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own power cards"
    ON public.power_cards
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own power cards"
    ON public.power_cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own power cards"
    ON public.power_cards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own power cards"
    ON public.power_cards
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_power_cards_updated_at
    BEFORE UPDATE ON public.power_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 