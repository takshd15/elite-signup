@echo off
echo ========================================
echo Enhanced Chat Features Test
echo ========================================
echo.

echo Step 1: Setting up enhanced database...
node setup-enhanced-database.js
echo.

echo Step 2: Starting enhanced chat server...
start "Enhanced Chat Server" cmd /k "node enhanced-chat-server.js"
echo.

echo Step 3: Waiting for server to start...
timeout /t 5 /nobreak > nul
echo.

echo Step 4: Running enhanced features test...
node test-enhanced-features.js
echo.

echo ========================================
echo Test completed!
echo ========================================
echo.
echo Enhanced features tested:
echo - Message editing
echo - Message deletion  
echo - Message search
echo - Typing indicators
echo - User status tracking
echo - User presence
echo.
pause
