# NexNote Application Diagnostic and Setup Script
# This script checks your configuration and helps identify issues

Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host " NexNote Application Diagnostic Tool" -ForegroundColor Cyan
Write-Host ("=" * 71) -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# Check 1: .env file exists
Write-Host "[1/7] Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✅ .env file found" -ForegroundColor Green
    
    # Check Pinecone API key
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "PINECONE_API_KEY=(\S+)") {
        $apiKey = $matches[1]
        if ($apiKey -eq "your_pinecone_api_key_here" -or $apiKey -eq "") {
            Write-Host "  ❌ Pinecone API key NOT configured" -ForegroundColor Red
            $issues += "Configure your Pinecone API key in .env file"
        } else {
            Write-Host "  ✅ Pinecone API key is configured" -ForegroundColor Green
        }
    }
    
    # Check Calendar setting
    if ($envContent -match "ENABLE_CALENDAR=(true|false)") {
        $calendarEnabled = $matches[1]
        if ($calendarEnabled -eq "true") {
            Write-Host "  ✅ Calendar feature is ENABLED" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Calendar feature is DISABLED" -ForegroundColor Yellow
            $warnings += "Calendar feature is disabled. Set ENABLE_CALENDAR=true to enable."
        }
    }
} else {
    Write-Host "  ❌ .env file NOT found" -ForegroundColor Red
    $issues += "Create .env file (copy from .env.example)"
}
Write-Host ""

# Check 2: Python version
Write-Host "[2/7] Checking Python version..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✅ Python installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Python not found" -ForegroundColor Red
    $issues += "Install Python 3.8 or higher"
}
Write-Host ""

# Check 3: Required Python packages
Write-Host "[3/7] Checking Python packages..." -ForegroundColor Yellow
$requiredPackages = @("flask", "pinecone-client", "ollama", "python-dotenv")
foreach ($package in $requiredPackages) {
    $installed = python -c "import $($package.Replace('-', '_'))" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $package installed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $package NOT installed" -ForegroundColor Red
        $issues += "Install missing packages: pip install -r requirements.txt"
        break
    }
}
Write-Host ""

# Check 4: Ollama service
Write-Host "[4/7] Checking Ollama service..." -ForegroundColor Yellow
try {
    $ollamaCheck = ollama list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Ollama is installed" -ForegroundColor Green
        
        # Check required models
        if ($ollamaCheck -match "deepseek-r1") {
            Write-Host "  ✅ deepseek-r1 model found" -ForegroundColor Green
        } else {
            Write-Host "  ❌ deepseek-r1 model NOT found" -ForegroundColor Red
            $issues += "Download model: ollama pull deepseek-r1:1.5b"
        }
        
        if ($ollamaCheck -match "nomic-embed-text") {
            Write-Host "  ✅ nomic-embed-text model found" -ForegroundColor Green
        } else {
            Write-Host "  ❌ nomic-embed-text model NOT found" -ForegroundColor Red
            $issues += "Download model: ollama pull nomic-embed-text"
        }
    } else {
        Write-Host "  ❌ Ollama not responding" -ForegroundColor Red
        $issues += "Install Ollama from https://ollama.ai"
    }
} catch {
    Write-Host "  ❌ Ollama not found" -ForegroundColor Red
    $issues += "Install Ollama from https://ollama.ai"
}
Write-Host ""

# Check 5: Required directories
Write-Host "[5/7] Checking required directories..." -ForegroundColor Yellow
$dirs = @("uploads", "chat_history", "study_progress", ".flask_session")
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  ✅ $dir exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $dir missing (will be auto-created)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Check 6: Calendar credentials
Write-Host "[6/7] Checking Google Calendar setup..." -ForegroundColor Yellow
if (Test-Path "credentials.json") {
    Write-Host "  ✅ credentials.json found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  credentials.json NOT found" -ForegroundColor Yellow
    $warnings += "Calendar feature needs credentials.json for Google Calendar integration"
}
Write-Host ""

# Check 7: Port availability
Write-Host "[7/7] Checking port 5000 availability..." -ForegroundColor Yellow
$portCheck = netstat -ano | Select-String ":5000"
if ($portCheck) {
    Write-Host "  ⚠️  Port 5000 is in use" -ForegroundColor Yellow
    $warnings += "Port 5000 is already in use. You may need to stop other Flask apps."
} else {
    Write-Host "  ✅ Port 5000 is available" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host ("=" * 71) -ForegroundColor Cyan
Write-Host " Diagnostic Summary" -ForegroundColor Cyan
Write-Host ("=" * 71) -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0) {
    Write-Host "🎉 No critical issues found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your NexNote application is ready to run!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start the application:" -ForegroundColor Cyan
    Write-Host "  python app.py" -ForegroundColor White
    Write-Host "  OR" -ForegroundColor Gray
    Write-Host "  .\start.ps1" -ForegroundColor White
} else {
    Write-Host "❌ Found $($issues.Count) critical issue(s):" -ForegroundColor Red
    Write-Host ""
    for ($i = 0; $i -lt $issues.Count; $i++) {
        Write-Host "  $($i + 1). $($issues[$i])" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Found $($warnings.Count) warning(s):" -ForegroundColor Yellow
    Write-Host ""
    for ($i = 0; $i -lt $warnings.Count; $i++) {
        Write-Host "  $($i + 1). $($warnings[$i])" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host ("=" * 71) -ForegroundColor Cyan
Write-Host ""

# Offer to open .env file
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "your_pinecone_api_key_here") {
        Write-Host "Would you like to open .env file to configure your Pinecone API key? (Y/N): " -ForegroundColor Yellow -NoNewline
        $response = Read-Host
        if ($response -eq "Y" -or $response -eq "y") {
            notepad .env
        }
    }
}

Write-Host ""
Write-Host "For more information, see: FIXES_APPLIED.md" -ForegroundColor Cyan
Write-Host ""
