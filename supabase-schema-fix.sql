-- ======================== GENIUSCHAT SIMPLE SCHEMA (NO RLS) ========================
-- No authentication required - guest users only
-- Simple channel and message system with open access

-- ======================== CLEAN UP ========================
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channels CASCADE;

-- ======================== CHANNELS TABLE ========================
CREATE TABLE channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE,
    created_by TEXT,  -- Simple text ID for guest users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================== MESSAGES TABLE ========================
CREATE TABLE messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,  -- Simple text ID for guest users
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================== INDEXES ========================
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_channels_created_by ON channels(created_by);
CREATE INDEX idx_channels_invite_code ON channels(invite_code);

-- ======================== GRANT PERMISSIONS TO ANON ========================
-- Grant all permissions to anonymous users
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- ======================== REALTIME ========================
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ======================== INITIAL DATA ========================
-- Insert general channel if it doesn't exist
INSERT INTO channels (id, name, invite_code, created_by)
VALUES ('general', 'General', 'GENERAL1', 'system');
