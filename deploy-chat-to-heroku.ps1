#!/usr/bin/env pwsh

# 🚀 Deploy Chat Server to Heroku
# This script deploys the chat server to Heroku

Write-Host "🚀 Deploying Chat Server to Heroku..." -ForegroundColor Green

# Configuration
$CHAT_APP_NAME = "elitescore-chat-server"
$BACKEND_APP_NAME = "elite-score-backend"  # Your existing backend app name

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Chat App Name: $CHAT_APP_NAME" -ForegroundColor Cyan
Write-Host "  Backend App Name: $BACKEND_APP_NAME" -ForegroundColor Cyan

# Step 1: Check if Heroku CLI is installed
Write-Host "`n🔍 Checking Heroku CLI..." -ForegroundColor Yellow
try {
    $herokuVersion = heroku --version
    Write-Host "✅ Heroku CLI found: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check if logged in to Heroku
Write-Host "`n🔍 Checking Heroku login..." -ForegroundColor Yellow
try {
    $herokuUser = heroku auth:whoami
    Write-Host "✅ Logged in as: $herokuUser" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Heroku. Please run: heroku login" -ForegroundColor Red
    exit 1
}

# Step 3: Create or check if chat app exists
Write-Host "`n🔍 Checking/Creating Heroku app..." -ForegroundColor Yellow
try {
    $appExists = heroku apps:info --app $CHAT_APP_NAME 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Chat app '$CHAT_APP_NAME' already exists" -ForegroundColor Green
    } else {
        Write-Host "📝 Creating new Heroku app: $CHAT_APP_NAME" -ForegroundColor Yellow
        heroku create $CHAT_APP_NAME
        Write-Host "✅ Chat app created successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error with Heroku app: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Set up environment variables
Write-Host "`n🔧 Setting up environment variables..." -ForegroundColor Yellow

# Database configuration (same as backend)
heroku config:set DB_HOST="cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com" --app $CHAT_APP_NAME
heroku config:set DB_PORT="5432" --app $CHAT_APP_NAME
heroku config:set DB_NAME="d4ukv7mqkkc9i1" --app $CHAT_APP_NAME
heroku config:set DB_USER="u2eb6vlhflq6bt" --app $CHAT_APP_NAME
heroku config:set DB_PASS="pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79" --app $CHAT_APP_NAME

# JWT configuration (same as backend)
heroku config:set JWT_SECRET="12341234123412341234123412341234123412341234" --app $CHAT_APP_NAME

# Chat encryption key
heroku config:set CHAT_ENCRYPTION_KEY="super-secure-aes-encryption-key-32" --app $CHAT_APP_NAME

# Node.js environment
heroku config:set NODE_ENV="production" --app $CHAT_APP_NAME

Write-Host "✅ Environment variables configured" -ForegroundColor Green

# Step 5: Deploy to Heroku
Write-Host "`n🚀 Deploying to Heroku..." -ForegroundColor Yellow

# Navigate to chat-server directory
Set-Location "chat-server"

# Initialize git if needed
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
}

# Add Heroku remote
try {
    heroku git:remote -a $CHAT_APP_NAME
    Write-Host "✅ Heroku remote added" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Heroku remote might already exist" -ForegroundColor Yellow
}

# Deploy
Write-Host "📤 Pushing to Heroku..." -ForegroundColor Yellow
git add .
git commit -m "Deploy chat server to Heroku"
git push heroku main

# Step 6: Verify deployment
Write-Host "`n🧪 Verifying deployment..." -ForegroundColor Yellow

# Get the app URL
$appUrl = heroku info --app $CHAT_APP_NAME | Select-String "Web URL" | ForEach-Object { $_.ToString().Split(": ")[1].Trim() }
Write-Host "🌐 Chat Server URL: $appUrl" -ForegroundColor Cyan

# Test the deployment
try {
    $response = Invoke-WebRequest -Uri "$appUrl/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Chat server is responding!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Health check failed, but deployment might still be successful" -ForegroundColor Yellow
}

# Step 7: Open the app
Write-Host "`n🌐 Opening deployed app..." -ForegroundColor Yellow
Start-Process $appUrl

# Return to original directory
Set-Location ".."

Write-Host "`n🎉 Chat Server Deployment Complete!" -ForegroundColor Green
Write-Host "`n📋 Deployment Summary:" -ForegroundColor Yellow
Write-Host "  Chat Server URL: $appUrl" -ForegroundColor Cyan
Write-Host "  WebSocket URL: $appUrl" -ForegroundColor Cyan
Write-Host "  Backend URL: https://$BACKEND_APP_NAME.herokuapp.com" -ForegroundColor Cyan

Write-Host "`n🔗 Integration:" -ForegroundColor Yellow
Write-Host "  Your chat server is now deployed and ready to integrate with your existing backend!" -ForegroundColor Green
Write-Host "  Update your frontend to connect to: $appUrl" -ForegroundColor Cyan
