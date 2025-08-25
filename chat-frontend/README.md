# EliteScore Chat Frontend

A modern React-based chat interface that integrates with the EliteScore chat server and Java backend.

## 🚀 Features

### **Real-time Chat**
- WebSocket-based real-time messaging
- Multiple channels (General, Feedback, Career, Learning, Networking)
- Typing indicators
- Online user presence
- Message reactions (👍, ❤️, 😂)
- Message replies and threading

### **Authentication**
- JWT-based authentication with Java backend
- Session persistence
- Secure token management

### **User Experience**
- Modern, responsive design
- Mobile-friendly interface
- Real-time connection status
- Message timestamps
- Auto-scroll to latest messages

### **Security**
- Encrypted message transmission
- Secure WebSocket connections
- JWT token validation

## 🛠️ Setup

### Prerequisites
- Node.js 18+ 
- Chat server running on port 3001
- Java backend running on port 8080

### Installation

1. **Install dependencies:**
   ```bash
   cd chat-frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Chat Server: ws://localhost:3001
   - Java Backend: http://localhost:8080

## 📁 Project Structure

```
chat-frontend/
├── src/
│   ├── components/
│   │   ├── ChatInterface.jsx    # Main chat component
│   │   ├── ChatInterface.css    # Chat styles
│   │   ├── LoginForm.jsx        # Authentication form
│   │   └── LoginForm.css        # Login styles
│   ├── App.jsx                  # Main app component
│   ├── App.css                  # App styles
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── vite.config.js               # Vite configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🔧 Configuration

### Vite Configuration
The `vite.config.js` file includes proxy settings for development:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // Java backend
      changeOrigin: true
    },
    '/ws': {
      target: 'ws://localhost:3001',    // Chat server
      ws: true
    }
  }
}
```

### Environment Variables
Create a `.env` file for production settings:

```env
VITE_CHAT_SERVER_URL=ws://your-chat-server.com
VITE_API_BASE_URL=https://your-backend.com/api
```

## 🎯 Integration with Landing Page

### Option 1: Standalone Chat App
Use this as a separate chat application that users can access after logging in.

### Option 2: Embedded in Landing Page
To integrate with your main landing page:

1. **Copy components to your main app:**
   ```bash
   cp -r src/components/ /path/to/your/main-app/
   ```

2. **Import and use in your main app:**
   ```jsx
   import ChatInterface from './components/ChatInterface'
   
   function YourMainApp() {
     return (
       <div>
         {/* Your existing landing page content */}
         <ChatInterface token={userToken} user={userData} />
       </div>
     )
   }
   ```

3. **Add routing (if using React Router):**
   ```jsx
   <Route path="/chat" element={<ChatInterface token={token} user={user} />} />
   ```

## 🔌 API Integration

### Authentication Endpoints
The frontend expects these endpoints from your Java backend:

- `POST /api/auth/login` - User authentication
- `GET /api/auth/validate` - Token validation (optional)

### WebSocket Events
The chat interface sends and receives these WebSocket events:

**Client → Server:**
- `authenticate` - JWT authentication
- `join_channel` - Join a chat channel
- `send_message` - Send a new message
- `typing` - Typing indicators
- `add_reaction` - Add emoji reaction
- `remove_reaction` - Remove emoji reaction

**Server → Client:**
- `authenticated` - Authentication success
- `channel_joined` - Channel join confirmation
- `new_message` - New message received
- `user_joined` - User joined channel
- `user_left` - User left channel
- `typing_update` - Typing status update
- `reaction_added` - Reaction added
- `reaction_removed` - Reaction removed

## 🎨 Customization

### Styling
- Modify CSS files in `src/components/` to match your brand
- Update color scheme in CSS variables
- Adjust responsive breakpoints

### Features
- Add new emoji reactions in `ChatInterface.jsx`
- Modify channel list in the component state
- Add new message types and handlers

### Branding
- Update app title in `index.html`
- Change logo and favicon
- Modify gradient colors in CSS

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
1. **Static hosting** (Netlify, Vercel, etc.)
2. **Docker container**
3. **CDN deployment**

### Environment Setup
Ensure your production environment has:
- Chat server accessible via WebSocket
- Java backend API accessible
- Proper CORS configuration
- SSL certificates for secure connections

## 🔒 Security Considerations

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- WebSocket connections use the same JWT for authentication
- Messages are encrypted on the server side
- Rate limiting is handled by the chat server

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure chat server is running on port 3001
   - Check firewall settings
   - Verify WebSocket URL in development

2. **Authentication Failed**
   - Verify Java backend is running on port 8080
   - Check JWT token format
   - Ensure user exists in database

3. **Messages Not Sending**
   - Check WebSocket connection status
   - Verify user is authenticated
   - Check browser console for errors

### Debug Mode
Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true')
```

## 📱 Mobile Support

The chat interface is fully responsive and works on:
- iOS Safari
- Android Chrome
- Mobile browsers

Key mobile features:
- Touch-friendly interface
- Responsive layout
- Optimized for small screens
- Swipe gestures (can be added)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the EliteScore application suite.
