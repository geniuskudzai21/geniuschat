-- ======================== GENIUSCHAT SIMPLE SCHEMA ========================
-- No authentication required - guest users only
-- Simple channel and message system

-- ======================== CHANNELS TABLE ========================
CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE,
    created_by TEXT,  -- Simple text ID for guest users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================== MESSAGES TABLE ========================
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,  -- Simple text ID for guest users
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================== INDEXES ========================
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channels_invite_code ON channels(invite_code);

-- ======================== RLS POLICIES ========================
-- Enable RLS on tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read channels
CREATE POLICY "Allow anonymous to read channels" ON channels
    FOR SELECT USING (true);

-- Allow anonymous users to insert channels
CREATE POLICY "Allow anonymous to insert channels" ON channels
    FOR INSERT WITH CHECK (true);

-- Allow anonymous users to read messages
CREATE POLICY "Allow anonymous to read messages" ON messages
    FOR SELECT USING (true);

-- Allow anonymous users to insert messages
CREATE POLICY "Allow anonymous to insert messages" ON messages
    FOR INSERT WITH CHECK (true);

-- ======================== REALTIME ========================
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ======================== INITIAL DATA ========================
-- Insert general channel if it doesn't exist
INSERT INTO channels (id, name, invite_code, created_by)
VALUES ('general', 'General', 'GENERAL1', 'system')
ON CONFLICT (id) DO NOTHING;
