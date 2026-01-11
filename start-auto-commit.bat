@echo off
echo Starting Auto-Commit Watcher...
echo.
echo This will automatically commit and push changes to GitHub
echo whenever you modify or add files to the project.
echo.
echo Press Ctrl+C to stop the watcher
echo.

REM Check if chokidar is installed
node -e "require('chokidar')" 2>nul
if errorlevel 1 (
    echo Installing required dependencies...
    npm install chokidar
    echo.
)

REM Start the advanced auto-commit watcher
node auto-commit-advanced.js

pause
