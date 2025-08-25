# 🚀 Heroku Deployment Guide for Chat Server

## 📋 Prerequisites

1. **Heroku CLI** installed
2. **Git** installed
3. **Node.js** (for local testing)
4. **Heroku account** with access to your existing backend app

## 🔧 Quick Deployment

### Option 1: Automated Deployment (Recommended)
```powershell
# Run the automated deployment script
.\deploy-chat-to-heroku.ps1
```

### Option 2: Manual Deployment

#### Step 1: Install Heroku CLI
```bash
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Login to Heroku
```bash
heroku login
```

#### Step 3: Create Heroku App
```bash
# Navigate to chat-server directory
cd chat-server

# Create new Heroku app
heroku create elitescore-chat-server
```

#### Step 4: Configure Environment Variables
```bash
# Database configuration (same as your backend)
heroku config:set DB_HOST="cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com"
heroku config:set DB_PORT="5432"
heroku config:set DB_NAME="d4ukv7mqkkc9i1"
heroku config:set DB_USER="u2eb6vlhflq6bt"
heroku config:set DB_PASS="pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79"

# JWT configuration (same as backend)
heroku config:set JWT_SECRET="12341234123412341234123412341234123412341234"

# Chat encryption key
heroku config:set CHAT_ENCRYPTION_KEY="super-secure-aes-encryption-key-32"

# Node.js environment
heroku config:set NODE_ENV="production"
```

#### Step 5: Deploy
```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial commit for Heroku deployment"

# Add Heroku remote
heroku git:remote -a elitescore-chat-server

# Deploy
git push heroku main
```

#### Step 6: Verify Deployment
```bash
# Check app status
heroku ps

# View logs
heroku logs --tail

# Test the app
heroku open
```

## 🌐 Integration with Existing Backend

### Frontend Configuration
Update your frontend to connect to the deployed chat server:

```javascript
// Replace localhost:3001 with your Heroku URL
const chatServerUrl = 'wss://elitescore-chat-server.herokuapp.com';
const ws = new WebSocket(chatServerUrl);
```

### Backend Integration
Your existing Java backend (already deployed) will work seamlessly with the chat server since they share:
- Same database
- Same JWT secret
- Same user authentication system

## 📊 Monitoring

### View Logs
```bash
heroku logs --tail --app elitescore-chat-server
```

### Check App Status
```bash
heroku ps --app elitescore-chat-server
```

### Scale if Needed
```bash
# Scale to 1 dyno (free tier)
heroku ps:scale web=1 --app elitescore-chat-server

# Scale to multiple dynos (paid tier)
heroku ps:scale web=2 --app elitescore-chat-server
```

## 🔧 Troubleshooting

### Common Issues

1. **Build Failed**
   ```bash
   # Check build logs
   heroku logs --tail
   
   # Ensure all dependencies are in package.json
   npm install --save pg ws jsonwebtoken winston
   ```

2. **Database Connection Issues**
   ```bash
   # Verify environment variables
   heroku config --app elitescore-chat-server
   
   # Test database connection
   heroku run node -e "console.log(process.env.DB_HOST)"
   ```

3. **Port Issues**
   - The app automatically uses Heroku's PORT environment variable
   - No manual port configuration needed

### Health Check
```bash
# Test the deployed app
curl https://elitescore-chat-server.herokuapp.com/health
```

## 🎉 Success!

Once deployed, your chat system will be available at:
- **Chat Server**: `https://elitescore-chat-server.herokuapp.com`
- **WebSocket**: `wss://elitescore-chat-server.herokuapp.com`
- **Backend**: `https://your-backend-app.herokuapp.com`

## 📞 Support

If you encounter issues:
1. Check the logs: `heroku logs --tail`
2. Verify environment variables: `heroku config`
3. Test locally first: `node production-server-no-redis.js`
