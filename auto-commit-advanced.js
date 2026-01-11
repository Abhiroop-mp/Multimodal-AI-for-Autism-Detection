#!/usr/bin/env node

const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');

class AdvancedAutoCommit {
    constructor(projectPath = '.') {
        this.projectPath = path.resolve(projectPath);
        this.debounceTime = 3000; // 3 seconds debounce
        this.timeoutId = null;
        this.isCommitting = false;
        
        // Files and directories to ignore
        this.ignoredPaths = [
            'node_modules/**',
            '**/__pycache__/**',
            '**/*.pyc',
            '.git/**',
            '**/*.log',
            '.env',
            'dist/**',
            'build/**',
            '.DS_Store',
            'auto-commit*.js',
            'auto-commit-package.json'
        ];
    }

    async commitChanges() {
        if (this.isCommitting) {
            console.log('⏳ Commit already in progress, skipping...');
            return;
        }

        this.isCommitting = true;

        try {
            // Check if there are any changes
            const status = execSync('git status --porcelain', { 
                cwd: this.projectPath,
                encoding: 'utf8'
            });

            if (!status.trim()) {
                console.log('✅ No changes to commit');
                this.isCommitting = false;
                return;
            }

            console.log('📝 Changes detected, preparing commit...');
            
            // Add all changes
            execSync('git add .', { cwd: this.projectPath });
            
            // Create commit message
            const commitMessage = this.generateCommitMessage(status);
            
            // Commit changes
            execSync(`git commit -m "${commitMessage}"`, { 
                cwd: this.projectPath,
                stdio: 'pipe'
            });
            
            // Push to GitHub
            console.log('🚀 Pushing to GitHub...');
            execSync('git push origin main', { 
                cwd: this.projectPath,
                stdio: 'pipe'
            });
            
            console.log(`✅ Successfully committed: ${commitMessage}`);
            
        } catch (error) {
            if (error.message.includes('nothing to commit')) {
                console.log('✅ No changes to commit');
            } else if (error.message.includes('Everything up-to-date')) {
                console.log('✅ Everything is up to date');
            } else {
                console.error('❌ Error during auto-commit:', error.message);
            }
        } finally {
            this.isCommitting = false;
        }
    }

    generateCommitMessage(status) {
        const lines = status.trim().split('\n');
        const changes = {
            modified: [],
            added: [],
            deleted: [],
            renamed: []
        };
        
        lines.forEach(line => {
            const statusCode = line.substring(0, 2);
            const filePath = line.substring(3);
            
            // Skip ignored files
            if (this.ignoredPaths.some(pattern => filePath.includes(pattern.replace('**/', '')))) {
                return;
            }
            
            switch (statusCode) {
                case ' M':
                case ' M':
                    changes.modified.push(filePath);
                    break;
                case 'A ':
                case '??':
                    changes.added.push(filePath);
                    break;
                case 'D ':
                    changes.deleted.push(filePath);
                    break;
                case 'R ':
                    changes.renamed.push(filePath);
                    break;
            }
        });

        const timestamp = new Date().toLocaleString();
        let message = '';
        
        // Generate smart commit messages
        if (changes.added.length === 1 && changes.modified.length === 0 && changes.deleted.length === 0) {
            const file = changes.added[0];
            const ext = path.extname(file);
            if (ext === '.html') message = `Add page: ${path.basename(file)}`;
            else if (ext === '.js') message = `Add script: ${path.basename(file)}`;
            else if (ext === '.py') message = `Add module: ${path.basename(file)}`;
            else message = `Add file: ${path.basename(file)}`;
        } else if (changes.modified.length === 1 && changes.added.length === 0 && changes.deleted.length === 0) {
            const file = changes.modified[0];
            const ext = path.extname(file);
            if (ext === '.html') message = `Update page: ${path.basename(file)}`;
            else if (ext === '.js') message = `Update script: ${path.basename(file)}`;
            else if (ext === '.py') message = `Update module: ${path.basename(file)}`;
            else message = `Update file: ${path.basename(file)}`;
        } else if (changes.deleted.length > 0 && changes.added.length === 0 && changes.modified.length === 0) {
            message = `Remove ${changes.deleted.length} file(s)`;
        } else {
            const total = changes.added.length + changes.modified.length + changes.deleted.length;
            message = `Auto-commit: ${total} file(s) changed`;
        }
        
        return `${message} - ${timestamp}`;
    }

    startWatching() {
        console.log('👀 Starting advanced auto-commit watcher...');
        console.log(`📁 Watching: ${this.projectPath}`);
        console.log('⚡ Real-time file watching enabled');
        console.log('Press Ctrl+C to stop\n');

        // Set up file watcher
        const watcher = chokidar.watch('.', {
            cwd: this.projectPath,
            ignored: this.ignoredPaths,
            persistent: true,
            ignoreInitial: true
        });

        // Watch for changes
        watcher.on('all', (event, filePath) => {
            console.log(`📄 ${event}: ${filePath}`);
            
            // Debounce commits
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            
            this.timeoutId = setTimeout(() => {
                this.commitChanges();
            }, this.debounceTime);
        });

        // Initial commit check
        setTimeout(() => {
            this.commitChanges();
        }, 1000);

        // Handle watcher errors
        watcher.on('error', error => {
            console.error('❌ Watcher error:', error);
        });

        return watcher;
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
    const watcher = new AdvancedAutoCommit();
    watcher.startWatching();
}

module.exports = AdvancedAutoCommit;
