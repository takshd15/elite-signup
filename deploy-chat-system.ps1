#!/usr/bin/env pwsh

# 🚀 Chat System Deployment Script
# This script sets up and starts the complete chat system

Write-Host "🚀 Starting Chat System Deployment..." -ForegroundColor Green

# Configuration
$JAVA_HOME = "C:\Program Files\Java\jdk-17"
$DB_USER = "u2eb6vlhflq6bt"
$DB_PASS = "pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79"
$DB_URL = "jdbc:postgresql://cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d4ukv7mqkkc9i1"
$JAVA_PORT = "8080"
$CHAT_PORT = "3001"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Java Backend Port: $JAVA_PORT" -ForegroundColor Cyan
Write-Host "  Chat Server Port: $CHAT_PORT" -ForegroundColor Cyan
Write-Host "  Database: $DB_URL" -ForegroundColor Cyan

# Step 1: Check if Java backend is running
Write-Host "`n🔍 Checking Java Backend..." -ForegroundColor Yellow
$javaProcess = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcess) {
    Write-Host "✅ Java backend is already running" -ForegroundColor Green
} else {
    Write-Host "⚠️ Java backend not running, starting..." -ForegroundColor Yellow
    
    # Start Java backend
    $env:JAVA_HOME = $JAVA_HOME
    $env:DB_USER = $DB_USER
    $env:DB_PASS = $DB_PASS
    $env:DB_URL = $DB_URL
    $env:PORT = $JAVA_PORT
    
    Start-Process -FilePath "java" -ArgumentList "-jar", "target/elitescore-backend-1.0.0.jar" -WorkingDirectory "elite-signup-backend/elite-signup-backend" -WindowStyle Minimized
    
    Write-Host "✅ Java backend started" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Step 2: Check if Node.js chat server is running
Write-Host "`n🔍 Checking Node.js Chat Server..." -ForegroundColor Yellow
$nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Write-Host "✅ Node.js chat server is already running" -ForegroundColor Green
} else {
    Write-Host "⚠️ Node.js chat server not running, starting..." -ForegroundColor Yellow
    
    # Install dependencies if needed
    if (-not (Test-Path "chat-server/node_modules")) {
        Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
        Set-Location "chat-server"
        npm install
        Set-Location ".."
    }
    
    # Start chat server
    Start-Process -FilePath "node" -ArgumentList "production-server-no-redis.js" -WorkingDirectory "chat-server" -WindowStyle Minimized
    
    Write-Host "✅ Node.js chat server started" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# Step 3: Test the system
Write-Host "`n🧪 Testing Chat System..." -ForegroundColor Yellow

# Test Java backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$JAVA_PORT/v1/status" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Java backend is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Java backend test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test chat server
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$CHAT_PORT/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Chat server is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Chat server test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Run quick chat test
Write-Host "`n🧪 Running Quick Chat Test..." -ForegroundColor Yellow
try {
    node quick-chat-test.js
    Write-Host "✅ Chat functionality test completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Chat test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Chat System Deployment Complete!" -ForegroundColor Green
Write-Host "`n📋 System Status:" -ForegroundColor Yellow
Write-Host "  Java Backend: http://localhost:$JAVA_PORT" -ForegroundColor Cyan
Write-Host "  Chat Server: ws://localhost:$CHAT_PORT" -ForegroundColor Cyan
Write-Host "  Health Check: http://localhost:$CHAT_PORT/health" -ForegroundColor Cyan

Write-Host "`n🚀 Your chat system is ready for production!" -ForegroundColor Green
