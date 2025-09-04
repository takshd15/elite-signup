#!/bin/bash

# Elite Chat Server - Heroku Deployment Script
# This script automates the deployment process to Heroku

echo "🚀 Elite Chat Server - Heroku Deployment"
echo "========================================"

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Not logged in to Heroku. Please run: heroku login"
    exit 1
fi

# Get app name from user or use default
read -p "Enter Heroku app name (or press Enter for 'elite-chat-server'): " APP_NAME
APP_NAME=${APP_NAME:-elite-chat-server}

echo "📱 Deploying to app: $APP_NAME"

# Create Heroku app if it doesn't exist
if ! heroku apps:info $APP_NAME &> /dev/null; then
    echo "🆕 Creating new Heroku app: $APP_NAME"
    heroku create $APP_NAME
else
    echo "✅ Using existing Heroku app: $APP_NAME"
fi

# Add required addons
echo "🔧 Adding required addons..."

# Add Heroku Postgres
echo "📊 Adding Heroku Postgres..."
heroku addons:create heroku-postgresql:mini --app $APP_NAME

# Add Heroku Redis
echo "🔴 Adding Heroku Redis..."
heroku addons:create heroku-redis:mini --app $APP_NAME

# Set environment variables
echo "⚙️  Setting environment variables..."

# Security keys (generate random secrets)
JWT_SECRET=$(openssl rand -base64 32)
CHAT_ENCRYPTION_KEY=$(openssl rand -base64 32)

heroku config:set NODE_ENV=production --app $APP_NAME
heroku config:set JWT_SECRET="$JWT_SECRET" --app $APP_NAME
heroku config:set CHAT_ENCRYPTION_KEY="$CHAT_ENCRYPTION_KEY" --app $APP_NAME
heroku config:set RATE_LIMIT_WINDOW_MS=900000 --app $APP_NAME
heroku config:set RATE_LIMIT_MAX_REQUESTS=100 --app $APP_NAME
heroku config:set MESSAGE_RATE_LIMIT=30 --app $APP_NAME
heroku config:set MAX_CONNECTIONS_PER_IP=10 --app $APP_NAME
heroku config:set CONNECTION_TIMEOUT=30000 --app $APP_NAME
heroku config:set LOG_LEVEL=info --app $APP_NAME
heroku config:set HEALTH_CHECK_INTERVAL=30000 --app $APP_NAME
heroku config:set HEALTH_CHECK_TIMEOUT=5000 --app $APP_NAME
heroku config:set MAX_PAYLOAD_SIZE=1048576 --app $APP_NAME
heroku config:set KEEP_ALIVE_TIMEOUT=60000 --app $APP_NAME
heroku config:set MAX_CONNECTIONS=10000 --app $APP_NAME
heroku config:set DB_MAX_CONNECTIONS=500 --app $APP_NAME
heroku config:set DB_MIN_CONNECTIONS=50 --app $APP_NAME
heroku config:set DB_IDLE_TIMEOUT=10000 --app $APP_NAME
heroku config:set DB_CONNECTION_TIMEOUT=1000 --app $APP_NAME
heroku config:set DB_STATEMENT_TIMEOUT=10000 --app $APP_NAME

echo "✅ Environment variables set successfully"

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku with Redis support"
git push heroku main

# Run database migrations
echo "🗄️  Setting up database..."
heroku run "node -e \"require('./database/messageOperations').initializeTables()\"" --app $APP_NAME

# Scale the app
echo "📈 Scaling the app..."
heroku ps:scale web=1 worker=1 --app $APP_NAME

# Show app info
echo "📱 App Information:"
heroku apps:info $APP_NAME

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Your app is available at: https://$APP_NAME.herokuapp.com"
echo "📊 Redis URL: $(heroku config:get REDIS_URL --app $APP_NAME)"
echo "🗄️  Database URL: $(heroku config:get DATABASE_URL --app $APP_NAME | cut -c1-20)..."
echo ""
echo "📋 Useful commands:"
echo "   heroku logs --tail --app $APP_NAME"
echo "   heroku ps --app $APP_NAME"
echo "   heroku config --app $APP_NAME"
echo "   heroku run bash --app $APP_NAME"
