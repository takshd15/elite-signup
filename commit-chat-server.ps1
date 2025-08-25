# PowerShell script to commit and push chat server files
Write-Host "Starting git operations for chat server..."

# Check current branch
Write-Host "Current branch:"
git branch --show-current

# Switch to chat-server-branch
Write-Host "Switching to chat-server-branch..."
git checkout chat-server-branch

# Add all chat-server files
Write-Host "Adding chat-server files..."
git add chat-server/

# Check what's staged
Write-Host "Staged files:"
git status --porcelain

# Commit the changes
Write-Host "Committing changes..."
git commit -m "Update chat server with production-ready private messaging system

- Updated production-server-no-redis.js with comprehensive JWT validation
- Aligned authentication logic with Java backend microservice approach
- Implemented private messaging with encryption and security features
- Added comprehensive production test suite
- Cleaned up redundant test and debug files
- Updated documentation and deployment files

Key features:
- JWT token validation with JTI revocation checking
- Private messaging between authenticated users
- Message encryption and security measures
- Typing indicators and read receipts
- Rate limiting and input validation
- Health monitoring and graceful error handling"

# Push to remote
Write-Host "Pushing to remote..."
git push origin chat-server-branch

Write-Host "Chat server files committed and pushed successfully!"
