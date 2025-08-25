# Elite Signup - Multi-Branch Architecture

This repository contains a modular chat application with three separate components, each maintained in its own branch for independent development and deployment.

## 🏗️ Branch Architecture

### 📱 **chat-frontend-branch** - React Frontend Application
- **Location**: `chat-frontend/` directory
- **Technology**: React + Vite
- **Purpose**: User interface for the chat application
- **Features**:
  - Chat interface with real-time messaging
  - User authentication forms
  - Responsive design
  - Modern React components

**To run the frontend:**
```bash
git checkout chat-frontend-branch
cd chat-frontend
npm install
npm run dev
```

### 🔌 **chat-server-branch** - WebSocket Chat Server
- **Location**: `chat-server/` directory
- **Technology**: Node.js + WebSocket
- **Purpose**: Real-time chat functionality
- **Features**:
  - WebSocket connections for real-time messaging
  - Message broadcasting
  - User presence management
  - Chat room functionality

**To run the chat server:**
```bash
git checkout chat-server-branch
cd chat-server
npm install
npm start
```

### 🖥️ **backend** - Main Backend Server
- **Location**: `elite-signup-backend/` directory
- **Technology**: Java + Spring Boot
- **Purpose**: User management and authentication
- **Features**:
  - User registration and authentication
  - Profile management
  - Database operations
  - API endpoints for user data

**To run the backend:**
```bash
git checkout backend
cd elite-signup-backend/elite-signup-backend
mvn spring-boot:run
```

## 🚀 Getting Started

### Option 1: Run All Components (Full Stack)
1. **Start the Backend Server** (from `backend` branch)
2. **Start the Chat Server** (from `chat-server-branch`)
3. **Start the Frontend** (from `chat-frontend-branch`)

### Option 2: Frontend Only Development
```bash
git checkout chat-frontend-branch
cd chat-frontend
npm install
npm run dev
```
The frontend can run independently for UI development and testing.

### Option 3: Chat Server Development
```bash
git checkout chat-server-branch
cd chat-server
npm install
npm start
```
The chat server can be developed and tested independently.

## 🔧 Development Workflow

### Frontend Development
- Work in `chat-frontend-branch`
- Make UI/UX changes
- Test with mock data or connect to real backend
- Push changes to `chat-frontend-branch`

### Chat Server Development
- Work in `chat-server-branch`
- Implement new chat features
- Test WebSocket connections
- Push changes to `chat-server-branch`

### Backend Development
- Work in `backend` branch
- Add new API endpoints
- Modify database schema
- Push changes to `backend` branch

## 📁 Project Structure

```
elite-signup/
├── chat-frontend/          # React frontend (chat-frontend-branch)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   └── LoginForm.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── chat-server/            # WebSocket server (chat-server-branch)
│   ├── server.js
│   ├── package.json
│   └── ...
└── elite-signup-backend/   # Java backend (backend branch)
    ├── src/
    ├── pom.xml
    └── ...
```

## 🔗 Integration

### Frontend ↔ Chat Server
- Frontend connects to chat server via WebSocket
- Real-time messaging functionality
- User presence and typing indicators

### Frontend ↔ Backend
- User authentication and registration
- Profile management
- Data persistence

### Chat Server ↔ Backend
- User validation
- Message persistence (if needed)
- User session management

## 🚀 Deployment

Each component can be deployed independently:

- **Frontend**: Deploy to Vercel, Netlify, or any static hosting
- **Chat Server**: Deploy to Heroku, Railway, or any Node.js hosting
- **Backend**: Deploy to AWS, Google Cloud, or any Java hosting

## 🤝 Contributing

1. Choose the appropriate branch for your changes
2. Make your changes in the relevant component
3. Test your changes independently
4. Push to the appropriate branch
5. Create pull requests for integration testing

## 📝 Notes

- Each branch is self-contained and can run independently
- Cross-branch integration is handled through API calls and WebSocket connections
- Development can happen in parallel across all three components
- Each component has its own package.json/dependencies

---

**Current Status**: All three components are actively maintained in their respective branches for modular development and deployment.
