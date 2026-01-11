/* Parent Dashboard JS (extracted from parent-dashboard.html)
   - Adds basic client-side validation and sanitization
   - Uses HTTPS API endpoints when calling backend
   - Notes: Consider migrating tokens to HTTP-only cookies for improved security
*/

// Helper: escape HTML to mitigate reflected XSS when rendering user input client-side
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"'`=\/]/g, function (s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        })[s];
    });
}

function isValidEmail(email) {
    if (!email) return false;
    // simple but practical regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(value, maxLen = 200) {
    if (!value) return '';
    let s = String(value).trim();
    if (s.length > maxLen) s = s.substring(0, maxLen);
    return escapeHtml(s);
}

// Check authentication on page load
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    // Minimal local checks
    if (!token || !userData.id) {
        console.warn('No valid authentication found locally — redirecting.');
        window.location.replace('loginpage.html');
        return false;
    }

    // NOTE: local checks are not a substitute for server-side validation.
    // Try to validate token with server to reduce risk of client-side tampering
    validateTokenWithServer(token).then(valid => {
        if (!valid) {
            console.warn('Server validation failed — clearing local session and redirecting.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('loginTime');
            window.location.replace('loginpage.html');
        } else {
            console.log('Authentication validated with server for user:', userData.name);
        }
    }).catch(err => {
        // If validation endpoint is missing or network fails, we still allow the page to operate
        console.warn('Token validation endpoint not available or returned error:', err);
    });

    if (userData.userType !== 'parent') {
        console.warn('User is not a parent, redirecting to patient dashboard');
        window.location.replace('dashboard.html');
        return false;
    }

    return true;
}

async function validateTokenWithServer(token) {
    try {
        const resp = await fetch('http://localhost:5001/api/auth/validate', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return resp.ok;
    } catch (err) {
        // Network error or endpoint not present — propagate so caller can decide
        throw err;
    }
}

// Run authentication check
if (!checkAuthentication()) {
    throw new Error('Redirecting to login');
}

// Use up-to-date values (read when needed)
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Load patients
async function loadPatients() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const token = localStorage.getItem('authToken');

    console.log('loadPatients called with:', {
        userData: userData,
        userId: userData.id,
        token: token ? 'exists' : 'missing'
    });

    // Check if we have valid data
    if (!userData.id || !token) {
        console.error('Missing userData.id or token, cannot load patients');
        const container = document.getElementById('patients-container');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #ff6b6b;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Authentication Required</h3>
                    <p>Please log in again to view patients.</p>
                    <button onclick="window.location.href='loginpage.html'" style="background: #4361ee; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; margin-top: 1rem; cursor: pointer;">
                        <i class="fas fa-sign-in-alt"></i> Login Again
                    </button>
                </div>
            `;
        }
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/api/patient/parent/${encodeURIComponent(userData.id)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Patients API response status:', response.status);

        if (response.status === 401 || response.status === 403) {
            console.error('Authentication failed - logging out');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('loginTime');
            alert('Your session has expired. Please login again.');
            window.location.replace('loginpage.html');
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const patients = await response.json();
        console.log('Patients loaded:', patients);
        const container = document.getElementById('patients-container');

        if (!patients || patients.length === 0) {
            container.innerHTML = `\n        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-light);">\n          <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>\n          <h3>No Patients Yet</h3>\n          <p>Add a patient to start tracking progress</p>\n        </div>\n      `;
            return;
        }

        container.innerHTML = patients.map(patient => `
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="patient-info">
                        <h3>${escapeHtml(patient.patientName)}</h3>
                        <p>${escapeHtml(patient.patientEmail)}</p>
                        <span style="
                            font-size: 12px;
                            font-weight: 600;
                            color: ${patient.linkedUserId ? '#2e7d32' : '#ef6c00'};
                        ">
                            ${patient.linkedUserId ? 'Active Patient' : 'Pending Registration'}
                        </span>
                    </div>
                </div>

                <div class="patient-stats">
                    <div class="patient-stat">
                        <div class="patient-stat-number">—</div>
                        <div class="patient-stat-label">Progress</div>
                    </div>
                    <div class="patient-stat">
                        <div class="patient-stat-number">—</div>
                        <div class="patient-stat-label">Sessions</div>
                    </div>
                </div>

                ${patient._id
                    ? `<button onclick="viewPatient('${encodeURIComponent(patient._id)}')"
                             style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.5rem 1rem; border-radius: 8px; margin-top: 1rem; width: 100%; cursor: pointer;">
                             View Progress
                           </button>`
                    : `<button disabled
                             style="background: rgba(200,200,200,0.2); color: #ccc; border: 1px solid rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 8px; margin-top: 1rem; width: 100%;">
                             Waiting for Patient Registration
                           </button>`
                }
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading patients:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            userData: userData,
            hasToken: !!token,
            tokenLength: token ? token.length : 0
        });
        
        // Show user-friendly error message
        const container = document.getElementById('patients-container');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #ff6b6b;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Failed to Load Patients</h3>
                    <p>Error: ${error.message}</p>
                    <button onclick="loadPatients()" style="background: #4361ee; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; margin-top: 1rem; cursor: pointer;">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// Utility: determine age group (updated for 3 ARFF categories)
function getAgeGroup(age, unit) {
    age = Number(age);

    if (unit === 'months') {
        if (age < 48) return 'toddler'; // < 4 years (not in ARFF files)
        age = age / 12;
    }

    if (age >= 4 && age <= 11) return 'child';      // 4-11 years (Autism-Child-Data.arff)
    if (age >= 12 && age <= 16) return 'adolescent'; // 12-16 years (Autism-Adolescent-Data.arff)
    return 'adult';                                   // 18+ years (Autism-Adult-Data.arff)
}

// Load age-specific questionnaire based on ARFF datasets
function loadSurveyQuestions(ageGroup) {
    const container = document.getElementById('dynamic-survey');
    if (!container) return;
    
    if (ageGroup === 'child') {
        loadChildQuestionnaire(container);
    } else if (ageGroup === 'adolescent') {
        loadAdolescentQuestionnaire(container);
    } else if (ageGroup === 'adult') {
        loadAdultQuestionnaire(container);
    } else {
        loadToddlerQuestionnaire(container); // For < 4 years
    }
}

// Submit patient survey with enhanced data collection
async function submitPatientSurvey() {
    const rawName = document.getElementById('patientName')?.value || '';
    const rawEmail = document.getElementById('patientEmail')?.value || '';
    const rawNotes = document.getElementById('surveyNotes')?.value || '';
    const rawAge = document.getElementById('patientAge')?.value;
    const ageUnit = document.getElementById('ageUnit')?.value;

    const patientName = sanitizeInput(rawName, 100);
    const patientEmail = rawEmail.trim();
    const surveyNotes = sanitizeInput(rawNotes, 1000);
    const age = Number(rawAge);

    if (!patientName || !patientEmail || !rawAge || !ageUnit) {
        alert('Patient name, email, age and age unit are required');
        return;
    }

    if (!isValidEmail(patientEmail)) {
        alert('Please provide a valid email address');
        return;
    }

    if (!Number.isFinite(age) || age <= 0 || age > 1000) {
        alert('Please provide a valid age');
        return;
    }

    const ageGroup = getAgeGroup(age, ageUnit);

    // Collect A1-A10 behavioral questions
    const surveyAnswers = {};
    for (let i = 1; i <= 10; i++) {
        const questionKey = `A${i}_Score`;
        const selectedOption = document.querySelector(`input[name="${questionKey}"]:checked`);
        surveyAnswers[questionKey] = selectedOption ? selectedOption.value : null;
    }

    // Collect demographic information
    const genderSelected = document.querySelector('input[name="gender"]:checked');
    const ethnicitySelected = document.querySelector('select[name="ethnicity"]');
    const jaundiceSelected = document.querySelector('input[name="jundice"]:checked');
    const autismSelected = document.querySelector('input[name="austim"]:checked');
    const countrySelected = document.querySelector('select[name="contry_of_res"]');

    surveyAnswers.gender = genderSelected ? genderSelected.value : null;
    surveyAnswers.ethnicity = ethnicitySelected ? ethnicitySelected.value : null;
    surveyAnswers.jundice = jaundiceSelected ? jaundiceSelected.value : null;
    surveyAnswers.austim = autismSelected ? autismSelected.value : null;
    surveyAnswers.contry_of_res = countrySelected ? countrySelected.value : null;
    surveyAnswers.age = age;
    surveyAnswers.used_app_before = 'no'; // Default value
    surveyAnswers.result = 0; // Default screening result

    // Validate required questions
    const missingAnswers = [];
    for (let i = 1; i <= 10; i++) {
        if (surveyAnswers[`A${i}_Score`] === null) {
            missingAnswers.push(`A${i}`);
        }
    }

    if (!surveyAnswers.gender || !surveyAnswers.ethnicity || !surveyAnswers.jundice || !surveyAnswers.austim || !surveyAnswers.contry_of_res) {
        missingAnswers.push('demographic information');
    }

    if (missingAnswers.length > 0) {
        alert(`Please answer all required questions: ${missingAnswers.join(', ')}`);
        return;
    }

    try {
        console.log('Submitting patient data:', { patientName, patientEmail, age, ageUnit });
        console.log('Survey answers:', surveyAnswers);
        
        const response = await fetch('http://localhost:5001/api/patient/add', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                patientName,
                patientEmail,
                age,
                ageUnit,
                surveyAnswers
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        const result = await response.json();
        console.log('Response data:', result);

        if (!response.ok) {
            alert(`Error: ${result.message || 'Failed to add patient'} (Status: ${response.status})`);
            return;
        }

        alert('Patient added successfully with enhanced ASD screening');
        closeAddPatientModal();
        loadPatients(); // refresh list
    } catch (error) {
        console.error('Add patient error:', error);
        alert(`Something went wrong while adding patient: ${error.message}`);
    }
}

// OLD submitPatientSurvey function removed - now using the one with email validation in parent-dashboard.html
// This prevents duplicate emails and includes proper validation

// Minimal set of functions referenced inline in the HTML
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('loginTime');
    window.location.href = 'loginpage.html';
}

function viewPatient(patientId) {
    window.location.href = `patient-progress.html?patientId=${patientId}`;
}

function openAddPatientModal() {
    document.getElementById('addPatientModal').style.display = 'block';
}

function closeAddPatientModal() {
    document.getElementById('addPatientModal').style.display = 'none';
}

// Placeholder accessibility toggles (kept as simple wrappers so UI still works)
function toggleAccessibilityMenu() {
    document.getElementById('accessibility-options').classList.toggle('show');
}

function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
}

function toggleReadAloud() {
    alert('Read Aloud not implemented in this demo.');
}

function reduceAnimations() {
    document.body.classList.add('reduced-motion');
}

function increaseFontSize() {
    document.body.style.fontSize = (parseFloat(getComputedStyle(document.body).fontSize) + 1) + 'px';
}

function decreaseFontSize() {
    document.body.style.fontSize = (parseFloat(getComputedStyle(document.body).fontSize) - 1) + 'px';
}

// Initialize page data
document.addEventListener('DOMContentLoaded', () => {
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        document.querySelectorAll('#parent-name, #parent-name-header').forEach(el => {
            el.textContent = userData.name || 'Parent';
        });
        document.getElementById('parent-email').textContent = userData.email || '';
    } catch (err) {
        console.warn('Could not populate user data:', err);
    }

    // Important security note for developers
    console.warn('Consider migrating authentication tokens to HTTP-only cookies to reduce XSS risk. Ensure server-side authorization checks are enforced for all sensitive endpoints.');

    // Load patients after DOM is ready
    loadPatients();
});