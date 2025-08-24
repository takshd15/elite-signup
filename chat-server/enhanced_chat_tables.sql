-- Enhanced Chat Tables with Message Management and User Management Features

-- Chat Channels Table
CREATE TABLE IF NOT EXISTS chat_channels (
    channel_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Chat Messages Table with editing support
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    message_id UUID UNIQUE NOT NULL,
    channel_id VARCHAR(50) NOT NULL REFERENCES chat_channels(channel_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    thread_id UUID,
    reply_to UUID,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Reactions Table
CREATE TABLE IF NOT EXISTS chat_reactions (
    id SERIAL PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(message_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Chat Read Receipts Table
CREATE TABLE IF NOT EXISTS chat_read_receipts (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL REFERENCES chat_channels(channel_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    last_read_message_id UUID,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

-- User Status Table for online/offline tracking
CREATE TABLE IF NOT EXISTS chat_user_status (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'away'
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Typing Indicators Table (optional, for persistence)
CREATE TABLE IF NOT EXISTS chat_typing_indicators (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL REFERENCES chat_channels(channel_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(channel_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_content ON chat_messages USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_edited ON chat_messages(is_edited);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user_id ON chat_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_channel_user ON chat_read_receipts(channel_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_last_read_at ON chat_read_receipts(last_read_at);

CREATE INDEX IF NOT EXISTS idx_chat_user_status_user_id ON chat_user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_status_status ON chat_user_status(status);
CREATE INDEX IF NOT EXISTS idx_chat_user_status_last_seen ON chat_user_status(last_seen);

CREATE INDEX IF NOT EXISTS idx_chat_typing_channel_user ON chat_typing_indicators(channel_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_expires_at ON chat_typing_indicators(expires_at);

-- Insert default channels
INSERT INTO chat_channels (channel_id, name, description) VALUES
    ('general', 'General', 'General discussion'),
    ('feedback', 'Feedback', 'Share your feedback and suggestions'),
    ('career', 'Career', 'Career advice and job discussions'),
    ('learning', 'Learning', 'Share educational resources and tips'),
    ('networking', 'Networking', 'Professional networking opportunities')
ON CONFLICT (channel_id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_chat_channels_updated_at 
    BEFORE UPDATE ON chat_channels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_user_status_updated_at 
    BEFORE UPDATE ON chat_user_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_typing_indicators WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- Function to update user status to offline if not seen recently
CREATE OR REPLACE FUNCTION update_inactive_users_to_offline()
RETURNS void AS $$
BEGIN
    UPDATE chat_user_status 
    SET status = 'offline', updated_at = CURRENT_TIMESTAMP
    WHERE last_seen < CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    AND status != 'offline';
END;
$$ language 'plpgsql';

-- Create a scheduled job to clean up expired data (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-typing-indicators', '*/30 * * * *', 'SELECT cleanup_expired_typing_indicators();');
-- SELECT cron.schedule('update-inactive-users', '*/5 * * * *', 'SELECT update_inactive_users_to_offline();');
