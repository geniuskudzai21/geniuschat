-- ======================== GENIUSCHAT SUPABASE SCHEMA ========================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================== CHANNELS TABLE ========================
CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    invite_code TEXT UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================== MESSAGES TABLE ========================
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================== CHANNEL MEMBERS TABLE ========================
CREATE TABLE IF NOT EXISTS channel_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);

-- ======================== INDEXES ========================
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);

-- ======================== RLS (ROW LEVEL SECURITY) ========================
-- Enable RLS on all tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- ======================== CHANNELS POLICIES ========================
-- Allow anyone to read public channels
CREATE POLICY "Public channels are viewable by everyone" ON channels
    FOR SELECT USING (is_private = false);

-- Allow anyone to read channels they are members of
CREATE POLICY "Users can view channels they are members of" ON channels
    FOR SELECT USING (
        id IN (
            SELECT channel_id FROM channel_members 
            WHERE user_id = auth.uid()
        )
    );

-- Allow authenticated users to create channels
CREATE POLICY "Authenticated users can create channels" ON channels
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow channel creators to update their channels
CREATE POLICY "Channel creators can update their channels" ON channels
    FOR UPDATE USING (created_by = auth.uid());

-- Allow channel creators to delete their channels
CREATE POLICY "Channel creators can delete their channels" ON channels
    FOR DELETE USING (created_by = auth.uid());

-- ======================== MESSAGES POLICIES ========================
-- Allow anyone to read messages from channels they are members of
CREATE POLICY "Users can read messages from channels they are members of" ON messages
    FOR SELECT USING (
        channel_id IN (
            SELECT channel_id FROM channel_members 
            WHERE user_id = auth.uid()
        ) OR channel_id IN (
            SELECT id FROM channels WHERE is_private = false
        )
    );

-- Allow authenticated users to insert messages
CREATE POLICY "Authenticated users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow message authors to update their messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (user_id = auth.uid());

-- Allow message authors to delete their messages
CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (user_id = auth.uid());

-- ======================== CHANNEL MEMBERS POLICIES ========================
-- Allow users to view channel memberships for channels they are members of
CREATE POLICY "Users can view memberships for channels they are members of" ON channel_members
    FOR SELECT USING (
        channel_id IN (
            SELECT channel_id FROM channel_members 
            WHERE user_id = auth.uid()
        ) OR channel_id IN (
            SELECT id FROM channels WHERE is_private = false
        )
    );

-- Allow users to join public channels
CREATE POLICY "Users can join public channels" ON channel_members
    FOR INSERT WITH CHECK (
        channel_id IN (
            SELECT id FROM channels WHERE is_private = false
        ) AND user_id = auth.uid()
    );

-- Allow channel creators to add members to their channels
CREATE POLICY "Channel creators can add members" ON channel_members
    FOR INSERT WITH CHECK (
        channel_id IN (
            SELECT id FROM channels WHERE created_by = auth.uid()
        )
    );

-- Allow users to leave channels
CREATE POLICY "Users can leave channels" ON channel_members
    FOR DELETE USING (user_id = auth.uid());

-- ======================== FUNCTIONS ========================
-- Function to automatically add user as member when they send a message
CREATE OR REPLACE FUNCTION auto_join_channel()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO channel_members (channel_id, user_id)
    VALUES (NEW.channel_id, NEW.user_id)
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-joining
CREATE TRIGGER auto_join_channel_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_join_channel();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ======================== REALTIME ========================
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE channel_members;

-- ======================== INITIAL DATA ========================
-- Insert general channel if it doesn't exist
INSERT INTO channels (id, name, is_private, created_by)
VALUES ('general', 'General', false, NULL)
ON CONFLICT (id) DO NOTHING;
