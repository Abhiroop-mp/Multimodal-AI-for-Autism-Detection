/**
 * Parent Dashboard - Improved JavaScript
 * ASD Support Platform
 */

// Configuration and Constants
const CONFIG = {
    API_BASE_URL: 'http://localhost:5001/api',
    ENDPOINTS: {
        PATIENTS: '/patient/parent',
        ADD_PATIENT: '/patient/add',
        UPLOAD: '/patient/upload'
    },
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        USER_DATA: 'userData',
        LOGIN_TIME: 'loginTime'
    },
    FILE_TYPES: {
        IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        VIDEO: ['video/mp4', 'video/webm', 'video/ogg']
    },
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    DEBOUNCE_DELAY: 300
};

// Utility Functions
const Utils = {
    /**
     * Debounce function to limit API calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('toast--show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('toast--show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
};

// API Service
class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        if (response.status === 401 || response.status === 403) {
            AuthService.logout();
            throw new Error('Authentication failed');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || 'Request failed');
        }

        return response.json();
    }

    /**
     * Generic API request method
     */
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: this.getAuthHeaders(),
                ...options
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * Get patients for parent
     */
    async getPatients(parentId) {
        return this.request(`${CONFIG.ENDPOINTS.PATIENTS}/${parentId}`);
    }

    /**
     * Add new patient
     */
    async addPatient(patientData) {
        return this.request(CONFIG.ENDPOINTS.ADD_PATIENT, {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
    }

    /**
     * Upload files
     */
    async uploadFile(formData) {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        const response = await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.UPLOAD}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        return this.handleResponse(response);
    }
}

// Authentication Service
class AuthService {
    static checkAuthentication() {
        try {
            const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            const userData = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA) || '{}');

            if (!token || !userData.id) {
                console.log('No valid authentication found');
                this.redirectToLogin();
                return false;
            }

            if (userData.userType !== 'parent') {
                console.log('User is not a parent');
                window.location.replace('dashboard.html');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.redirectToLogin();
            return false;
        }
    }

    static logout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LOGIN_TIME);
        window.location.href = 'loginpage.html';
    }

    static redirectToLogin() {
        window.location.replace('loginpage.html');
    }

    static getUserData() {
        try {
            return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA) || '{}');
        } catch (error) {
            console.error('Failed to parse user data:', error);
            return {};
        }
    }
}

// File Upload Manager
class FileUploadManager {
    constructor() {
        this.uploadedFiles = [];
        this.maxFileSize = CONFIG.MAX_FILE_SIZE;
        this.allowedTypes = [...CONFIG.FILE_TYPES.IMAGE, ...CONFIG.FILE_TYPES.VIDEO];
    }

    /**
     * Validate file
     */
    validateFile(file) {
        const errors = [];

        if (file.size > this.maxFileSize) {
            errors.push(`File size exceeds ${Utils.formatFileSize(this.maxFileSize)}`);
        }

        if (!this.allowedTypes.includes(file.type)) {
            errors.push('File type not supported');
        }

        return errors;
    }

    /**
     * Handle file selection
     */
    handleFiles(files) {
        const previewContainer = document.getElementById('filePreview');
        if (!previewContainer) return;

        Array.from(files).forEach(file => {
            const errors = this.validateFile(file);
            
            if (errors.length > 0) {
                Utils.showToast(`${file.name}: ${errors.join(', ')}`, 'error');
                return;
            }

            this.addFileToPreview(file, previewContainer);
        });
    }

    /**
     * Add file to preview
     */
    addFileToPreview(file, container) {
        this.uploadedFiles.push(file);

        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item';
        previewItem.setAttribute('data-file-name', file.name);

        // Create preview element
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.alt = `Preview of ${file.name}`;
            previewItem.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.setAttribute('aria-label', `Preview of ${file.name}`);
            previewItem.appendChild(video);
        }

        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.setAttribute('aria-label', `Remove ${file.name}`);
        removeBtn.onclick = () => this.removeFile(file, previewItem);
        previewItem.appendChild(removeBtn);

        container.appendChild(previewItem);
    }

    /**
     * Remove file from preview
     */
    removeFile(file, element) {
        const index = this.uploadedFiles.indexOf(file);
        if (index > -1) {
            this.uploadedFiles.splice(index, 1);
        }
        
        // Revoke object URL to free memory
        const mediaElement = element.querySelector('img, video');
        if (mediaElement && mediaElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(mediaElement.src);
        }
        
        element.remove();
    }

    /**
     * Upload files with progress tracking
     */
    async uploadFiles(patientProfileId, apiService) {
        if (this.uploadedFiles.length === 0) return;

        const progressContainer = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        
        if (progressContainer && progressBar) {
            progressContainer.style.display = 'block';
        }

        const uploadPromises = this.uploadedFiles.map(async (file, index) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('patientProfileId', patientProfileId);
            formData.append('type', file.type.startsWith('image/') ? 'photo' : 'video');

            try {
                await apiService.uploadFile(formData);
                
                // Update progress
                if (progressBar) {
                    const progress = ((index + 1) / this.uploadedFiles.length) * 100;
                    progressBar.style.width = `${progress}%`;
                }
                
                return { success: true, file: file.name };
            } catch (error) {
                console.error(`Upload failed for ${file.name}:`, error);
                return { success: false, file: file.name, error: error.message };
            }
        });

        const results = await Promise.all(uploadPromises);
        
        // Hide progress after delay
        setTimeout(() => {
            if (progressContainer && progressBar) {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
            }
        }, 2000);

        // Show results
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            Utils.showToast(`${failed.length} files failed to upload`, 'error');
        } else {
            Utils.showToast('All files uploaded successfully', 'success');
        }

        return results;
    }

    /**
     * Clear all files
     */
    clearFiles() {
        // Revoke all object URLs
        this.uploadedFiles.forEach(file => {
            const previewItem = document.querySelector(`[data-file-name="${file.name}"]`);
            if (previewItem) {
                const mediaElement = previewItem.querySelector('img, video');
                if (mediaElement && mediaElement.src.startsWith('blob:')) {
                    URL.revokeObjectURL(mediaElement.src);
                }
            }
        });

        this.uploadedFiles = [];
        const previewContainer = document.getElementById('filePreview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
    }
}

// Survey Manager
class SurveyManager {
    constructor() {
        this.currentAgeGroup = null;
    }

    /**
     * Get age group based on age and unit
     */
    getAgeGroup(age, unit) {
        age = Number(age);
        
        if (!age || age <= 0) return null;

        if (unit === "months") {
            if (age < 36) return "toddler"; // < 3 years
            age = age / 12;
        }

        if (age >= 3 && age <= 12) return "child";
        if (age >= 13 && age <= 18) return "adolescent";
        return "adult";
    }

    /**
     * Load survey questions based on age group
     */
    loadSurveyQuestions(ageGroup) {
        if (!ageGroup || ageGroup === this.currentAgeGroup) return;
        
        this.currentAgeGroup = ageGroup;
        const container = document.getElementById("dynamic-survey");
        if (!container) return;

        const questionSets = {
            toddler: this.getToddlerQuestions(),
            child: this.getChildQuestions(),
            adolescent: this.getAdolescentQuestions(),
            adult: this.getAdultQuestions()
        };

        container.innerHTML = questionSets[ageGroup] || '';
    }

    /**
     * Get survey answers
     */
    getSurveyAnswers() {
        const answers = {
            ageGroup: this.currentAgeGroup,
            responses: {}
        };

        // Collect radio button answers
        const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
        radioButtons.forEach(radio => {
            answers.responses[radio.name] = radio.value;
        });

        // Add notes
        const notesElement = document.getElementById('surveyNotes');
        if (notesElement) {
            answers.notes = notesElement.value.trim();
        }

        return answers;
    }

    // Question sets would be defined here...
    getToddlerQuestions() {
        return `
            <div class="survey-section">
                <h3 class="survey-title">Toddler Assessment (1-3 years)</h3>
                <div class="survey-questions">
                    <div class="survey-question">
                        <p class="question-text"><strong>1. Does your child make eye contact when you speak to them?</strong></p>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="q1" value="always" required>
                                <span>Always</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="q1" value="sometimes" required>
                                <span>Sometimes</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="q1" value="rarely" required>
                                <span>Rarely</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="q1" value="never" required>
                                <span>Never</span>
                            </label>
                        </div>
                    </div>
                    <!-- Additional questions would follow the same pattern -->
                </div>
            </div>
        `;
    }

    getChildQuestions() {
        return `
            <div class="survey-section">
                <h3 class="survey-title">Child Assessment (4-11 years)</h3>
                <!-- Questions for child age group -->
            </div>
        `;
    }

    getAdolescentQuestions() {
        return `
            <div class="survey-section">
                <h3 class="survey-title">Adolescent Assessment (12-16 years)</h3>
                <!-- Questions for adolescent age group -->
            </div>
        `;
    }

    getAdultQuestions() {
        return `
            <div class="survey-section">
                <h3 class="survey-title">Adult Assessment (17+ years)</h3>
                <!-- Questions for adult age group -->
            </div>
        `;
    }
}

// Main Dashboard Class
class ParentDashboard {
    constructor() {
        this.apiService = new APIService();
        this.fileManager = new FileUploadManager();
        this.surveyManager = new SurveyManager();
        this.userData = null;
        this.patients = [];
    }

    /**
     * Initialize dashboard
     */
    async init() {
        try {
            // Check authentication
            if (!AuthService.checkAuthentication()) {
                return;
            }

            // Get user data
            this.userData = AuthService.getUserData();
            
            // Update UI with user data
            this.updateUserInterface();
            
            // Load patients
            await this.loadPatients();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            Utils.showToast('Failed to initialize dashboard', 'error');
        }
    }

    /**
     * Update user interface with user data
     */
    updateUserInterface() {
        const nameElements = document.querySelectorAll('#parent-name, #parent-name-header');
        nameElements.forEach(el => {
            el.textContent = Utils.sanitizeHTML(this.userData.name || 'Parent');
        });

        const emailElement = document.getElementById('parent-email');
        if (emailElement) {
            emailElement.textContent = Utils.sanitizeHTML(this.userData.email || '');
        }
    }

    /**
     * Load patients with error handling
     */
    async loadPatients() {
        try {
            const container = document.getElementById('patients-container');
            if (!container) return;

            // Show loading state
            container.innerHTML = '<div class="loading-placeholder">Loading patients...</div>';

            this.patients = await this.apiService.getPatients(this.userData.id);
            
            if (!this.patients || this.patients.length === 0) {
                container.innerHTML = this.getEmptyPatientsHTML();
                return;
            }

            container.innerHTML = this.patients.map(patient => this.getPatientCardHTML(patient)).join('');
            
        } catch (error) {
            console.error('Error loading patients:', error);
            const container = document.getElementById('patients-container');
            if (container) {
                container.innerHTML = '<div class="error-message">Failed to load patients. Please try again.</div>';
            }
            Utils.showToast('Failed to load patients', 'error');
        }
    }

    /**
     * Get HTML for empty patients state
     */
    getEmptyPatientsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-users empty-state__icon"></i>
                <h3 class="empty-state__title">No Patients Yet</h3>
                <p class="empty-state__description">Add a patient to start tracking progress</p>
                <button class="btn btn--primary" onclick="dashboard.openAddPatientModal()">
                    <i class="fas fa-plus"></i>
                    Add Your First Patient
                </button>
            </div>
        `;
    }

    /**
     * Get HTML for patient card
     */
    getPatientCardHTML(patient) {
        const isActive = patient.linkedUserId;
        const statusClass = isActive ? 'status--active' : 'status--pending';
        const statusText = isActive ? 'Active Patient' : 'Pending Registration';
        
        return `
            <div class="patient-card">
                <div class="patient-card__header">
                    <div class="patient-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="patient-info">
                        <h3 class="patient-name">${Utils.sanitizeHTML(patient.patientName)}</h3>
                        <p class="patient-email">${Utils.sanitizeHTML(patient.patientEmail)}</p>
                        <span class="patient-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="patient-card__body">
                    <div class="patient-stats">
                        <div class="patient-stat">
                            <div class="patient-stat__number">—</div>
                            <div class="patient-stat__label">Progress</div>
                        </div>
                        <div class="patient-stat">
                            <div class="patient-stat__number">—</div>
                            <div class="patient-stat__label">Sessions</div>
                        </div>
                    </div>
                </div>
                <div class="patient-card__footer">
                    ${isActive 
                        ? `<button class="btn btn--primary btn--full" onclick="dashboard.viewPatient('${patient.linkedUserId}')">
                             <i class="fas fa-chart-line"></i>
                             View Progress
                           </button>`
                        : `<button class="btn btn--secondary btn--full" disabled>
                             <i class="fas fa-clock"></i>
                             Waiting for Registration
                           </button>`
                    }
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File upload events
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.fileManager.handleFiles(e.target.files);
            });
        }

        // Age change event
        const ageInput = document.getElementById('patientAge');
        const ageUnitSelect = document.getElementById('ageUnit');
        
        if (ageInput && ageUnitSelect) {
            const updateSurvey = Utils.debounce(() => {
                const age = ageInput.value;
                const unit = ageUnitSelect.value;
                if (age && unit) {
                    const ageGroup = this.surveyManager.getAgeGroup(age, unit);
                    this.surveyManager.loadSurveyQuestions(ageGroup);
                }
            }, CONFIG.DEBOUNCE_DELAY);

            ageInput.addEventListener('input', updateSurvey);
            ageUnitSelect.addEventListener('change', updateSurvey);
        }

        // Form validation
        const form = document.getElementById('patientForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitPatientSurvey();
            });
        }
    }

    /**
     * Open add patient modal
     */
    openAddPatientModal() {
        const modal = document.getElementById('addPatientModal');
        if (modal) {
            modal.style.display = 'block';
            // Focus first input for accessibility
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * Close add patient modal
     */
    closeAddPatientModal() {
        const modal = document.getElementById('addPatientModal');
        if (modal) {
            modal.style.display = 'none';
            this.resetForm();
        }
    }

    /**
     * Reset form and clear files
     */
    resetForm() {
        const form = document.getElementById('patientForm');
        if (form) {
            form.reset();
        }
        
        this.fileManager.clearFiles();
        this.surveyManager.currentAgeGroup = null;
        
        const surveyContainer = document.getElementById('dynamic-survey');
        if (surveyContainer) {
            surveyContainer.innerHTML = '';
        }
    }

    /**
     * Submit patient survey with validation
     */
    async submitPatientSurvey() {
        try {
            // Get form data
            const formData = this.getFormData();
            
            // Validate form data
            const validation = this.validateFormData(formData);
            if (!validation.isValid) {
                Utils.showToast(validation.message, 'error');
                return;
            }

            // Show loading state
            const submitBtn = document.querySelector('[onclick="dashboard.submitPatientSurvey()"]');
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
            }

            // Submit patient data
            const result = await this.apiService.addPatient({
                patientName: formData.patientName,
                patientEmail: formData.patientEmail,
                age: formData.age,
                ageUnit: formData.ageUnit,
                surveyAnswers: this.surveyManager.getSurveyAnswers()
            });

            // Upload files if any
            if (this.fileManager.uploadedFiles.length > 0 && result.profile?._id) {
                await this.fileManager.uploadFiles(result.profile._id, this.apiService);
            }

            // Success
            Utils.showToast('Patient added successfully', 'success');
            this.closeAddPatientModal();
            await this.loadPatients(); // Refresh patient list

        } catch (error) {
            console.error('Submit patient error:', error);
            Utils.showToast(error.message || 'Failed to add patient', 'error');
        } finally {
            // Remove loading state
            const submitBtn = document.querySelector('[onclick="dashboard.submitPatientSurvey()"]');
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        return {
            patientName: document.getElementById('patientName')?.value.trim(),
            patientEmail: document.getElementById('patientEmail')?.value.trim(),
            age: document.getElementById('patientAge')?.value,
            ageUnit: document.getElementById('ageUnit')?.value
        };
    }

    /**
     * Validate form data
     */
    validateFormData(data) {
        if (!data.patientName) {
            return { isValid: false, message: 'Patient name is required' };
        }

        if (!data.patientEmail) {
            return { isValid: false, message: 'Patient email is required' };
        }

        if (!Utils.isValidEmail(data.patientEmail)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }

        if (!data.age || data.age <= 0) {
            return { isValid: false, message: 'Please enter a valid age' };
        }

        if (!data.ageUnit) {
            return { isValid: false, message: 'Please select age unit' };
        }

        return { isValid: true };
    }

    /**
     * View patient progress
     */
    viewPatient(patientId) {
        window.location.href = `patient-progress.html?patientId=${encodeURIComponent(patientId)}`;
    }

    /**
     * Logout user
     */
    logout() {
        AuthService.logout();
    }
}

// Accessibility Manager
class AccessibilityManager {
    constructor() {
        this.isHighContrast = false;
        this.isReducedMotion = false;
        this.fontSize = 100; // percentage
    }

    /**
     * Toggle accessibility menu
     */
    toggleMenu() {
        const menu = document.getElementById('accessibility-options');
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    /**
     * Toggle high contrast mode
     */
    toggleHighContrast() {
        this.isHighContrast = !this.isHighContrast;
        document.body.classList.toggle('high-contrast', this.isHighContrast);
        
        const btn = document.getElementById('high-contrast-btn');
        if (btn) {
            btn.classList.toggle('active', this.isHighContrast);
        }
        
        localStorage.setItem('accessibility-high-contrast', this.isHighContrast);
    }

    /**
     * Toggle reduced motion
     */
    toggleReducedMotion() {
        this.isReducedMotion = !this.isReducedMotion;
        document.body.classList.toggle('reduced-motion', this.isReducedMotion);
        
        const btn = document.getElementById('reduce-motions-btn');
        if (btn) {
            btn.classList.toggle('active', this.isReducedMotion);
        }
        
        localStorage.setItem('accessibility-reduced-motion', this.isReducedMotion);
    }

    /**
     * Increase font size
     */
    increaseFontSize() {
        if (this.fontSize < 150) {
            this.fontSize += 10;
            this.updateFontSize();
        }
    }

    /**
     * Decrease font size
     */
    decreaseFontSize() {
        if (this.fontSize > 80) {
            this.fontSize -= 10;
            this.updateFontSize();
        }
    }

    /**
     * Update font size
     */
    updateFontSize() {
        document.documentElement.style.fontSize = `${this.fontSize}%`;
        localStorage.setItem('accessibility-font-size', this.fontSize);
    }

    /**
     * Load saved accessibility preferences
     */
    loadPreferences() {
        // High contrast
        const highContrast = localStorage.getItem('accessibility-high-contrast') === 'true';
        if (highContrast) {
            this.toggleHighContrast();
        }

        // Reduced motion
        const reducedMotion = localStorage.getItem('accessibility-reduced-motion') === 'true';
        if (reducedMotion) {
            this.toggleReducedMotion();
        }

        // Font size
        const fontSize = localStorage.getItem('accessibility-font-size');
        if (fontSize) {
            this.fontSize = parseInt(fontSize);
            this.updateFontSize();
        }
    }
}

// Global instances
let dashboard;
let accessibilityManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        dashboard = new ParentDashboard();
        accessibilityManager = new AccessibilityManager();
        
        // Load accessibility preferences
        accessibilityManager.loadPreferences();
        
        // Initialize dashboard
        await dashboard.init();
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        Utils.showToast('Application failed to initialize', 'error');
    }
});

// Global functions for backward compatibility
function logout() {
    if (dashboard) {
        dashboard.logout();
    }
}

function viewPatient(patientId) {
    if (dashboard) {
        dashboard.viewPatient(patientId);
    }
}

function openAddPatientModal() {
    if (dashboard) {
        dashboard.openAddPatientModal();
    }
}

function closeAddPatientModal() {
    if (dashboard) {
        dashboard.closeAddPatientModal();
    }
}

function submitPatientSurvey() {
    if (dashboard) {
        dashboard.submitPatientSurvey();
    }
}

// Accessibility functions
function toggleAccessibilityMenu() {
    if (accessibilityManager) {
        accessibilityManager.toggleMenu();
    }
}

function toggleHighContrast() {
    if (accessibilityManager) {
        accessibilityManager.toggleHighContrast();
    }
}

function toggleReducedMotion() {
    if (accessibilityManager) {
        accessibilityManager.toggleReducedMotion();
    }
}

function increaseFontSize() {
    if (accessibilityManager) {
        accessibilityManager.increaseFontSize();
    }
}

function decreaseFontSize() {
    if (accessibilityManager) {
        accessibilityManager.decreaseFontSize();
    }
}

// Handle file upload events
function handleFileSelect(event) {
    if (dashboard && dashboard.fileManager) {
        dashboard.fileManager.handleFiles(event.target.files);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    document.querySelector('.file-upload-area')?.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    document.querySelector('.file-upload-area')?.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    document.querySelector('.file-upload-area')?.classList.remove('dragover');
    
    if (dashboard && dashboard.fileManager) {
        dashboard.fileManager.handleFiles(event.dataTransfer.files);
    }
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ParentDashboard,
        AuthService,
        APIService,
        Utils
    }
}