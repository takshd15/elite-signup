@echo off
echo Starting EliteScore Development Servers...
echo.

REM Start backend server in new window
echo Starting Backend Server on port 8081...
start "Backend Server" cmd /k "node backend-server.js"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server
echo Starting Frontend Server on port 3000...
echo.
npm run dev

echo.
echo Servers are running!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8081
pause