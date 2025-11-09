# NexNote Flask App Startup Script
# This script checks prerequisites and starts the Flask application

Write-Host "🚀 Starting NexNote Flask App..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to script directory
Set-Location $PSScriptRoot

# Check if virtual environment exists
if (-Not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Please run: python -m venv venv" -ForegroundColor Yellow
    Write-Host "   Then: .\venv\Scripts\activate" -ForegroundColor Yellow
    Write-Host "   Then: pip install -r requirements.txt" -ForegroundColor Yellow
    pause
    exit 1
}

# Check if .env file exists
if (-Not (Test-Path ".\.env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "✅ Please edit .env with your API keys before running again." -ForegroundColor Green
    pause
    exit 1
}

# Check if Ollama is running
Write-Host "🔍 Checking Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method Get -ErrorAction Stop
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not running!" -ForegroundColor Red
    Write-Host "   Please start Ollama first: ollama serve" -ForegroundColor Yellow
    Write-Host "   Or run Ollama desktop application" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "✅ All checks passed!" -ForegroundColor Green
Write-Host "🌐 Starting Flask server..." -ForegroundColor Cyan
Write-Host "📱 Open http://localhost:5000 in your browser" -ForegroundColor Cyan
Write-Host ""

# Run with venv Python
.\venv\Scripts\python.exe app.py
