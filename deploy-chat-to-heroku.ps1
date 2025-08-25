# Deploy Chat Server to Heroku
Write-Host "🚀 Deploying Chat Server to Heroku..." -ForegroundColor Green

# Configuration
$CHAT_APP_NAME = "elitescore-chat-server"

Write-Host "📋 Chat App Name: $CHAT_APP_NAME" -ForegroundColor Yellow

# Check Heroku CLI
try {
    $herokuVersion = heroku --version
    Write-Host "✅ Heroku CLI found: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Check login
try {
    $herokuUser = heroku auth:whoami
    Write-Host "✅ Logged in as: $herokuUser" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Heroku. Please run: heroku login" -ForegroundColor Red
    exit 1
}

# Create app if needed
Write-Host "`n🔍 Creating Heroku app..." -ForegroundColor Yellow
heroku create $CHAT_APP_NAME

# Set environment variables
Write-Host "`n🔧 Setting environment variables..." -ForegroundColor Yellow
heroku config:set DB_HOST="cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com" --app $CHAT_APP_NAME
heroku config:set DB_PORT="5432" --app $CHAT_APP_NAME
heroku config:set DB_NAME="d4ukv7mqkkc9i1" --app $CHAT_APP_NAME
heroku config:set DB_USER="u2eb6vlhflq6bt" --app $CHAT_APP_NAME
heroku config:set DB_PASS="pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79" --app $CHAT_APP_NAME
heroku config:set JWT_SECRET="12341234123412341234123412341234123412341234" --app $CHAT_APP_NAME
heroku config:set CHAT_ENCRYPTION_KEY="super-secure-aes-encryption-key-32" --app $CHAT_APP_NAME
heroku config:set NODE_ENV="production" --app $CHAT_APP_NAME

Write-Host "✅ Environment variables configured" -ForegroundColor Green

# Deploy
Write-Host "`n🚀 Deploying to Heroku..." -ForegroundColor Yellow
Set-Location "chat-server"

if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
}

heroku git:remote -a $CHAT_APP_NAME
git add .
git commit -m "Deploy chat server to Heroku"
git push heroku main

# Get app URL
$appUrl = heroku info --app $CHAT_APP_NAME | Select-String "Web URL" | ForEach-Object { $_.ToString().Split(": ")[1].Trim() }

Set-Location ".."

Write-Host "`n🎉 Chat Server Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Chat Server URL: $appUrl" -ForegroundColor Cyan
Write-Host "🔗 WebSocket URL: $appUrl" -ForegroundColor Cyan
