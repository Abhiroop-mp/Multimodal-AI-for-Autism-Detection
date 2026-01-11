const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Data storage (in production, use a proper database)
const DATA_DIR = path.join(__dirname, 'data');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');
const GAME_PROGRESS_FILE = path.join(DATA_DIR, 'game-progress.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Initialize data files
async function initializeDataFiles() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize patients file if it doesn't exist
        try {
            await fs.access(PATIENTS_FILE);
        } catch {
            await fs.writeFile(PATIENTS_FILE, JSON.stringify({}));
        }
        
        // Initialize game progress file if it doesn't exist
        try {
            await fs.access(GAME_PROGRESS_FILE);
        } catch {
            await fs.writeFile(GAME_PROGRESS_FILE, JSON.stringify({}));
        }
        
        // Initialize sessions file if it doesn't exist
        try {
            await fs.access(SESSIONS_FILE);
        } catch {
            await fs.writeFile(SESSIONS_FILE, JSON.stringify({}));
        }
    } catch (error) {
        console.error('Error initializing data files:', error);
    }
}

// Helper functions
async function readDataFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return {};
    }
}

async function writeDataFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
}

// Game catalog with all 32 games
const GAME_CATALOG = {
    toddlers: [
        { id: 'texture-play', name: 'Texture Play', icon: 'fa-hand', difficulty: 'Beginner', duration: '8-12 minutes', domain: 'Sensory Processing', skills: ['Tactile exploration', 'Sensory tolerance'] },
        { id: 'shape-sorting', name: 'Shape Sorting', icon: 'fa-shapes', difficulty: 'Beginner', duration: '10-15 minutes', domain: 'Cognitive Abilities', skills: ['Shape recognition', 'Problem solving'] },
        { id: 'routine-building', name: 'Routine Building', icon: 'fa-clock', difficulty: 'Beginner', duration: '10-15 minutes', domain: 'Behavioral Patterns', skills: ['Daily routines', 'Predictability'] },
        { id: 'peekaboo', name: 'Peek-a-Boo', icon: 'fa-eye', difficulty: 'Beginner', duration: '8-12 minutes', domain: 'Social Communication', skills: ['Object permanence', 'Social bonding'] },
        { id: 'calm-down', name: 'Calm Down Time', icon: 'fa-heart', difficulty: 'Beginner', duration: '5-8 minutes', domain: 'Behavioral Patterns', skills: ['Self-regulation', 'Emotional control'] },
        { id: 'sound-discovery', name: 'Sound Discovery', icon: 'fa-music', difficulty: 'Beginner', duration: '6-10 minutes', domain: 'Sensory Processing', skills: ['Auditory processing', 'Sound recognition'] },
        { id: 'color-matching', name: 'Color Matching', icon: 'fa-palette', difficulty: 'Beginner', duration: '8-12 minutes', domain: 'Cognitive Abilities', skills: ['Color recognition', 'Matching skills'] },
        { id: 'social-smiles', name: 'Social Smiles', icon: 'fa-smile', difficulty: 'Beginner', duration: '5-10 minutes', domain: 'Social Communication', skills: ['Social interaction', 'Facial recognition'] }
    ],
    children: [
        { id: 'memory-match', name: 'Memory Match', icon: 'fa-memory', difficulty: 'Intermediate', duration: '20-25 minutes', domain: 'Cognitive Abilities', skills: ['Working memory', 'Attention'] },
        { id: 'number-sense', name: 'Number Sense', icon: 'fa-calculator', difficulty: 'Intermediate', duration: '25-30 minutes', domain: 'Cognitive Abilities', skills: ['Mathematical thinking', 'Number recognition'] },
        { id: 'pattern-recognition', name: 'Pattern Recognition', icon: 'fa-brain', difficulty: 'Intermediate', duration: '25-30 minutes', domain: 'Cognitive Abilities', skills: ['Pattern analysis', 'Logical thinking'] },
        { id: 'problem-solving', name: 'Problem Solving', icon: 'fa-lightbulb', difficulty: 'Intermediate', duration: '25-30 minutes', domain: 'Cognitive Abilities', skills: ['Critical thinking', 'Analysis'] },
        { id: 'goal-setting', name: 'Goal Setting', icon: 'fa-target', difficulty: 'Intermediate', duration: '25-30 minutes', domain: 'Behavioral Patterns', skills: ['Planning', 'Executive function'] },
        { id: 'emotion-regulation', name: 'Emotion Regulation', icon: 'fa-brain', difficulty: 'Intermediate', duration: '20-25 minutes', domain: 'Behavioral Patterns', skills: ['Self-control', 'Emotional awareness'] },
        { id: 'story-sharing', name: 'Story Sharing', icon: 'fa-book', difficulty: 'Intermediate', duration: '15-20 minutes', domain: 'Social Communication', skills: ['Expressive language', 'Listening skills'] },
        { id: 'team-building', name: 'Team Building', icon: 'fa-users', difficulty: 'Intermediate', duration: '20-25 minutes', domain: 'Social Communication', skills: ['Cooperation', 'Communication'] }
    ],
    adolescents: [
        { id: 'social-skills-training', name: 'Social Skills Training', icon: 'fa-comments', difficulty: 'Advanced', duration: '30-35 minutes', domain: 'Social Communication', skills: ['Professional skills', 'Networking'] },
        { id: 'conversation-practice', name: 'Conversation Practice', icon: 'fa-comments', difficulty: 'Advanced', duration: '35-40 minutes', domain: 'Social Communication', skills: ['Social skills', 'Relationship management'] },
        { id: 'time-management', name: 'Time Management', icon: 'fa-clock', difficulty: 'Advanced', duration: '35-40 minutes', domain: 'Behavioral Patterns', skills: ['Organization skills', 'Planning'] },
        { id: 'decision-making', name: 'Decision Making', icon: 'fa-balance-scale', difficulty: 'Advanced', duration: '30-35 minutes', domain: 'Behavioral Patterns', skills: ['Decision making', 'Problem solving'] },
        { id: 'executive-function', name: 'Executive Function', icon: 'fa-brain', difficulty: 'Advanced', duration: '40-45 minutes', domain: 'Cognitive Abilities', skills: ['Strategic thinking', 'Cognitive control'] },
        { id: 'working-memory', name: 'Working Memory', icon: 'fa-brain', difficulty: 'Advanced', duration: '40-45 minutes', domain: 'Cognitive Abilities', skills: ['Memory techniques', 'Information processing'] },
        { id: 'cognitive-flexibility', name: 'Cognitive Flexibility', icon: 'fa-brain', difficulty: 'Advanced', duration: '45-50 minutes', domain: 'Cognitive Abilities', skills: ['Mental flexibility', 'Adaptive thinking'] },
        { id: 'attention-control', name: 'Attention Control', icon: 'fa-brain', difficulty: 'Advanced', duration: '40-45 minutes', domain: 'Cognitive Abilities', skills: ['Focus management', 'Concentration'] }
    ],
    adults: [
        { id: 'visual-processing', name: 'Visual Processing', icon: 'fa-eye', difficulty: 'Advanced', duration: '25-30 minutes', domain: 'Sensory Processing', skills: ['Visual analysis', 'Pattern recognition'] },
        { id: 'auditory-discrimination', name: 'Auditory Discrimination', icon: 'fa-music', difficulty: 'Advanced', duration: '25-30 minutes', domain: 'Sensory Processing', skills: ['Sound discrimination', 'Auditory processing'] },
        { id: 'spatial-awareness', name: 'Spatial Awareness', icon: 'fa-map', difficulty: 'Advanced', duration: '30-35 minutes', domain: 'Sensory Processing', skills: ['Spatial reasoning', 'Navigation'] },
        { id: 'sensory-integration', name: 'Sensory Integration', icon: 'fa-hand-sparkles', difficulty: 'Advanced', duration: '25-30 minutes', domain: 'Sensory Processing', skills: ['Multi-sensory integration', 'Body awareness'] },
        { id: 'pattern-recognition-adult', name: 'Advanced Pattern Recognition', icon: 'fa-brain', difficulty: 'Advanced', duration: '45-50 minutes', domain: 'Cognitive Abilities', skills: ['Complex pattern analysis', 'Abstract reasoning'] },
        { id: 'problem-solving-adult', name: 'Complex Problem Solving', icon: 'fa-lightbulb', difficulty: 'Advanced', duration: '50-60 minutes', domain: 'Cognitive Abilities', skills: ['Strategic thinking', 'Logical reasoning'] },
        { id: 'memory-match-adult', name: 'Sophisticated Memory Games', icon: 'fa-brain', difficulty: 'Advanced', duration: '40-45 minutes', domain: 'Cognitive Abilities', skills: ['Advanced memory techniques', 'Information retention'] }
    ]
};

// API Routes

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // For demo purposes, accept any email and create mock user data
        const mockUsers = {
            'emma@example.com': {
                id: 'patient-001',
                name: 'Emma Johnson',
                email: 'emma@example.com',
                userType: 'patient',
                age: 8,
                ageGroup: 'children'
            },
            'michael@example.com': {
                id: 'patient-002', 
                name: 'Michael Chen',
                email: 'michael@example.com',
                userType: 'patient',
                age: 14,
                ageGroup: 'adolescents'
            },
            'parent@example.com': {
                id: 'parent-001',
                name: 'Parent User',
                email: 'parent@example.com',
                userType: 'parent'
            }
        };
        
        // Check if email exists in mock users
        if (mockUsers[email]) {
            user = mockUsers[email];
        } else {
            // Create a new user for demo purposes
            // Determine user type based on email or request body
            const requestedUserType = req.body.userType || (email.includes('parent') ? 'parent' : 'patient');
            const userId = `${requestedUserType}-${Date.now()}`;
            user = {
                id: userId,
                name: email.split('@')[0],
                email: email,
                userType: requestedUserType,
                age: requestedUserType === 'parent' ? 35 : 8,
                ageGroup: requestedUserType === 'parent' ? 'adult' : 'children'
            };
            mockUsers[email] = user;
        }
        
        const token = 'mock-jwt-token-' + Date.now();
        
        res.json({
            success: true,
            token: token,
            user: mockUsers[email]
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const userData = req.body;
        
        // For demo purposes, just return success
        res.json({
            success: true,
            message: 'Registration successful',
            user: userData
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        // For demo purposes, just return success
        res.json({
            success: true,
            message: 'OTP sent successfully',
            otp: '123456' // For demo purposes
        });
        
    } catch (error) {
        console.error('OTP error:', error);
        res.status(500).json({ message: 'OTP failed' });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // For demo purposes, accept OTP '123456'
        if (otp === '123456') {
            const mockUsers = {
                [email]: {
                    id: 'patient-' + Date.now(),
                    name: email.split('@')[0],
                    email: email,
                    userType: 'patient',
                    age: 8,
                    ageGroup: 'children'
                }
            };
            
            const token = 'mock-jwt-token-' + Date.now();
            
            res.json({
                success: true,
                token: token,
                user: mockUsers[email]
            });
        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
        
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'OTP verification failed' });
    }
});

// Validate token endpoint
app.post('/api/auth/validate', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        // For demo purposes, accept any mock token
        if (token.startsWith('mock-jwt-token-')) {
            res.json({ 
                success: true, 
                message: 'Token is valid',
                user: {
                    id: 'parent-001',
                    name: 'Parent User',
                    email: 'parent@example.com',
                    userType: 'parent'
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid token' });
        }
        
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ message: 'Token validation failed' });
    }
});

// Get all patients
app.get('/api/patients', async (req, res) => {
    try {
        const patients = await readDataFile(PATIENTS_FILE);
        
        // Return patients as array
        const patientsArray = Object.keys(patients).map(patientId => ({
            patientId: patientId,
            ...patients[patientId]
        }));
        
        res.json(patientsArray);
        
    } catch (error) {
        console.error('Error getting patients:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get patients for a parent
app.get('/api/patient/parent-test/:parentId', async (req, res) => {
    try {
        const { parentId } = req.params;
        
        // For demo purposes, return mock patients for the parent
        const mockPatients = [
            {
                patientId: 'patient-001',
                name: 'Emma Johnson',
                email: 'emma@example.com',
                age: 8,
                ageGroup: 'children',
                parentId: parentId,
                assessment: {
                    domainScores: {
                        socialCommunication: 45,
                        behavioralPatterns: 60,
                        sensoryProcessing: 35,
                        cognitiveAbilities: 70
                    },
                    autismRiskScore: 55
                }
            },
            {
                patientId: 'patient-002',
                name: 'Michael Chen',
                email: 'michael@example.com',
                age: 14,
                ageGroup: 'adolescents',
                parentId: parentId,
                assessment: {
                    domainScores: {
                        socialCommunication: 30,
                        behavioralPatterns: 55,
                        sensoryProcessing: 40,
                        cognitiveAbilities: 65
                    },
                    autismRiskScore: 50
                }
            }
        ];
        
        res.json(mockPatients);
        
    } catch (error) {
        console.error('Error getting parent patients:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add patient endpoint
app.post('/api/patient/add', async (req, res) => {
    try {
        const patientData = req.body;
        
        // For demo purposes, just return success
        res.json({
            success: true,
            message: 'Patient added successfully',
            patientProfileId: 'patient-' + Date.now(),
            patient: patientData
        });
        
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload file endpoint
app.post('/api/patient/upload-gridfs', async (req, res) => {
    try {
        // For demo purposes, just return success
        res.json({
            success: true,
            message: 'File uploaded successfully'
        });
        
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get game recommendations for a patient
app.get('/api/game-recommendations/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const patients = await readDataFile(PATIENTS_FILE);
        const gameProgress = await readDataFile(GAME_PROGRESS_FILE);
        
        const patient = patients[patientId];
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        // Get patient's assessment and age group
        const assessment = patient.assessment || {};
        const ageGroup = patient.ageGroup || 'children';
        
        console.log('Patient data:', { patientId, ageGroup, assessment });
        
        // Get completed games for this patient
        const patientProgress = gameProgress[patientId] || {};
        const completedGames = Object.keys(patientProgress);
        
        // Get available games for age group
        const availableGames = GAME_CATALOG[ageGroup] || [];
        console.log('Available games:', availableGames.length, 'for age group:', ageGroup);
        
        // Filter out completed games and add progress info
        const recommendations = availableGames.map(game => {
            const progress = patientProgress[game.id];
            return {
                id: game.id,
                name: game.name,
                icon: game.icon,
                difficulty: game.difficulty,
                duration: game.duration,
                domain: game.domain,
                skills: game.skills,
                isCompleted: completedGames.includes(game.id),
                progress: progress || null,
                recommendationScore: calculateRecommendationScore(game, assessment, completedGames)
            };
        });
        
        // Sort by recommendation score (highest first)
        recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
        
        res.json({
            patientId,
            patientName: patient.name,
            ageGroup,
            assessment,
            recommendations,
            totalGames: availableGames.length,
            completedGames: completedGames.length
        });
        
    } catch (error) {
        console.error('Error getting game recommendations:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Save game progress
app.post('/api/game-progress', async (req, res) => {
    try {
        const { patientId, gameId, gameData } = req.body;
        
        if (!patientId || !gameId || !gameData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const gameProgress = await readDataFile(GAME_PROGRESS_FILE);
        
        if (!gameProgress[patientId]) {
            gameProgress[patientId] = {};
        }
        
        // Save game progress with timestamp
        gameProgress[patientId][gameId] = {
            ...gameData,
            completedAt: new Date().toISOString(),
            sessionId: generateSessionId()
        };
        
        await writeDataFile(GAME_PROGRESS_FILE, gameProgress);
        
        res.json({ 
            success: true, 
            message: 'Game progress saved successfully',
            patientId,
            gameId,
            totalCompleted: Object.keys(gameProgress[patientId]).length
        });
        
    } catch (error) {
        console.error('Error saving game progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get patient progress summary
app.get('/api/patient-progress/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const patients = await readDataFile(PATIENTS_FILE);
        const gameProgress = await readDataFile(GAME_PROGRESS_FILE);
        
        const patient = patients[patientId];
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const patientProgress = gameProgress[patientId] || {};
        const completedGames = Object.entries(patientProgress).map(([gameId, progress]) => ({
            gameId,
            score: progress.score || 0,
            completedAt: progress.completedAt || new Date().toISOString(),
            gameName: getGameName(gameId)
        }));
        
        // Simplified domain completion
        const domainCompletion = [
            { domain: 'Social Communication', totalGames: 2, completedGames: 0, completionPercentage: 0 },
            { domain: 'Behavioral Patterns', totalGames: 2, completedGames: 0, completionPercentage: 0 },
            { domain: 'Sensory Processing', totalGames: 2, completedGames: 0, completionPercentage: 0 },
            { domain: 'Cognitive Abilities', totalGames: 2, completedGames: 0, completionPercentage: 0 }
        ];
        
        res.json({
            patientId,
            patientName: patient.name,
            ageGroup: patient.ageGroup,
            totalGames: getTotalGamesForAgeGroup(patient.ageGroup),
            completedGames: completedGames.length,
            domainCompletion,
            recentActivity: completedGames.slice(0, 5),
            sessions: []
        });
        
    } catch (error) {
        console.error('Error getting patient progress:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Create or update patient session
app.post('/api/patient-session', async (req, res) => {
    try {
        const { patientId, sessionData } = req.body;
        
        if (!patientId || !sessionData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const sessions = await readDataFile(SESSIONS_FILE);
        
        if (!sessions[patientId]) {
            sessions[patientId] = [];
        }
        
        const sessionId = generateSessionId();
        const newSession = {
            id: sessionId,
            patientId,
            ...sessionData,
            startTime: new Date().toISOString(),
            status: 'active'
        };
        
        sessions[patientId].push(newSession);
        await writeDataFile(SESSIONS_FILE, sessions);
        
        res.json({ 
            success: true, 
            sessionId,
            message: 'Patient session created successfully'
        });
        
    } catch (error) {
        console.error('Error creating patient session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// End patient session
app.post('/api/patient-session/:sessionId/end', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const sessions = await readDataFile(SESSIONS_FILE);
        
        // Find and update the session
        let sessionFound = false;
        Object.keys(sessions).forEach(patientId => {
            sessions[patientId] = sessions[patientId].map(session => {
                if (session.id === sessionId) {
                    sessionFound = true;
                    return {
                        ...session,
                        endTime: new Date().toISOString(),
                        status: 'completed'
                    };
                }
                return session;
            });
        });
        
        if (!sessionFound) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await writeDataFile(SESSIONS_FILE, sessions);
        
        res.json({ 
            success: true, 
            message: 'Patient session ended successfully'
        });
        
    } catch (error) {
        console.error('Error ending patient session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all patients (for dashboard cards)
app.get('/api/patients', async (req, res) => {
    try {
        const patients = await readDataFile(PATIENTS_FILE);
        const gameProgress = await readDataFile(GAME_PROGRESS_FILE);
        const sessions = await readDataFile(SESSIONS_FILE);
        
        const patientsWithProgress = Object.entries(patients).map(([patientId, patient]) => {
            const patientProgress = gameProgress[patientId] || {};
            const patientSessions = sessions[patientId] || [];
            const activeSession = patientSessions.find(s => s.status === 'active');
            
            return {
                ...patient,
                patientId,
                gamesCompleted: Object.keys(patientProgress).length,
                hasActiveSession: !!activeSession,
                currentSession: activeSession || null,
                lastSession: patientSessions[patientSessions.length - 1] || null
            };
        });
        
        res.json(patientsWithProgress);
        
    } catch (error) {
        console.error('Error getting patients:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper functions
function calculateRecommendationScore(game, assessment, completedGames) {
    let score = 0;
    
    // Base score on domain priority
    const domainScores = {
        'Social Communication': assessment.domainScores?.socialCommunication || 0,
        'Behavioral Patterns': assessment.domainScores?.behavioralPatterns || 0,
        'Sensory Processing': assessment.domainScores?.sensoryProcessing || 0,
        'Cognitive Abilities': assessment.domainScores?.cognitiveAbilities || 0
    };
    
    // Add score based on domain match
    Object.entries(domainScores).forEach(([domain, score]) => {
        if (game.domain === domain) {
            score += score * 2; // Higher weight for matching domain
        }
    });
    
    // Subtract points if already completed
    if (completedGames.includes(game.id)) {
        score -= 50; // Penalize completed games
    }
    
    // Add variety bonus
    const uniqueDomains = [...new Set(completedGames.map(gameId => {
        const allGames = Object.values(GAME_CATALOG).flat();
        const game = allGames.find(g => g.id === gameId);
        return game ? game.domain : 'Unknown';
    }))];
    score += (uniqueDomains.length / 4) * 10; // Bonus for domain variety
    
    return Math.max(0, score);
}

function getDomainCompletion(gameProgress, ageGroup) {
    const domains = ['Social Communication', 'Behavioral Patterns', 'Sensory Processing', 'Cognitive Abilities'];
    const availableGames = GAME_CATALOG[ageGroup] || [];
    
    return domains.map(domain => {
        const domainGames = availableGames.filter(game => game.domain === domain);
        const completedInDomain = domainGames.filter(game => gameProgress[game.id]);
        
        return {
            domain,
            totalGames: domainGames.length,
            completedGames: completedInDomain.length,
            completionPercentage: domainGames.length > 0 ? (completedInDomain.length / domainGames.length) * 100 : 0,
            varietyBonus: calculateVarietyBonus(completedInDomain, domainGames)
        };
    });
}

function calculateVarietyBonus(completedGames, allDomainGames) {
    // completedGames are game objects from the domain, allDomainGames are the full game objects
    const uniqueDomains = [...new Set(allDomainGames.map(game => game.domain))];
    return (uniqueDomains.length / 4) * 10; // Bonus for domain variety
}

function getGameName(gameId) {
    const allGames = Object.values(GAME_CATALOG).flat();
    const game = allGames.find(g => g.id === gameId);
    return game ? game.name : gameId;
}

function getTotalGamesForAgeGroup(ageGroup) {
    return GAME_CATALOG[ageGroup]?.length || 0;
}

function generateSessionId() {
    return uuidv4();
}

function getRecentActivity(completedGames) {
    return Object.values(completedGames)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5)
        .map(game => ({
            gameId: game.gameId,
            gameName: getGameName(game.gameId),
            completedAt: game.completedAt,
            score: game.score || 0
        }));
}

function getPatientSessions(patientId) {
    // This would be implemented with actual session data
    return [];
}

// Start server
async function startServer() {
    await initializeDataFiles();
    
    app.listen(PORT, () => {
        console.log(`🚀 Game Recommendations API Server running on port ${PORT}`);
        console.log('📊 Available endpoints:');
        console.log('  GET  /api/patients - Get all patients with progress');
        console.log('  GET  /api/game-recommendations/:patientId - Get game recommendations for patient');
        console.log('  GET  /api/patient-progress/:patientId - Get patient progress summary');
        console.log('  POST /api/game-progress - Save game progress');
        console.log('  POST /api/patient-session - Create patient session');
        console.log('  POST /api/patient-session/:sessionId/end - End patient session');
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;
