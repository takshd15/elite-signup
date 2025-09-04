-- Private Messaging Database Schema
-- This replaces the channel-based chat system with peer-to-peer private messaging

-- Private messages table - stores all private messages between users
CREATE TABLE IF NOT EXISTS private_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    conversation_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    encrypted_content TEXT,
    encryption_iv VARCHAR(255),
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    reply_to VARCHAR(255),
    -- New fields for message editing and deletion
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_for_everyone BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comprehensive indexes for better performance
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_id ON private_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient_id ON private_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_private_messages_is_read ON private_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_private_messages_reply_to ON private_messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_private_messages_is_edited ON private_messages(is_edited);
CREATE INDEX IF NOT EXISTS idx_private_messages_is_deleted ON private_messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_private_messages_deleted_for_everyone ON private_messages(deleted_for_everyone);
CREATE INDEX IF NOT EXISTS idx_private_messages_message_id ON private_messages(message_id);

-- Additional performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_private_messages_conv_created ON private_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_created ON private_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient_created ON private_messages(recipient_id, created_at DESC);

-- Conversations table - tracks conversation metadata
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL UNIQUE,
    participant1_id VARCHAR(255) NOT NULL,
    participant2_id VARCHAR(255) NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);

-- User online status table - tracks user online/offline status
CREATE TABLE IF NOT EXISTS user_status (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user status
CREATE INDEX IF NOT EXISTS idx_user_status_is_online ON user_status(is_online);
CREATE INDEX IF NOT EXISTS idx_user_status_last_seen ON user_status(last_seen);

-- Message reactions table - stores reactions to messages
CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    reaction VARCHAR(50) NOT NULL, -- emoji or short text
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- Create indexes for message reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_reaction ON message_reactions(reaction);

-- Individual message deletions table - tracks when users delete messages for themselves only
CREATE TABLE IF NOT EXISTS message_deletions (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create indexes for message deletions
CREATE INDEX IF NOT EXISTS idx_message_deletions_message_id ON message_deletions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_deletions_user_id ON message_deletions(user_id);

-- Create trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_private_messages_updated_at 
    BEFORE UPDATE ON private_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_status_updated_at 
    BEFORE UPDATE ON user_status 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply triggers to new tables
CREATE TRIGGER update_message_reactions_updated_at 
    BEFORE UPDATE ON message_reactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_deletions_updated_at 
    BEFORE UPDATE ON message_deletions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some test conversations and messages for testing
INSERT INTO conversations (conversation_id, participant1_id, participant2_id) 
VALUES 
    ('conv_user-1_user-2', 'user-1', 'user-2'),
    ('conv_user-1_123', 'user-1', '123')
ON CONFLICT (conversation_id) DO NOTHING;

-- Insert test private messages
INSERT INTO private_messages (message_id, conversation_id, sender_id, recipient_id, content, is_encrypted) 
VALUES 
    ('test-msg-1', 'conv_user-1_user-2', 'user-1', 'user-2', 'Hello from user-1 to user-2!', false),
    ('test-msg-2', 'conv_user-1_user-2', 'user-2', 'user-1', 'Hi user-1! How are you?', false),
    ('test-msg-3', 'conv_user-1_123', 'user-1', '123', 'Hello from user-1 to user 123!', false)
ON CONFLICT (message_id) DO NOTHING;

-- Insert test user status
INSERT INTO user_status (user_id, is_online, last_seen) 
VALUES 
    ('user-1', false, NOW() - INTERVAL '1 hour'),
    ('user-2', false, NOW() - INTERVAL '30 minutes'),
    ('123', false, NOW() - INTERVAL '2 hours')
ON CONFLICT (user_id) DO NOTHING;

-- Additional indexes for backend tables (Java backend integration)
-- These indexes optimize JWT verification and user lookups

-- Index for user authentication (JWT verification)
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_username ON users_auth(username);
CREATE INDEX IF NOT EXISTS idx_users_auth_email ON users_auth(email);

-- Index for JWT revocation (token validation)
CREATE INDEX IF NOT EXISTS idx_jwt_revocation_jti ON jwt_revocation(jti);
CREATE INDEX IF NOT EXISTS idx_jwt_revocation_revoked_at ON jwt_revocation(revoked_at);

-- Index for user profile info
CREATE INDEX IF NOT EXISTS idx_user_profile_info_user_id ON user_profile_info(user_id_serial);

-- Index for chat users (fallback table)
CREATE INDEX IF NOT EXISTS idx_chat_users_user_id ON chat_users(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_users_username ON chat_users(username);

-- Table for tracking conversation deletions per user
CREATE TABLE IF NOT EXISTS conversation_deletions (
    conversation_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_auth(user_id) ON DELETE CASCADE
);

-- Performance optimization: Update table statistics
ANALYZE users_auth;
ANALYZE jwt_revocation;
ANALYZE user_profile_info;
ANALYZE private_messages;
ANALYZE conversations;
ANALYZE message_reactions;
ANALYZE message_deletions;
ANALYZE conversation_deletions;
ANALYZE user_status;
ANALYZE chat_users;
