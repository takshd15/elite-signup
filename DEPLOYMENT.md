# EliteScore Deployment Guide

## Overview
This guide provides instructions for deploying the EliteScore application to production.

## Architecture
- **Frontend**: Next.js application (default port 3000)
- **Backend**: Express.js API server (default port 8081)
- **Database**: JSON file storage (beta-signups.json)

## Environment Variables

### Frontend (.env.production)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Backend
```
PORT=8081
FRONTEND_URL=https://yourdomain.com
```

## Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

#### Backend (Railway/Render)
1. Create new project
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `node backend-server.js`
5. Set environment variables:
   - `PORT`: 8081 (or platform default)
   - `FRONTEND_URL`: Your frontend domain

### Option 2: Single VPS Deployment

1. **Install Node.js 20.x**
2. **Install PM2**: `npm install -g pm2`
3. **Clone repository**
4. **Install dependencies**: `npm install`
5. **Build frontend**: `npm run build`
6. **Create ecosystem.config.js**:
```javascript
module.exports = {
  apps: [
    {
      name: 'elite-backend',
      script: 'backend-server.js',
      env: {
        PORT: 8081,
        FRONTEND_URL: 'https://yourdomain.com'
      }
    },
    {
      name: 'elite-frontend',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://api.yourdomain.com'
      }
    }
  ]
}
```
7. **Start with PM2**: `pm2 start ecosystem.config.js`
8. **Setup Nginx reverse proxy**

### Option 3: Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: .
    command: node backend-server.js
    ports:
      - "8081:8081"
    environment:
      - PORT=8081
      - FRONTEND_URL=https://yourdomain.com
    volumes:
      - ./beta-signups.json:/app/beta-signups.json
  
  frontend:
    build: .
    command: npm start
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    depends_on:
      - backend
```

## Domain Configuration

1. **Frontend**: Point your main domain (e.g., elitescore.com) to the frontend
2. **Backend**: Create subdomain (e.g., api.elitescore.com) for the API

## SSL Configuration
- Use Let's Encrypt for free SSL certificates
- Configure in Nginx or use platform's SSL feature

## Database Considerations
The current implementation uses a JSON file for storage. For production:
- Ensure persistent storage for `beta-signups.json`
- Consider migrating to a proper database (PostgreSQL, MongoDB)
- Implement regular backups

## Monitoring
- Set up health checks for both services
- Monitor disk space (for JSON file growth)
- Set up error logging and alerts

## Security Checklist
- [ ] Enable HTTPS on both frontend and backend
- [ ] Configure proper CORS settings
- [ ] Add rate limiting to API endpoints
- [ ] Validate and sanitize all inputs
- [ ] Keep dependencies updated
- [ ] Use environment variables for sensitive data