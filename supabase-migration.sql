-- ======================== GENIUSCHAT MIGRATION: ADD CHANNEL MEMBERSHIP ========================
-- Run this SQL in your Supabase SQL Editor to add privacy (channel membership tracking)
-- This migration preserves existing data

-- ======================== CREATE CHANNEL MEMBERS TABLE ========================
CREATE TABLE IF NOT EXISTS channel_members (
    id SERIAL PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);

-- ======================== INDEXES ========================
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);

-- ======================== GRANT PERMISSIONS ========================
GRANT ALL ON channel_members TO anon;
GRANT ALL ON channel_members_id_seq TO anon;

-- ======================== ADD EXISTING CHANNEL MEMBERS ========================
-- This adds membership records for channels that were created by each user
-- Run this only if you want to preserve existing access (users will see channels they created)
-- INSERT INTO channel_members (channel_id, user_id)
-- SELECT id, created_by FROM channels
-- ON CONFLICT (channel_id, user_id) DO NOTHING;

-- NOTE: Uncomment the above INSERT statement if you want existing channel creators
-- to retain access to their channels. For new installations, leave it commented.
