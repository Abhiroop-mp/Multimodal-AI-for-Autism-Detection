# Auto-Commit Watcher for Windows PowerShell
# This script will automatically commit and push changes to GitHub

Write-Host "🚀 Starting Auto-Commit Watcher..." -ForegroundColor Green
Write-Host "📁 Project: $((Get-Location).Path)" -ForegroundColor Yellow
Write-Host "⚡ Real-time file watching enabled" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the watcher" -ForegroundColor Red
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if chokidar is installed
try {
    node -e "require('chokidar')" 2>$null
    Write-Host "✅ Dependencies ready" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing required dependencies..." -ForegroundColor Yellow
    npm install chokidar
    Write-Host ""
}

# Check git status
try {
    git status
} catch {
    Write-Host "❌ Not a git repository. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

Write-Host "👀 Starting file watcher..." -ForegroundColor Cyan
Write-Host ""

# Start the auto-commit watcher
try {
    node auto-commit-advanced.js
} catch {
    Write-Host "❌ Error starting watcher: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🛑 Auto-commit watcher stopped" -ForegroundColor Yellow
