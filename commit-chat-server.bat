@echo off
echo Starting git operations for chat server...

echo Current branch:
git branch --show-current

echo Switching to chat-server-branch...
git checkout chat-server-branch

echo Adding chat-server files...
git add chat-server/

echo Staged files:
git status --porcelain

echo Committing changes...
git commit -m "Update chat server with production-ready private messaging system - Updated production-server-no-redis.js with comprehensive JWT validation - Aligned authentication logic with Java backend microservice approach - Implemented private messaging with encryption and security features - Added comprehensive production test suite - Cleaned up redundant test and debug files - Updated documentation and deployment files"

echo Pushing to remote...
git push origin chat-server-branch

echo Chat server files committed and pushed successfully!
pause
