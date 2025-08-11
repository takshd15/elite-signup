#!/bin/bash

echo "Starting EliteScore Development Servers..."
echo ""

# Start backend server in background
echo "Starting Backend Server on port 8081..."
node backend-server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "Starting Frontend Server on port 3000..."
echo ""
npm run dev

# Cleanup function
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on exit
trap cleanup INT TERM EXIT