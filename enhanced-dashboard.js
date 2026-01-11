// Enhanced Dashboard with Backend Integration
// Handles game recommendations, patient progress, and session management

class DashboardManager {
    constructor() {
        this.currentPatient = null;
        this.patients = [];
        this.gameRecommendations = [];
        this.patientProgress = {};
        this.isLoading = false;
        this.apiBaseUrl = 'http://localhost:5001/api';
    }

    // Initialize dashboard
    async init() {
        console.log('🚀 Initializing Enhanced Dashboard...');
        
        // Load current user from localStorage using new auth system
        const token = localStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (token && userData.id && userData.userType === 'patient') {
            // Use userData.id as patientId (MongoDB uses _id field)
            await this.loadPatientData(userData.id);
        } else {
            console.error('No valid user authentication found');
            window.location.href = 'loginpage.html';
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        console.log('✅ Dashboard initialized successfully');
    }

    // Load patient data from backend
    async loadPatientData(patientId) {
        try {
            this.isLoading = true;
            this.showLoading();
            
            // Load patient data from API
            const patientsResponse = await fetch(`${this.apiBaseUrl}/patients`);
            const patients = await patientsResponse.json();
            const patient = patients.find(p => p.patientId === patientId);
            
            if (patient) {
                this.currentPatient = {
                    patientId: patient.patientId,
                    name: patient.name,
                    ageGroup: patient.ageGroup,
                    assessment: patient.assessment,
                    hasActiveSession: false,
                    currentSession: null
                };
                
                // Load game recommendations
                const recommendationsResponse = await fetch(`${this.apiBaseUrl}/game-recommendations/${patientId}`);
                const recommendationsData = await recommendationsResponse.json();
                this.gameRecommendations = recommendationsData;
                
                // Load patient progress
                const progressResponse = await fetch(`${this.apiBaseUrl}/patient-progress/${patientId}`);
                const progressData = await progressResponse.json();
                this.patientProgress = progressData;
                
                this.updatePatientDisplay();
                this.renderGameRecommendations();
                this.renderProgressSection();
                
                // Show patient summary section
                const patientSummary = document.getElementById('patient-summary');
                if (patientSummary) {
                    patientSummary.style.display = 'block';
                }
            }
            
        } catch (error) {
            console.error('Error loading patient data:', error);
            this.showError('Failed to load patient data');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Game card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.game-card')) {
                this.handleGameCardClick(e.target.closest('.game-card'));
            }
        });

        // Session management
        document.addEventListener('click', (e) => {
            if (e.target.closest('.start-session-btn')) {
                this.startPatientSession();
            }
            if (e.target.closest('.end-session-btn')) {
                this.endPatientSession();
            }
        });

        // Refresh button
        document.addEventListener('click', (e) => {
            if (e.target.closest('.refresh-btn')) {
                this.refreshData();
            }
        });
    }

    // Handle game card click
    async handleGameCardClick(gameCard) {
        const gameId = gameCard.dataset.gameId;
        const gameUrl = `../games/${gameId}.html`;
        
        try {
            // Create session before redirecting to game
            await this.createGameSession(gameId);
            
            // Redirect to game
            window.location.href = gameUrl;
            
        } catch (error) {
            console.error('Error starting game session:', error);
            // Still redirect to game even if session creation fails
            window.location.href = gameUrl;
        }
    }

    // Create game session
    async createGameSession(gameId) {
        if (!this.currentPatient) return;
        
        try {
            const sessionData = {
                gameId: gameId,
                gameName: this.getGameName(gameId),
                startTime: new Date().toISOString(),
                device: this.getDeviceInfo(),
                environment: 'web'
            };
            
            const response = await fetch(`${this.apiBaseUrl}/patient-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: this.currentPatient.patientId,
                    sessionData
                })
            });
            
            const result = await response.json();
            console.log('Game session created:', result);
            
        } catch (error) {
            console.error('Error creating game session:', error);
        }
    }

    // Start patient session
    async startPatientSession() {
        if (!this.currentPatient) return;
        
        try {
            const sessionData = {
                sessionType: 'therapy',
                therapist: this.currentPatient.therapist || 'auto',
                goals: this.currentPatient.goals || [],
                notes: ''
            };
            
            const response = await fetch(`${this.apiBaseUrl}/patient-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: this.currentPatient.patientId,
                    sessionData
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.currentPatient.hasActiveSession = true;
                this.currentPatient.currentSession = result.sessionId;
                this.updatePatientDisplay();
                this.showSuccess('Therapy session started successfully');
            }
            
        } catch (error) {
            console.error('Error starting session:', error);
            this.showError('Failed to start session');
        }
    }

    // End patient session
    async endPatientSession() {
        if (!this.currentPatient?.currentSession) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/patient-session/${this.currentPatient.currentSession}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            if (result.success) {
                this.currentPatient.hasActiveSession = false;
                this.currentPatient.currentSession = null;
                this.updatePatientDisplay();
                this.showSuccess('Session ended successfully');
            }
            
        } catch (error) {
            console.error('Error ending session:', error);
            this.showError('Failed to end session');
        }
    }

    // Update patient display
    updatePatientDisplay() {
        // Update user info
        const userName = document.getElementById('user-name');
        const displayName = document.getElementById('user-display-name');
        const welcomeMessage = document.getElementById('welcome-message');
        
        if (this.currentPatient) {
            userName.textContent = this.currentPatient.name;
            displayName.textContent = this.currentPatient.name;
            welcomeMessage.textContent = `Welcome back, ${this.currentPatient.name}! Ready for today's therapy session?`;
            
            // Update user avatar with session status
            const userAvatar = document.getElementById('user-avatar');
            if (this.currentPatient.hasActiveSession) {
                userAvatar.innerHTML = '<i class="fas fa-play"></i>';
                userAvatar.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            } else {
                userAvatar.innerHTML = '<i class="fas fa-user"></i>';
                userAvatar.style.background = 'linear-gradient(135deg, #3498db, #e74c3c)';
            }
        }
    }

    // Render game recommendations
    renderGameRecommendations() {
        const container = document.getElementById('ml-games-container');
        const loadingElement = document.getElementById('ml-games-loading');
        const noGamesElement = document.getElementById('no-ml-games');
        
        if (!container) return;
        
        // Hide loading and no games messages
        if (loadingElement) loadingElement.style.display = 'none';
        if (noGamesElement) noGamesElement.style.display = 'none';
        
        // Show container
        container.style.display = 'grid';
        container.innerHTML = '';
        
        if (!this.gameRecommendations.recommendations || this.gameRecommendations.recommendations.length === 0) {
            container.style.display = 'none';
            if (noGamesElement) {
                noGamesElement.style.display = 'block';
            }
            return;
        }
        
        // Render game cards
        this.gameRecommendations.recommendations.forEach((game, index) => {
            const gameCard = this.createGameCard(game, index);
            container.appendChild(gameCard);
        });
    }

    // Create game card element
    createGameCard(game, index) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.gameId = game.id;
        
        // Determine priority class (using recommendation score as priority)
        const priorityScore = game.recommendationScore || 0;
        const priority = Math.min(4, Math.max(1, Math.floor(priorityScore / 25)));
        const priorityClass = priority <= 2 ? 'priority-1' : priority <= 3 ? 'priority-2' : '';
        
        // Create completion status
        const completionStatus = game.isCompleted ? 'Completed' : 'Available';
        const completionClass = game.isCompleted ? 'completed' : '';
        
        card.innerHTML = `
            <div class="priority-indicator ${priorityClass}" data-priority="${priority}">
                ${priority}
            </div>
            <div class="priority-tooltip">
                Priority ${priority}: ${this.getPriorityDescription(priority)}
            </div>
            <div class="game-icon">
                <i class="fas ${game.icon}"></i>
            </div>
            <div class="game-content">
                <h3 class="game-title">${game.name}</h3>
                <p class="game-description">${game.description}</p>
                <div class="game-meta">
                    <span class="difficulty ${game.difficulty.toLowerCase()}">${game.difficulty}</span>
                    <span class="recommended-time">${game.duration}</span>
                    <span class="completion-status ${completionClass}">${completionStatus}</span>
                </div>
                <div class="skills-tags">
                    ${game.skills.map(skill => `<span class="skill-tag game">${skill}</span>`).join('')}
                </div>
                ${game.progress ? this.renderProgressBadge(game.progress) : ''}
                <button class="btn btn-primary play-game-btn" onclick="dashboardManager.playGame('${game.id}')">
                    <i class="fas fa-play"></i> ${game.isCompleted ? 'Play Again' : 'Start Game'}
                </button>
            </div>
        `;
        
        // Add hover effects
        card.addEventListener('mouseenter', () => {
            if (game.progress) {
                this.showGameProgress(game);
            }
        });
        
        card.addEventListener('mouseleave', () => {
            this.hideGameProgress();
        });
        
        return card;
    }

    // Render progress badge
    renderProgressBadge(progress) {
        if (!progress || !progress.score) return '';
        
        const percentage = Math.min(100, Math.round((progress.score / (progress.targetScore || 100)) * 100));
        const performanceLevel = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Needs Improvement';
        
        return `
            <div class="confidence-badge">
                <i class="fas fa-trophy"></i>
                <span>${performanceLevel}: ${percentage}%</span>
            </div>
        `;
    }

    // Render progress section
    renderProgressSection() {
        const progressSection = document.querySelector('.patient-summary');
        if (!progressSection || !this.patientProgress) return;
        
        // Show progress section
        progressSection.style.display = 'block';
        
        const summaryGrid = progressSection.querySelector('.summary-grid');
        if (!summaryGrid) return;
        
        // Update summary items
        const summaryItems = [
            {
                label: 'Total Games',
                value: this.patientProgress.totalGames || 0,
                icon: 'fa-gamepad'
            },
            {
                label: 'Games Completed',
                value: this.patientProgress.completedGames || 0,
                icon: 'fa-check-circle'
            },
            {
                label: 'Completion Rate',
                value: `${this.patientProgress.totalGames > 0 ? Math.round((this.patientProgress.completedGames / this.patientProgress.totalGames) * 100) : 0}%`,
                icon: 'fa-percentage'
            }
        ];
        
        summaryGrid.innerHTML = summaryItems.map(item => `
            <div class="summary-item">
                <div class="summary-label">${item.label}</div>
                <div class="summary-value">
                    <i class="fas ${item.icon}"></i>
                    ${item.value}
                </div>
            </div>
        `).join('');
        
        // Update session status
        const sessionStatus = document.getElementById('current-session-status');
        const startBtn = document.getElementById('start-session-btn');
        const endBtn = document.getElementById('end-session-btn');
        
        if (sessionStatus && startBtn && endBtn) {
            if (this.currentPatient?.hasActiveSession) {
                sessionStatus.textContent = 'Active';
                startBtn.style.display = 'none';
                endBtn.style.display = 'inline-flex';
            } else {
                sessionStatus.textContent = 'None';
                startBtn.style.display = 'inline-flex';
                endBtn.style.display = 'none';
            }
        }
        
        // Render domain completion
        this.renderDomainCompletion();
        
        // Render recent activity
        this.renderRecentActivity();
    }

    // Render domain completion
    renderDomainCompletion() {
        const domainContainer = document.querySelector('.domain-scores');
        if (!domainContainer || !this.patientProgress.domainCompletion) return;
        
        const domains = this.patientProgress.domainCompletion || [];
        
        domainContainer.innerHTML = domains.map(domain => `
            <div class="domain-score">
                <h4>${domain.domain}</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${domain.completionPercentage}%"></div>
                </div>
                <strong>${domain.completedGames}/${domain.totalGames}</strong>
            </div>
        `).join('');
    }

    // Render recent activity
    renderRecentActivity() {
        const activityContainer = document.querySelector('.recent-activity');
        if (!activityContainer) return;
        
        const recentGames = this.patientProgress.recentActivity || [];
        
        if (recentGames.length === 0) {
            activityContainer.innerHTML = '<p style="text-align: center; color: #718096;">No recent activity</p>';
            return;
        }
        
        activityContainer.innerHTML = recentGames.map(game => `
            <div class="activity-item">
                <div class="activity-header">
                    <strong>${game.gameName}</strong>
                    <small>${new Date(game.completedAt).toLocaleDateString()}</small>
                </div>
                <div class="activity-details">
                    Score: ${game.score} | Duration: ${game.duration || 'N/A'}
                </div>
            </div>
        `).join('');
    }

    // Show/hide loading states
    showLoading() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => el.style.display = 'block');
    }

    hideLoading() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => el.style.display = 'none');
    }

    // Show notifications
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Helper functions
    getGameName(gameId) {
        const allGames = Object.values(GAME_CATALOG).flat();
        const game = allGames.find(g => g.id === gameId);
        return game ? game.name : gameId;
    }

    getPriorityDescription(priority) {
        const descriptions = {
            1: 'Highest Priority - Critical for development',
            2: 'High Priority - Very Important',
            3: 'Medium Priority - Important',
            4: 'Low Priority - Beneficial'
        };
        return descriptions[priority] || 'Unknown Priority';
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString()
        };
    }

    // Refresh data from backend
    async refreshData() {
        if (this.currentPatient) {
            await this.loadPatientData(this.currentPatient.patientId);
            this.showSuccess('Data refreshed successfully');
        }
    }

    // Start periodic updates
    startPeriodicUpdates() {
        // Update every 30 seconds
        setInterval(async () => {
            if (this.currentPatient && !this.isLoading) {
                await this.loadPatientData(this.currentPatient.patientId);
            }
        }, 30000);
    }

    // Play game (redirect to game)
    playGame(gameId) {
        const gameUrl = `../games/${gameId}.html`;
        window.open(gameUrl, '_blank');
    }

    // Show game progress tooltip
    showGameProgress(game) {
        // Implementation for showing detailed progress on hover
        console.log('Showing progress for game:', game);
    }

    hideGameProgress() {
        // Hide progress tooltip
        console.log('Hiding game progress');
    }
}

// Global instance
window.dashboardManager = new DashboardManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager.init();
});

// Export for use in HTML
window.getPersonalizedGames = function(userId, assessment, ageGroup) {
    return window.dashboardManager.gameRecommendations.recommendations || [];
};
