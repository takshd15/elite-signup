# Backend Testing Guide for EliteScore

## 🚀 Quick Testing Steps

### 1. Test Your Backend is Running

Make sure your Java backend is running on `http://localhost:8080`

### 2. Test the Landing Page Waitlist

1. Open your landing page: `http://localhost:3000`
2. Scroll down to "Join the Beta Waitlist" section
3. Fill in:
   - **Name**: Test User
   - **Email**: test@example.com
4. Click "Join Beta Waitlist"
5. Check browser console (F12) for connection logs

### 3. Expected Results

**✅ Success:**
- Form shows "Welcome to the Waitlist!" message
- Console shows: `✅ Waitlist signup successful!`
- Backend receives the user data

**❌ Backend Offline:**
- Alert popup: "Failed to join waitlist: Connection failed"
- Console shows: `❌ All backend URLs failed`

### 4. Manual API Testing

Test the backend directly:

```bash
# Test status endpoint
curl http://localhost:8080/v1/status

# Test waitlist signup
curl -X POST http://localhost:8080/v1/auth/pre-signup \
  -H "Content-Type: application/json" \
  -d '{"username":"TestUser","email":"test@example.com"}'
```

### 5. Backend Logs

Check your Java backend console for:
- Incoming requests to `/v1/auth/pre-signup`
- Database operations (if connected)
- Any error messages

## 🔧 Troubleshooting

**CORS Issues:**
- Your backend has `AuthCORSFilter` configured
- Should allow requests from `http://localhost:3000`

**Port Issues:**
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`

**Database Issues:**
- Check if your database is connected
- Verify user creation in database tables

## 📊 What the Landing Page Does

1. **Form Submission**: Captures name and email
2. **API Call**: Sends POST to `/v1/auth/pre-signup`
3. **Error Handling**: Shows alerts on failure
4. **Success State**: Shows confirmation message
5. **Console Logging**: Detailed logs for debugging

## 🎯 Success Criteria

- [x] Form accepts user input
- [x] API call to backend works
- [x] Success/error states display properly
- [x] Console shows helpful debugging info
- [x] Backend receives and processes data correctly
