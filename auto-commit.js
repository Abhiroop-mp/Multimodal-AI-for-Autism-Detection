#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoCommit {
    constructor(projectPath = '.') {
        this.projectPath = path.resolve(projectPath);
        this.lastCommitTime = Date.now();
        this.debounceTime = 5000; // 5 seconds debounce
        this.pendingCommit = false;
        
        // Files and directories to ignore
        this.ignorePatterns = [
            'node_modules/',
            '__pycache__/',
            '*.pyc',
            '.git/',
            '*.log',
            '.env',
            'dist/',
            'build/',
            '.DS_Store'
        ];
    }

    shouldIgnore(filePath) {
        return this.ignorePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filePath);
        });
    }

    async checkForChanges() {
        try {
            // Check if there are any changes
            const status = execSync('git status --porcelain', { 
                cwd: this.projectPath,
                encoding: 'utf8'
            });

            if (status.trim()) {
                console.log('📝 Changes detected:');
                console.log(status);
                
                // Add all changes
                execSync('git add .', { cwd: this.projectPath });
                
                // Create commit message based on changes
                const commitMessage = this.generateCommitMessage(status);
                
                // Commit changes
                execSync(`git commit -m "${commitMessage}"`, { 
                    cwd: this.projectPath,
                    stdio: 'inherit'
                });
                
                // Push to GitHub
                console.log('🚀 Pushing to GitHub...');
                execSync('git push origin main', { 
                    cwd: this.projectPath,
                    stdio: 'inherit'
                });
                
                console.log('✅ Successfully committed and pushed changes!');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error during auto-commit:', error.message);
            return false;
        }
    }

    generateCommitMessage(status) {
        const lines = status.trim().split('\n');
        const modified = [];
        const added = [];
        const deleted = [];
        
        lines.forEach(line => {
            const statusChar = line[0];
            const filePath = line.substring(3);
            
            if (this.shouldIgnore(filePath)) return;
            
            switch (statusChar) {
                case 'M':
                    modified.push(filePath);
                    break;
                case 'A':
                case '?':
                    added.push(filePath);
                    break;
                case 'D':
                    deleted.push(filePath);
                    break;
            }
        });

        let message = '';
        const timestamp = new Date().toLocaleString();
        
        if (added.length > 0 && modified.length === 0 && deleted.length === 0) {
            message = `Add ${added.length} file(s) - ${timestamp}`;
        } else if (modified.length > 0 && added.length === 0 && deleted.length === 0) {
            message = `Update ${modified.length} file(s) - ${timestamp}`;
        } else if (deleted.length > 0 && added.length === 0 && modified.length === 0) {
            message = `Remove ${deleted.length} file(s) - ${timestamp}`;
        } else {
            const total = added.length + modified.length + deleted.length;
            message = `Auto-commit: ${total} file(s) changed - ${timestamp}`;
        }
        
        return message;
    }

    startWatching() {
        console.log('👀 Starting auto-commit watcher...');
        console.log(`📁 Watching: ${this.projectPath}`);
        console.log('⏰ Checking for changes every 5 seconds...');
        console.log('Press Ctrl+C to stop\n');

        // Initial check
        this.checkForChanges();

        // Set up interval to check for changes
        this.interval = setInterval(async () => {
            const hasChanges = await this.checkForChanges();
        }, this.debounceTime);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            console.log('\n🛑 Auto-commit watcher stopped');
        }
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, stopping auto-commit watcher...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, stopping auto-commit watcher...');
    process.exit(0);
});

// Start the auto-commit watcher if this file is run directly
if (require.main === module) {
    const watcher = new AutoCommit();
    watcher.startWatching();
}

module.exports = AutoCommit;
