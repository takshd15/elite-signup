# Running EliteScore Locally

## Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

## Quick Start

### Windows
Double-click `start-dev.bat` or run:
```cmd
start-dev.bat
```

### Mac/Linux
Run:
```bash
./start-dev.sh
```

## Manual Start (if scripts don't work)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Backend Server
Open a new terminal and run:
```bash
node backend-server.js
```

You should see:
```
🚀 Beta Signup Backend Server is running!
📡 Server URL: http://localhost:8081
```

### Step 3: Start Frontend Server
Open another terminal and run:
```bash
npm run dev
```

You should see:
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
```

## Troubleshooting

### Error: "Failed to connect to server"
1. Make sure the backend server is running on port 8081
2. Check if another process is using port 8081:
   - Windows: `netstat -ano | findstr :8081`
   - Mac/Linux: `lsof -i :8081`

### Error: "Port 3000 is already in use"
1. Kill the process using port 3000
2. Or change the port: `npm run dev -- -p 3001`

### Backend not starting
1. Check if `backend-server.js` exists
2. Ensure all dependencies are installed: `npm install`
3. Check for syntax errors in the console

### Frontend not connecting to backend
1. Verify backend is running: `curl http://localhost:8081/v1/status`
2. Check browser console for CORS errors
3. Ensure `.env.local` file exists with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8081
   ```

## Testing Beta Signup

1. Open http://localhost:3000
2. Scroll to "Join Our Beta Program" section
3. Fill in the form and submit
4. Check `beta-signups.json` for saved data

## Stopping the Servers

### Windows
- Close the terminal windows
- Or press Ctrl+C in each terminal

### Mac/Linux
- Press Ctrl+C in the terminal
- Or run: `pkill -f "node backend-server.js"`