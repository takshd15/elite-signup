# Chat System Integration

## Overview
This repository now includes a complete chat system integrated with the existing Java backend. The system consists of:

1. **Java Backend** - User authentication, JWT generation, and user management
2. **Node.js Chat Server** - Real-time WebSocket communication for chat
3. **Shared PostgreSQL Database** - Both systems use the same database

## Architecture

### Components
- **Java Backend** (`src/main/java/`) - Handles user authentication and JWT
- **Node.js Chat Server** (`chat-server/`) - Handles real-time messaging
- **Database** - PostgreSQL shared between both systems
- **JWT Authentication** - Unified authentication across both systems

### Data Flow
1. User logs in via Java backend → receives JWT token
2. Chat widget connects to Node.js server with JWT token
3. Node.js server validates JWT with Java backend
4. Both systems read/write to shared PostgreSQL database

## Files Structure

### Chat Server Files
```
chat-server/
├── enhanced-chat-server.js          # Main WebSocket server
├── production-server-no-redis.js    # Production server
├── enhanced_chat_tables.sql         # Database schema
├── setup-enhanced-database.js       # Database setup script
├── test-enhanced-features.js        # Feature testing
├── test-enhanced-chat.bat           # Automated testing
├── ENHANCED_FEATURES.md             # Feature documentation
└── package.json                     # Node.js dependencies
```

### Java Backend Files
```
src/main/java/com/example/elitescorebackend/
├── res/
│   ├── AuthResource.java            # Authentication endpoints
│   ├── ProfileResource.java         # User profile management
│   └── FollowResource.java          # Follow system
├── models/
│   ├── User.java                    # User model
│   └── ProfileInfo.java             # Profile model
└── handlers/
    └── UserHandler.java             # User database operations
```

## Features

### ✅ Implemented Features
- **Real-time messaging** with WebSocket
- **JWT authentication** integration
- **Multi-channel support** (general, feedback, career, etc.)
- **Message editing and deletion**
- **Message search** with full-text search
- **Typing indicators**
- **User online/offline status**
- **Message reactions**
- **Read receipts**
- **Database persistence** to PostgreSQL
- **Multi-user support**

### 🔄 Integration Points
- **Authentication**: Node.js server validates JWT with Java backend
- **Database**: Both systems use same PostgreSQL instance
- **User Management**: Java backend handles user registration/login
- **Real-time Chat**: Node.js server handles WebSocket communication

## Deployment

### Heroku Configuration
The `Procfile` is configured to run both services:
```bash
web: java $JAVA_OPTS -jar target/elitescore-backend-1.0.0.jar
chat: node chat-server/enhanced-chat-server.js
```

### Environment Variables Required
```bash
# Database (shared between Java and Node.js)
DB_USER=your_db_user
DB_PASS=your_db_password
DB_URL=your_db_url

# JWT (shared between Java and Node.js)
JWT_SECRET=your_jwt_secret

# Chat Server
WS_PORT=8080
NODE_ENV=production
```

## Testing

### Quick Test
```bash
# Start the chat server
cd chat-server
node enhanced-chat-server.js

# In another terminal, run tests
node test-enhanced-features.js
```

### Automated Testing
```bash
# Windows
test-enhanced-chat.bat

# Linux/Mac
./test-enhanced-chat.sh
```

## Database Setup

### Initial Setup
```bash
cd chat-server
node setup-enhanced-database.js
```

### Schema
The chat system uses these tables:
- `chat_channels` - Channel information
- `chat_messages` - Message storage with full-text search
- `chat_reactions` - Message reactions
- `chat_user_status` - Online/offline status
- `chat_typing_indicators` - Typing indicators
- `chat_read_receipts` - Read receipts

## API Endpoints

### Java Backend (REST)
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /auth/verify` - JWT verification
- `GET /profile/{userId}` - User profile

### Node.js Chat Server (WebSocket)
- `authenticate` - JWT authentication
- `join_channel` - Join chat channel
- `send_message` - Send message
- `edit_message` - Edit message
- `delete_message` - Delete message
- `search_messages` - Search messages
- `typing_start/stop` - Typing indicators
- `add_reaction` - Add reaction to message

## Security

### JWT Integration
- Node.js server validates JWT tokens with Java backend
- Same JWT secret used by both systems
- Token expiration handled by Java backend
- Secure WebSocket authentication

### Database Security
- SSL connection to PostgreSQL
- Prepared statements prevent SQL injection
- User permissions enforced at application level

## Future Integration

### Frontend Integration
The chat widget (`components/chat-widget-production.tsx`) is ready for integration:
- Uses JWT authentication
- Connects to WebSocket server
- Supports all implemented features
- Can be embedded in any React/Next.js page

### Beta Testing Flow
1. User pre-signs up on landing page
2. User gets approved for beta testing
3. User logs in and receives JWT
4. Chat widget appears for authenticated beta testers
5. Real-time communication with other beta testers

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL credentials are correct
2. **JWT Validation**: Verify JWT secret is same in both systems
3. **WebSocket Connection**: Check if chat server is running on correct port
4. **Authentication**: Ensure user is logged in and has valid JWT

### Logs
- Java backend logs: Heroku logs --tail
- Chat server logs: Check console output
- Database logs: Check PostgreSQL logs

## Support
For issues or questions about the chat integration, check:
1. `ENHANCED_FEATURES.md` - Detailed feature documentation
2. `DATABASE_CONFIG.md` - Database configuration
3. Test files in `chat-server/` - Examples of usage
