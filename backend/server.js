require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Force port to 5001 regardless of .env
process.env.PORT = '5001';

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from main project directory
app.use(express.static(path.join(__dirname, '..')));

// =====================
// Middleware
// =====================
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// =====================
// MongoDB
// =====================
mongoose
  .connect('mongodb://localhost:27017/asd-detection')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// =====================
// Routes
// =====================
console.log('Loading routes...');

// ✅ ADD PATIENT ROUTES HERE
try {
  console.log('=== LOADING PATIENT ROUTES ===');
  const patientRoutes = require('./routes/patient-fixed');
  console.log('Patient routes required:', typeof patientRoutes);
  console.log('Patient routes routes:', patientRoutes && typeof patientRoutes.stack === 'function' ? Object.keys(patientRoutes.stack || {}) : 'undefined');
  
  app.use('/api/patient', (req, res, next) => {
    console.log('=== PATIENT ROUTE MIDDLEWARE CALLED ===');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    next();
  }, patientRoutes);
  console.log('✅ Patient routes loaded successfully');
} catch (error) {
  console.log('❌ Error loading patient routes:', error.message);
}

try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.log('❌ Error loading auth routes:', error.message);
}

try {
  const relationshipRoutes = require('./routes/relationships');
  app.use('/api/relationships', relationshipRoutes);
  console.log('✅ Relationship routes loaded successfully');
} catch (error) {
  console.log('❌ Error loading relationship routes:', error.message);
}

// =====================
// Test route
// =====================
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Test patient routes directly
app.get('/api/patient/test-direct', (req, res) => {
  console.log('=== DIRECT PATIENT ROUTE CALLED ===');
  res.json({ message: 'Direct patient route works!' });
});

// Add cleanup route directly to server
app.post('/api/patient/cleanup-duplicates', (req, res) => {
  console.log('=== DIRECT CLEANUP ROUTE CALLED ===');
  console.log('Request path:', req.path);
  console.log('Request originalUrl:', req.originalUrl);
  res.json({ message: 'Direct cleanup route works!', totalRemoved: 0 });
});

// Add check-email route directly to server
app.get('/api/check-email-simple', async (req, res) => {
    try {
        console.log('=== SIMPLE EMAIL CHECK ROUTE CALLED ===');
        console.log('Request path:', req.path);
        console.log('Request originalUrl:', req.originalUrl);
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                message: 'Email parameter is required'
            });
        }

        const existingPatient = await PatientProfile.findOne({ 
            patientEmail: email.toLowerCase().trim() 
        });

        res.json({
            exists: !!existingPatient,
            message: existingPatient ? 'Email already exists' : 'Email is available'
        });

    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({
            message: 'Failed to check email availability',
            error: error.message
        });
    }
});

// Add check-email route directly to server
app.get('/api/patient/check-email', (req, res) => {
  console.log('=== DIRECT CHECK EMAIL ROUTE CALLED ===');
  console.log('Request path:', req.path);
  console.log('Request originalUrl:', req.originalUrl);
  res.json({ exists: false, message: 'Email is available (direct)' });
});

// Debug route to check existing users
app.get('/api/debug/users', async (req, res) => {
    try {
        const User = require('./models/User');
        const users = await User.find({}).select('id name email userType createdAt').lean();
        console.log('=== DEBUG USERS ROUTE CALLED ===');
        console.log('Total users found:', users.length);
        
        res.json({
            totalUsers: users.length,
            users: users.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                userType: u.userType,
                createdAt: u.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Debug route to check existing patients
app.get('/api/debug/patients', async (req, res) => {
    try {
        const PatientProfile = require('./models/PatientProfile');
        const patients = await PatientProfile.find({}).select('patientName parentId createdAt').lean();
        console.log('=== DEBUG PATIENTS ROUTE CALLED ===');
        console.log('Total patients found:', patients.length);
        
        res.json({
            totalPatients: patients.length,
            patients: patients.map(p => ({
                id: p._id,
                patientName: p.patientName,
                parentId: p.parentId,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Failed to fetch patients', error: error.message });
    }
});

// Patients endpoint for enhanced dashboard
app.get('/api/patients', async (req, res) => {
    try {
        console.log('Patient ID:', req.params.patientId);
        
        const PatientProfile = require('./models/PatientProfile');
        const AssessmentResult = require('./models/AssessmentResult');
        
        // Find patient by ID
        const patient = await PatientProfile.findById(req.params.patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        console.log('Patient found:', patient.patientName);
        
        // Get patient's latest assessment
        const latestAssessment = await AssessmentResult.findOne({ patientProfileId: patient._id })
            .sort({ assessmentDate: -1 })
            .lean();
        
        console.log('Calling generatePersonalizedRecommendations with assessment:', latestAssessment);
        const recommendations = generatePersonalizedRecommendations(patient, latestAssessment);
        
        console.log('Generated recommendations:', recommendations.length);
        
        res.json(recommendations);
    } catch (error) {
        console.error('Error generating game recommendations:', error);
        res.status(500).json({ message: 'Failed to generate recommendations', error: error.message });
    }
});

// Helper function to generate personalized game recommendations
function generatePersonalizedRecommendations(patient, assessment) {
    const { gamesDataset, getPersonalizedGames } = require('../games-dataset');
    const patientAge = patient.age || 0;
    const ageUnit = patient.ageUnit || 'years';
    const ageInYears = ageUnit === 'months' ? patientAge / 12 : patientAge;
    
    // Get assessment scores if available
    const domainScores = assessment?.domainScores || {};
    const autismRiskScore = assessment?.autismRiskScore || 0;
    
    // Filter games by age appropriateness
    let ageAppropriateGames = [];
    if (ageInYears < 4) {
        ageAppropriateGames = games.filter(g => g.ageCategory === 'toddlers');
    } else if (ageInYears <= 12) {
        ageAppropriateGames = games.filter(g => g.ageCategory === 'children');
    } else if (ageInYears <= 18) {
        ageAppropriateGames = games.filter(g => g.ageCategory === 'adolescents');
    } else {
        ageAppropriateGames = games.filter(g => g.ageCategory === 'adults');
    }
    
    // Score and prioritize games based on assessment
    const scoredGames = ageAppropriateGames.map(game => {
        let score = 0;
        
        // Base score on age appropriateness
        score += game.ageCategory === getOptimalAgeCategory(ageInYears) ? 20 : 10;
        
        // Bonus points for targeting specific domains
        if (domainScores.socialCommunication && game.skills.includes('Social')) score += 15;
        if (domainScores.behaviorPatterns && game.skills.includes('Behavioral')) score += 15;
        if (domainScores.sensoryProcessing && game.skills.includes('Sensory')) score += 15;
        if (domainScores.cognitiveAbilities && game.skills.includes('Cognitive')) score += 15;
        
        // Higher priority for high-risk patients
        if (autismRiskScore > 70) score += 10;
        
        return {
            ...game,
            recommendationScore: score,
            priority: score > 40 ? 1 : (score > 25 ? 2 : 3),
            personalizedReason: getPersonalizationReason(game, patient, assessment)
        };
    });
    
    // Sort by recommendation score and priority
    scoredGames.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.recommendationScore - a.recommendationScore;
    });
    
    // Return top 8 recommended games
    return scoredGames.slice(0, 8).map((game, index) => ({
        ...game,
        recommendationRank: index + 1,
        totalGames: scoredGames.length
    }));
}

// Helper function to get optimal age category
function getOptimalAgeCategory(age) {
    if (age < 4) return 'toddlers';
    if (age <= 12) return 'children';
    if (age <= 18) return 'adolescents';
    return 'adults';
}

// Helper function to get personalization reason
function getPersonalizationReason(game, patient, assessment) {
    const reasons = [];
    
    if (game.ageCategory === getOptimalAgeCategory(patient.age || 0)) {
        reasons.push('Age-appropriate');
    }
    
    const domainScores = assessment?.domainScores || {};
    if (domainScores.socialCommunication && game.skills.includes('Social')) {
        reasons.push('Targets social communication');
    }
    if (domainScores.behaviorPatterns && game.skills.includes('Behavioral')) {
        reasons.push('Targets behavioral patterns');
    }
    if (domainScores.sensoryProcessing && game.skills.includes('Sensory')) {
        reasons.push('Targets sensory processing');
    }
    if (domainScores.cognitiveAbilities && game.skills.includes('Cognitive')) {
        reasons.push('Targets cognitive abilities');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'General recommendation';
}

// =====================
// Start server (LAST)
// =====================
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Server accessible at http://localhost:${PORT}`);
});