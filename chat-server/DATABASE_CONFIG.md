# Database Configuration for Chat Server

## PostgreSQL Connection

The chat server connects to the same PostgreSQL database as the Java backend.

### Environment Variables

Create a `.env` file in the `chat-server` directory with the following variables:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elitescore
DB_USER=postgres
DB_PASSWORD=your_password_here

# Chat Server Configuration
NODE_ENV=production
JWT_SECRET=12341234123412341234123412341234123412341234
```

### Database Tables

The chat server will automatically create the following table:

#### `chat_messages`
- `id` - Serial primary key
- `message_id` - Unique message identifier (UUID)
- `channel_id` - Channel where message was sent
- `user_id` - User who sent the message
- `username` - Username of the sender
- `content` - Message content
- `created_at` - Timestamp when message was created
- `updated_at` - Timestamp when message was last updated

### User Details

The chat server fetches user details from the existing Java backend tables:
- `users_auth` - User authentication information
- `user_profile_info` - User profile information

### Features

✅ **JWT Authentication** - Uses same JWT system as Java backend
✅ **User Details** - Fetches real user data from database
✅ **Message Persistence** - Saves messages to PostgreSQL
✅ **Message History** - Loads previous messages from database
✅ **Fallback Mode** - Works without database connection
✅ **Real-time Chat** - WebSocket communication

### Testing

To test the database connection:

1. Ensure PostgreSQL is running
2. Set the correct database credentials in `.env`
3. Start the chat server: `node production-server-no-redis.js`
4. Look for "Database connected successfully" in the logs
