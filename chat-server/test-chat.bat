@echo off
echo Starting Chat Server Test...
echo.

echo Step 1: Starting the chat server...
start "Chat Server" cmd /k "node production-server-no-redis.js"

echo Step 2: Waiting for server to start...
timeout /t 5 /nobreak > nul

echo Step 3: Running test with existing user...
node quick-test.js

echo.
echo Test completed!
pause
