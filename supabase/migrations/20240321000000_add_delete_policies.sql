-- Enable RLS if not already enabled
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete messages from own sessions" ON messages;

-- Add delete policy for chat_sessions
CREATE POLICY "Users can delete own sessions"
    ON chat_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add delete policy for messages
CREATE POLICY "Users can delete messages from own sessions"
    ON messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Ensure cascade delete is set up
ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS messages_session_id_fkey,
    ADD CONSTRAINT messages_session_id_fkey
    FOREIGN KEY (session_id)
    REFERENCES chat_sessions(id)
    ON DELETE CASCADE; 