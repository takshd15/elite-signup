-- Chat Tables for EliteScore Database
-- These tables integrate with the existing users_auth and user_profile_info tables

-- Chat channels table
CREATE TABLE IF NOT EXISTS chat_channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users_auth(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    thread_id VARCHAR(255),
    reply_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Chat reactions table
CREATE TABLE IF NOT EXISTS chat_reactions (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL REFERENCES chat_messages(message_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users_auth(user_id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);

-- Chat read receipts table
CREATE TABLE IF NOT EXISTS chat_read_receipts (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL REFERENCES chat_messages(message_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users_auth(user_id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_message_id ON chat_read_receipts(message_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to chat tables
DROP TRIGGER IF EXISTS update_chat_messages_timestamp ON chat_messages;
CREATE TRIGGER update_chat_messages_timestamp
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_timestamp();

DROP TRIGGER IF EXISTS update_chat_channels_timestamp ON chat_channels;
CREATE TRIGGER update_chat_channels_timestamp
    BEFORE UPDATE ON chat_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_timestamp();

-- Insert default channels
INSERT INTO chat_channels (channel_id, name, description) VALUES
    ('general', 'General', 'General discussion'),
    ('feedback', 'Feedback', 'Share your feedback and suggestions'),
    ('career', 'Career', 'Career advice and job discussions'),
    ('learning', 'Learning', 'Share educational resources and tips'),
    ('networking', 'Networking', 'Professional networking opportunities')
ON CONFLICT (channel_id) DO NOTHING;
