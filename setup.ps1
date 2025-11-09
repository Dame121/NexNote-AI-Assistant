# NexNote Setup Script for Windows
# This script sets up the development environment

Write-Host "🔧 NexNote Setup Script" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Step 1: Check Python
Write-Host "1️⃣  Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "   ✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Step 2: Create virtual environment
Write-Host ""
Write-Host "2️⃣  Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path ".\venv") {
    Write-Host "   ⚠️  Virtual environment already exists, skipping..." -ForegroundColor Yellow
} else {
    python -m venv venv
    Write-Host "   ✅ Virtual environment created" -ForegroundColor Green
}

# Step 3: Activate and install dependencies
Write-Host ""
Write-Host "3️⃣  Installing dependencies..." -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green

# Step 4: Create .env file
Write-Host ""
Write-Host "4️⃣  Setting up environment configuration..." -ForegroundColor Yellow
if (Test-Path ".\.env") {
    Write-Host "   ⚠️  .env already exists, skipping..." -ForegroundColor Yellow
} else {
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "   ✅ .env file created from template" -ForegroundColor Green
    Write-Host "   ⚠️  Please edit .env with your API keys!" -ForegroundColor Yellow
}

# Step 5: Check Ollama
Write-Host ""
Write-Host "5️⃣  Checking Ollama..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version 2>&1
    Write-Host "   ✅ Ollama installed: $ollamaVersion" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "   📥 Downloading required models..." -ForegroundColor Yellow
    ollama pull deepseek-r1:1.5b
    ollama pull nomic-embed-text
    Write-Host "   ✅ Models downloaded" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Ollama not found!" -ForegroundColor Yellow
    Write-Host "   Please install from: https://ollama.ai" -ForegroundColor Yellow
}

# Step 6: Create necessary directories
Write-Host ""
Write-Host "6️⃣  Creating necessary directories..." -ForegroundColor Yellow
$directories = @("uploads", "chat_history", "study_progress", ".flask_session")
foreach ($dir in $directories) {
    if (-Not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}
Write-Host "   ✅ Directories created" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Edit .env with your Pinecone API key and other settings"
Write-Host "   2. Make sure Ollama is running (ollama serve)"
Write-Host "   3. Run: .\start.ps1"
Write-Host ""
