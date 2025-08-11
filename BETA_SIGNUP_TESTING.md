# Beta Signup Testing Guide 🚀

This guide will help you test the beta signup feature where users can sign up on the frontend and their data is stored in the backend.

## Prerequisites
- Node.js installed
- Two terminal windows

## Step-by-Step Instructions

### 1. Start the Backend Server (Terminal 1)

```bash
# Kill any existing processes on port 8081
pkill -f "node backend-server.js" || true

# Start the backend server
node backend-server.js
```

You should see:
```
🚀 Beta Signup Backend Server is running!
📡 Server URL: http://localhost:8081
```

### 2. Start the Frontend (Terminal 2)

```bash
# Kill any existing Next.js processes
pkill -f "next dev" || true

# Start the frontend
npm run dev
```

Wait for the message: `✓ Ready in...`

### 3. Test the Beta Signup

1. **Open your browser** and go to: http://localhost:3000

2. **Scroll down** to the "Join the Beta Waitlist" section (or click "Join Beta Waitlist" button)

3. **Fill in the form**:
   - Full Name: Enter any name (e.g., "John Doe")
   - Email Address: Enter any email (e.g., "john@example.com")

4. **Click** "Join Beta Waitlist" button

5. **Success!** You should see:
   - A success message: "Welcome to the Waitlist!"
   - The form will reset after 3 seconds

### 4. Verify the Signup Was Stored

#### Option A: Check the JSON file
Look at the `beta-signups.json` file in the project root. You'll see:
```json
[
  {
    "username": "John Doe",
    "email": "john@example.com",
    "timestamp": "2025-08-11T..."
  }
]
```

#### Option B: Use the API
Open a new browser tab and go to: http://localhost:8081/v1/signups

You'll see all the signups in JSON format.

#### Option C: Check the backend terminal
The backend server logs every signup:
```
Received signup request: { username: 'John Doe', email: 'john@example.com' }
New beta signup added: { ... }
Total signups: 1
```

### 5. Test Duplicate Prevention

Try signing up with the same email again. You'll see an error message:
"User with this email already exists"

## What's Happening Behind the Scenes

1. **Frontend** (http://localhost:3000)
   - User fills the form in `app/page.tsx`
   - On submit, it sends a POST request to the backend

2. **Backend** (http://localhost:8081)
   - Receives the signup data
   - Checks for duplicate emails
   - Stores the data in `beta-signups.json`
   - Returns success/error response

3. **Data Storage**
   - All signups are saved in `beta-signups.json`
   - The file persists even if you restart the server

## Troubleshooting

### "Failed to connect to server"
- Make sure the backend is running on port 8081
- Check if any firewall is blocking the connection

### "User with this email already exists"
- This is expected! The email is already registered
- Try with a different email address

### Ports already in use
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8081 | xargs kill -9  # Backend
```

## Quick Test Commands

```bash
# Test the backend directly
curl -X POST http://localhost:8081/v1/auth/pre-signup \
  -H "Content-Type: application/json" \
  -d '{"username": "Test User", "email": "test@example.com"}'

# View all signups
curl http://localhost:8081/v1/signups
```

## Success Criteria ✅

You've successfully tested the integration when:
1. ✅ You can fill the form on the frontend
2. ✅ The form submits without errors
3. ✅ You see the success message
4. ✅ The signup appears in `beta-signups.json`
5. ✅ Duplicate emails are prevented

Happy testing! 🎉