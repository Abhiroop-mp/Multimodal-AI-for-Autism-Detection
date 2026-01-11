# 🚀 Auto-Commit System

This project includes an automatic commit and push system that will automatically sync your changes with GitHub whenever you modify or add files.

## 📋 Features

- **Real-time file watching**: Monitors all file changes in your project
- **Smart commit messages**: Generates descriptive commit messages based on file types
- **Debounced commits**: Waits 3 seconds after changes before committing to avoid excessive commits
- **Ignores unnecessary files**: Skips `node_modules`, `__pycache__`, and other temporary files
- **Automatic GitHub push**: Pushes commits directly to your GitHub repository

## 🛠️ Setup

### Prerequisites
- Node.js installed
- Git configured with your GitHub credentials
- Project connected to GitHub repository

### Quick Start (Windows)

#### Option 1: Batch File (Easiest)
```bash
# Double-click this file or run in command prompt
start-auto-commit.bat
```

#### Option 2: PowerShell
```powershell
# Run in PowerShell
.\start-auto-commit.ps1
```

#### Option 3: Manual
```bash
# Install dependencies (only need to run once)
npm install chokidar

# Start the watcher
node auto-commit-advanced.js
```

## 📁 How It Works

1. **File Monitoring**: The system watches all files in your project directory
2. **Change Detection**: When you save a file, it detects the change
3. **Debouncing**: Waits 3 seconds after the last change before committing
4. **Smart Commits**: Creates descriptive commit messages like:
   - "Update page: dashboard.html"
   - "Add script: new-feature.js"
   - "Update module: enhanced_game_prediction_ml.py"
5. **Auto Push**: Automatically pushes commits to GitHub

## 🎯 What Gets Monitored

All files are monitored except:
- `node_modules/`
- `__pycache__/`
- `.git/`
- `*.log` files
- `.env` files
- `dist/` and `build/` folders
- Auto-commit scripts themselves

## 📝 Example Commit Messages

```
Add page: new-game.html - 1/11/2026, 2:30:45 PM
Update script: dashboard.js - 1/11/2026, 2:31:12 PM
Add module: ml_predictor.py - 1/11/2026, 2:32:05 PM
Auto-commit: 3 file(s) changed - 1/11/2026, 2:33:20 PM
```

## ⚙️ Configuration

You can modify the settings in `auto-commit-advanced.js`:

```javascript
this.debounceTime = 3000; // Change debounce time (milliseconds)
this.ignoredPaths = [      // Add more patterns to ignore
    'node_modules/**',
    '**/__pycache__/**',
    // Add your patterns here
];
```

## 🛑 Stopping the Auto-Commit

Press `Ctrl+C` in the terminal window to stop the watcher.

## 🔧 Troubleshooting

### "Git not found" Error
- Make sure Git is installed and in your PATH
- Run `git --version` to verify installation

### "Permission Denied" Error
- Make sure you have write permissions to the project folder
- Run PowerShell as Administrator if needed

### "Nothing to commit" Message
- This is normal - it means no changes were detected
- The system will continue watching for new changes

### GitHub Authentication Issues
- Make sure your Git credentials are configured:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- For GitHub, you might need a personal access token instead of password

## 📞 Support

If you encounter any issues:
1. Check that Node.js and Git are properly installed
2. Verify you're in the correct project directory
3. Ensure your GitHub repository is properly configured
4. Check the terminal output for error messages

---

**Note**: The auto-commit system will only work when the watcher script is running. Make sure to start it when you begin working on your project.
