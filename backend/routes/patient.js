const express = require("express");
const router = express.Router();
const PatientProfile = require("../models/PatientProfile");
const PatientSurvey = require("../models/PatientSurvey");
const PatientUpload = require("../models/PatientUpload");
const AssessmentResult = require("../models/AssessmentResult");
const authMiddleware = require("../middleware/auth");
const AssessmentService = require("../services/assessmentService");
const FileService = require("../services/fileService");
const multer = require("multer");
const path = require("path");

// Debug: Log when routes are loaded
console.log('=== PATIENT ROUTES FILE LOADED ===');

// Root route to test if router is working
router.get('/', (req, res) => {
    console.log('=== ROOT ROUTE CALLED ===');
    res.json({ message: 'Patient router root is working!', timestamp: new Date() });
});

// Test route without authentication
router.get('/test-no-auth', async (req, res) => {
    console.log('=== TEST NO AUTH ROUTE CALLED ===');
    res.json({ message: 'Patient routes work without auth!', timestamp: new Date() });
});

// Test route to verify routing works
router.get('/test', authMiddleware, async (req, res) => {
    console.log('=== TEST ROUTE CALLED ===');
    res.json({ message: 'Patient routes are working!', timestamp: new Date() });
});

// Check if email already exists
router.get('/check-email', authMiddleware, async (req, res) => {
    try {
        console.log('=== CHECK EMAIL ROUTE CALLED ===');
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                message: 'Email parameter is required'
            });
        }

        // Check if email already exists in database
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

// Remove duplicate patients and keep only one per email
router.post('/cleanup-duplicates', authMiddleware, async (req, res) => {
    try {
        console.log('=== CLEANING UP DUPLICATE PATIENTS ROUTE CALLED ===');
        
        // Get all patients
        const allPatients = await PatientProfile.find({}).sort({ createdAt: 1 });
        console.log(`Found ${allPatients.length} total patients`);

        // Group by email (case-insensitive)
        const emailGroups = {};
        for (const patient of allPatients) {
            const email = patient.patientEmail.toLowerCase().trim();
            if (!emailGroups[email]) {
                emailGroups[email] = [];
            }
            emailGroups[email].push(patient);
        }

        // Find emails with duplicates
        const duplicateEmails = Object.keys(emailGroups).filter(email => emailGroups[email].length > 1);
        console.log(`Found ${duplicateEmails.length} email addresses with duplicates`);

        let totalRemoved = 0;
        let cleanupResults = [];

        for (const email of duplicateEmails) {
            const patients = emailGroups[email];
            console.log(`Processing email: ${email} (${patients.length} patients)`);

            // Keep the first (oldest) patient, remove the rest
            const patientToKeep = patients[0];
            const patientsToRemove = patients.slice(1);

            console.log(`Keeping patient: ${patientToKeep.patientName} (${patientToKeep._id})`);
            console.log(`Removing ${patientsToRemove.length} duplicate patients`);

            // Remove related data for duplicates
            for (const patient of patientsToRemove) {
                try {
                    // Remove patient surveys
                    await PatientSurvey.deleteMany({ patientProfileId: patient._id });
                    
                    // Remove patient uploads
                    await PatientUpload.deleteMany({ patientProfileId: patient._id });
                    
                    // Remove patient assessments
                    await AssessmentResult.deleteMany({ patientProfileId: patient._id });
                    
                    // Remove the patient profile
                    await PatientProfile.deleteOne({ _id: patient._id });
                    
                    totalRemoved++;
                    console.log(`Removed duplicate patient: ${patient.patientName} (${patient._id})`);
                } catch (removeError) {
                    console.error(`Error removing patient ${patient._id}:`, removeError);
                }
            }

            cleanupResults.push({
                email: email,
                kept: {
                    id: patientToKeep._id,
                    name: patientToKeep.patientName,
                    createdAt: patientToKeep.createdAt
                },
                removed: patientsToRemove.map(p => ({
                    id: p._id,
                    name: p.patientName,
                    createdAt: p.createdAt
                })),
                removedCount: patientsToRemove.length
            });
        }

        console.log(`=== CLEANUP COMPLETE ===`);
        console.log(`Total duplicate patients removed: ${totalRemoved}`);
        console.log(`Total unique emails processed: ${duplicateEmails.length}`);

        res.json({
            message: 'Duplicate cleanup completed successfully',
            totalRemoved: totalRemoved,
            totalEmailsProcessed: duplicateEmails.length,
            results: cleanupResults
        });

    } catch (error) {
        console.error('Error cleaning up duplicates:', error);
        res.status(500).json({
            message: 'Failed to cleanup duplicate patients',
            error: error.message
        });
    }
});

// Get patient profile by email (for patient dashboard color loading)
router.get('/by-email/:email', authMiddleware, async (req, res) => {
    try {
        const { email } = req.params;
        
        const patientProfile = await PatientProfile.findOne({ 
            patientEmail: email.toLowerCase() 
        });
        
        if (!patientProfile) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        
        res.json(patientProfile);
    } catch (error) {
        console.error('Error finding patient by email:', error);
        res.status(500).json({ message: 'Failed to find patient profile' });
    }
});

// Test endpoint
router.get('/test', authMiddleware, async (req, res) => {
    try {
        const patients = await PatientProfile.find({ parentId: req.user.userId });
        res.json({ 
            message: 'API working', 
            userId: req.user.userId,
            patientCount: patients.length,
            patients: patients.map(p => ({ id: p._id, name: p.patientName }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Memory storage for GridFS (stores files in memory before uploading to MongoDB)
const memoryStorage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images and videos only
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'));
        }
    }
});

// GridFS upload middleware (uses memory storage)
const gridfsUpload = multer({ 
    storage: memoryStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images and videos only
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'));
        }
    }
});

/* ======================
   ADD PATIENT + SURVEY
====================== */
function getAgeGroup(age, ageUnit) {
    if (ageUnit === "months") {
        if (age >= 12 && age <= 36) return "toddler";
    }

    if (ageUnit === "years") {
        if (age >= 4 && age <= 11) return "child";
        if (age >= 12 && age <= 16) return "adolescent";
        if (age >= 17) return "adult";
    }

    return null;
}

router.post("/add", authMiddleware, async (req, res) => {
    const { patientEmail, patientName, age, ageUnit, surveyAnswers } = req.body;

    if (!patientEmail || !patientName || !age || !ageUnit) {
        return res.status(400).json({
            message: "Patient name, email, age and age unit are required"
        });
    }

    const ageGroup = getAgeGroup(age, ageUnit);

    if (!ageGroup) {
        return res.status(400).json({
            message: "Invalid age or age unit"
        });
    }

    try {
        // Create patient profile
        const profile = await PatientProfile.create({
            parentId: req.user.userId,
            patientEmail: patientEmail.toLowerCase(),
            patientName,
            age,
            ageUnit,
            ageGroup
        });

        // Save survey if provided
        let assessmentResult = null;
        if (surveyAnswers) {
            const survey = await PatientSurvey.create({
                patientProfileId: profile._id,
                ageGroup,
                answers: surveyAnswers
            });

            // Analyze survey and generate assessment
            try {
                assessmentResult = await AssessmentService.analyzeSurvey(
                    profile._id,
                    surveyAnswers,
                    ageGroup
                );
            } catch (assessmentError) {
                console.error("Assessment analysis failed:", assessmentError);
                // Continue without assessment - don't fail the whole process
            }
        }

        res.json({ 
            message: "Patient added successfully", 
            profile,
            assessment: assessmentResult
        });

    } catch (error) {
        console.error("Add patient error:", error);
        res.status(500).json({
            message: "Failed to add patient"
        });
    }
});

/* ======================
   GET ALL PARENT PATIENTS
   (REGISTERED + UNREGISTERED)
====================== */
router.get("/parent/:parentId", authMiddleware, async (req, res) => {
    try {
        // 🔐 SECURITY CHECK
        if (req.user.userId !== req.params.parentId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const profiles = await PatientProfile.find({
            parentId: req.params.parentId
        });

        res.json(profiles);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to load patients"
        });
    }
});

/* ======================
   GET PATIENT ASSESSMENT RESULTS
====================== */
router.get("/:patientId/assessment", authMiddleware, async (req, res) => {
    try {
        // Verify parent owns this patient
        const patient = await PatientProfile.findOne({
            _id: req.params.patientId,
            parentId: req.user.userId
        });

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Get latest assessment result
        const assessment = await AssessmentResult.findOne({
            patientProfileId: req.params.patientId
        }).sort({ assessmentDate: -1 });

        if (!assessment) {
            return res.status(404).json({ message: "No assessment found" });
        }

        // Get survey data for context
        const survey = await PatientSurvey.findOne({
            patientProfileId: req.params.patientId
        }).sort({ createdAt: -1 });

        res.json({
            patient,
            assessment,
            survey,
            recommendations: assessment.recommendations
        });

    } catch (error) {
        console.error("Get assessment error:", error);
        res.status(500).json({
            message: "Failed to load assessment"
        });
    }
});

/* ======================
   GET ALL ASSESSMENTS FOR PATIENT
====================== */
router.get("/:patientId/assessments", authMiddleware, async (req, res) => {
    try {
        // Verify parent owns this patient
        const patient = await PatientProfile.findOne({
            _id: req.params.patientId,
            parentId: req.user.userId
        });

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Get all assessment results with progression data
        const assessments = await AssessmentResult.find({
            patientProfileId: req.params.patientId
        }).sort({ assessmentDate: 1 });

        res.json({
            patient,
            assessments,
            totalAssessments: assessments.length
        });

    } catch (error) {
        console.error("Get assessments error:", error);
        res.status(500).json({
            message: "Failed to load assessments"
        });
    }
});

/* ======================
   FILE UPLOAD ROUTE
====================== */
router.post("/upload", authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { patientProfileId, type } = req.body;

        if (!patientProfileId || !type) {
            return res.status(400).json({ message: "Patient profile ID and file type are required" });
        }

        // Verify that the parent owns this patient profile
        const patientProfile = await PatientProfile.findOne({
            _id: patientProfileId,
            parentId: req.user.userId
        });

        if (!patientProfile) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Create upload record
        const upload = await PatientUpload.create({
            patientProfileId,
            type,
            fileUrl: `/uploads/${req.file.filename}`
        });

        res.json({ 
            message: "File uploaded successfully", 
            upload,
            fileUrl: `/uploads/${req.file.filename}`
        });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Upload failed" });
    }
});

/* ======================
   GRIDFS FILE UPLOAD (MongoDB Storage)
====================== */
router.post("/upload-gridfs", authMiddleware, gridfsUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { patientProfileId, type } = req.body;

        if (!patientProfileId || !type) {
            return res.status(400).json({ message: "Patient profile ID and file type are required" });
        }

        // Verify that the parent owns this patient profile
        const patientProfile = await PatientProfile.findOne({
            _id: patientProfileId,
            parentId: req.user.userId
        });

        if (!patientProfile) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Upload file to GridFS (MongoDB)
        const gridfsResult = await FileService.uploadToGridFS(req.file, patientProfileId, type);

        // Save file record to MongoDB
        const upload = await FileService.saveFileRecord(
            patientProfileId,
            gridfsResult.fileId,
            gridfsResult.filename,
            type,
            gridfsResult.metadata
        );

        res.json({ 
            message: "File uploaded successfully to MongoDB", 
            upload,
            fileId: gridfsResult.fileId,
            filename: gridfsResult.filename,
            storageType: "gridfs"
        });

    } catch (error) {
        console.error("GridFS upload error:", error);
        res.status(500).json({ message: "GridFS upload failed" });
    }
});

/* ======================
   GET FILE FROM GRIDFS
====================== */
router.get("/file/:fileId", authMiddleware, async (req, res) => {
    try {
        const { fileId } = req.params;

        // Get file info to verify access
        const upload = await PatientUpload.findOne({
            'metadata.fileId': fileId
        }).populate('patientProfileId');

        if (!upload) {
            return res.status(404).json({ message: "File not found" });
        }

        // Verify parent owns this patient profile
        if (upload.patientProfileId.parentId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Get file from GridFS
        const fileBuffer = await FileService.getFromGridFS(fileId);
        
        // Get file metadata
        const fileInfo = await FileService.getFileInfo(fileId);

        res.set({
            'Content-Type': fileInfo.metadata.mimeType,
            'Content-Length': fileBuffer.length,
            'Content-Disposition': `inline; filename="${fileInfo.metadata.originalName}"`
        });

        res.send(fileBuffer);

    } catch (error) {
        console.error("Get file error:", error);
        res.status(500).json({ message: "Failed to retrieve file" });
    }
});

/* ======================
   GET ALL PATIENT FILES
====================== */
router.get("/:patientId/files", authMiddleware, async (req, res) => {
    try {
        // Verify parent owns this patient profile
        const patient = await PatientProfile.findOne({
            _id: req.params.patientId,
            parentId: req.user.userId
        });

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Get all files for the patient
        const files = await FileService.getPatientFiles(req.params.patientId);

        res.json({
            patient,
            files,
            totalFiles: files.length
        });

    } catch (error) {
        console.error("Get files error:", error);
        res.status(500).json({ message: "Failed to load files" });
    }
});

// Get patient profile by ID
router.get('/profile/:patientId', authMiddleware, async (req, res) => {
    try {
        const { patientId } = req.params;
        
        console.log('Fetching profile for patientId:', patientId);
        console.log('Requesting userId:', req.user.userId);
        
        // Validate ObjectId format
        if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid patient ID format" });
        }
        
        const patientProfile = await PatientProfile.findOne({ 
            _id: patientId,
            parentId: req.user.userId 
        }).populate('linkedUserId', 'name email');

        if (!patientProfile) {
            console.log('Patient profile not found for:', patientId);
            return res.status(404).json({ message: "Patient profile not found" });
        }

        console.log('Patient profile found:', patientProfile.patientName);
        res.json(patientProfile);
    } catch (error) {
        console.error("Get patient profile error:", error);
        res.status(500).json({ message: "Failed to load patient profile: " + error.message });
    }
});

// Get patient surveys
router.get('/surveys/:patientId', authMiddleware, async (req, res) => {
    try {
        const { patientId } = req.params;
        
        console.log('Fetching surveys for patientId:', patientId);
        
        // Validate ObjectId format
        if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid patient ID format" });
        }
        
        // Verify patient belongs to this parent
        const patientProfile = await PatientProfile.findOne({ 
            _id: patientId,
            parentId: req.user.userId 
        });

        if (!patientProfile) {
            console.log('Patient not found for surveys:', patientId);
            return res.status(404).json({ message: "Patient not found" });
        }

        const surveys = await PatientSurvey.find({ 
            patientProfileId: patientId 
        }).sort({ createdAt: -1 });

        console.log('Found surveys:', surveys.length);
        res.json(surveys);
    } catch (error) {
        console.error("Get surveys error:", error);
        res.status(500).json({ message: "Failed to load surveys: " + error.message });
    }
});

// Get patient assessments
router.get('/assessments/:patientId', authMiddleware, async (req, res) => {
    try {
        const { patientId } = req.params;
        
        console.log('Fetching assessments for patientId:', patientId);
        
        // Validate ObjectId format
        if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid patient ID format" });
        }
        
        // Verify patient belongs to this parent
        const patientProfile = await PatientProfile.findOne({ 
            _id: patientId,
            parentId: req.user.userId 
        });

        if (!patientProfile) {
            console.log('Patient not found for assessments:', patientId);
            return res.status(404).json({ message: "Patient not found" });
        }

        // For now, return mock assessment data based on surveys
        // In a real implementation, this would fetch from an AssessmentResult collection
        const surveys = await PatientSurvey.find({ 
            patientProfileId: patientId 
        }).sort({ createdAt: -1 });

        console.log('Found surveys for assessment generation:', surveys.length);

        // Generate mock assessment results from survey data
        const assessments = surveys.map(survey => {
            const answers = survey.answers || {};
            const ageGroup = survey.ageGroup || 'child';
            
            // Calculate domain scores based on answers
            const domainScores = calculateDomainScores(answers, ageGroup);
            const overallScore = calculateOverallScore(domainScores);
            
            return {
                _id: survey._id,
                createdAt: survey.createdAt,
                overallScore,
                domainScores,
                riskLevel: overallScore <= 30 ? 'low' : overallScore <= 60 ? 'moderate' : 'high',
                recommendations: generateRecommendations(domainScores, overallScore, ageGroup),
                notes: survey.notes || ''
            };
        });

        console.log('Generated assessments:', assessments.length);
        res.json(assessments);
    } catch (error) {
        console.error("Get assessments error:", error);
        res.status(500).json({ message: "Failed to load assessments: " + error.message });
    }
});

// Helper function to calculate domain scores
function calculateDomainScores(answers, ageGroup) {
    const domainScores = {
        socialCommunication: 0,
        behavioralPatterns: 0,
        sensoryProcessing: 0,
        cognitiveAbilities: 0
    };

    // Map questions to domains based on age group
    const domainMapping = getDomainMapping(ageGroup);
    let totalQuestions = 0;
    let domainCounts = {
        socialCommunication: 0,
        behavioralPatterns: 0,
        sensoryProcessing: 0,
        cognitiveAbilities: 0
    };

    // Calculate scores for each domain
    Object.entries(answers).forEach(([question, answer]) => {
        const qNum = parseInt(question.replace('q', ''));
        const domain = domainMapping[qNum];
        
        if (domain) {
            // Convert answer to numerical score (0-100 scale)
            const score = answerToScore(answer);
            domainScores[domain] += score;
            domainCounts[domain]++;
            totalQuestions++;
        }
    });

    // Average the scores for each domain
    Object.keys(domainScores).forEach(domain => {
        if (domainCounts[domain] > 0) {
            domainScores[domain] = Math.round(domainScores[domain] / domainCounts[domain]);
        }
    });

    return domainScores;
}

// Helper function to get domain mapping for different age groups
function getDomainMapping(ageGroup) {
    const mappings = {
        toddler: {
            1: 'socialCommunication', 2: 'socialCommunication', 3: 'socialCommunication',
            4: 'cognitiveAbilities', 5: 'socialCommunication', 6: 'socialCommunication',
            7: 'sensoryProcessing', 8: 'behavioralPatterns', 9: 'behavioralPatterns',
            10: 'socialCommunication'
        },
        child: {
            1: 'socialCommunication', 2: 'socialCommunication', 3: 'cognitiveAbilities',
            4: 'behavioralPatterns', 5: 'socialCommunication', 6: 'socialCommunication',
            7: 'socialCommunication', 8: 'sensoryProcessing', 9: 'cognitiveAbilities',
            10: 'socialCommunication', 11: 'cognitiveAbilities', 12: 'sensoryProcessing'
        },
        adolescent: {
            1: 'socialCommunication', 2: 'socialCommunication', 3: 'behavioralPatterns',
            4: 'cognitiveAbilities', 5: 'socialCommunication', 6: 'socialCommunication',
            7: 'socialCommunication', 8: 'sensoryProcessing', 9: 'behavioralPatterns',
            10: 'behavioralPatterns', 11: 'socialCommunication', 12: 'socialCommunication'
        },
        adult: {
            1: 'socialCommunication', 2: 'socialCommunication', 3: 'cognitiveAbilities',
            4: 'behavioralPatterns', 5: 'socialCommunication', 6: 'behavioralPatterns',
            7: 'sensoryProcessing', 8: 'cognitiveAbilities', 9: 'cognitiveAbilities',
            10: 'cognitiveAbilities', 11: 'socialCommunication', 12: 'cognitiveAbilities'
        }
    };

    return mappings[ageGroup] || mappings.child;
}

// Helper function to convert answer to numerical score
function answerToScore(answer) {
    const scoreMap = {
        // Positive/low-risk answers
        'always': 10, 'very-comfortable': 10, 'no': 10, 'well': 10, 'none': 10,
        'usually': 20, 'comfortable': 20, 'mild': 20, 'minor-difficulty': 20,
        'sometimes': 40, 'somewhat-comfortable': 40, 'somewhat-flexible': 40,
        'rarely': 60, 'anxious': 60, 'moderate': 60, 'significant-difficulty': 60,
        'never': 80, 'very-anxious': 80, 'severe': 80, 'extreme-distress': 80,
        'avoids': 90, 'very-rigid': 90, 'constant': 90, 'extreme-stress': 90,
        
        // Child/adolescent specific
        'age-appropriate': 10, 'no-difficulty': 10, 'understands-well': 10,
        'slightly-delayed': 30, 'minor-issues': 30, 'somely-difficult': 30,
        'significantly-delayed': 50, 'moderate-issues': 50, 'very-difficult': 50,
        'minimal': 70, 'severe-issues': 70, 'concrete-only': 70,
        
        // Adult specific
        'no-issues': 10, 'always-appropriate': 10, 'balanced': 10,
        'minor-issues': 30, 'usually-appropriate': 30, 'moderate-focus': 30,
        'moderate-issues': 50, 'sometimes-inappropriate': 50, 'intense-focus': 50,
        'severe-issues': 70, 'often-inappropriate': 70, 'obsessive': 70
    };

    return scoreMap[answer] || 50; // Default to medium risk if answer not found
}

// Helper function to calculate overall score
function calculateOverallScore(domainScores) {
    const weights = {
        socialCommunication: 0.35,
        behavioralPatterns: 0.25,
        sensoryProcessing: 0.20,
        cognitiveAbilities: 0.20
    };

    let weightedSum = 0;
    Object.entries(domainScores).forEach(([domain, score]) => {
        weightedSum += score * weights[domain];
    });

    return Math.round(weightedSum);
}

// Helper function to generate recommendations
function generateRecommendations(domainScores, overallScore, ageGroup) {
    const recommendations = [];

    // High-risk recommendations
    if (overallScore > 60) {
        recommendations.push({
            category: 'Immediate Professional Consultation',
            description: 'High risk indicators detected. Professional evaluation is strongly recommended.',
            priority: 'high',
            actions: [
                'Schedule comprehensive assessment with developmental specialist',
                'Consider pediatric neurologist consultation',
                'Early intervention services evaluation'
            ]
        });
    }

    // Domain-specific recommendations
    if (domainScores.socialCommunication > 50) {
        recommendations.push({
            category: 'Social Communication Support',
            description: 'Challenges detected in social communication skills.',
            priority: domainScores.socialCommunication > 70 ? 'high' : 'medium',
            actions: [
                'Speech and language therapy evaluation',
                'Social skills groups or therapy',
                'Parent training in communication strategies'
            ]
        });
    }

    if (domainScores.behavioralPatterns > 50) {
        recommendations.push({
            category: 'Behavioral Intervention',
            description: 'Behavioral patterns may benefit from structured intervention.',
            priority: domainScores.behavioralPatterns > 70 ? 'high' : 'medium',
            actions: [
                'Applied Behavior Analysis (ABA) therapy consultation',
                'Behavioral assessment by psychologist',
                'Structured routine implementation'
            ]
        });
    }

    if (domainScores.sensoryProcessing > 50) {
        recommendations.push({
            category: 'Sensory Integration Therapy',
            description: 'Sensory processing challenges identified.',
            priority: 'medium',
            actions: [
                'Occupational therapy evaluation',
                'Sensory diet development',
                'Environmental modifications'
            ]
        });
    }

    if (domainScores.cognitiveAbilities > 50) {
        recommendations.push({
            category: 'Cognitive Development Support',
            description: 'Cognitive challenges that may impact daily functioning.',
            priority: 'medium',
            actions: [
                'Educational assessment',
                'Individualized Education Program (IEP) development',
                'Executive functioning skills training'
            ]
        });
    }

    // Age-specific recommendations
    if (ageGroup === 'toddler' && overallScore > 30) {
        recommendations.push({
            category: 'Early Intervention',
            description: 'Early detection is crucial for optimal outcomes.',
            priority: 'high',
            actions: [
                'Contact local early intervention services',
                'Developmental monitoring program',
                'Parent-mediated therapy programs'
            ]
        });
    }

    return recommendations;
}

// Create ML assessment from existing survey data
router.post('/analyze-survey', authMiddleware, async (req, res) => {
    try {
        console.log('=== ML ASSESSMENT REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);
        
        const { patientProfileId, surveyAnswers, ageGroup } = req.body;
        
        console.log('Creating ML assessment:', {
            patientProfileId,
            ageGroup,
            surveyAnswersKeys: Object.keys(surveyAnswers || {})
        });

        // Validate input
        if (!patientProfileId || !surveyAnswers || !ageGroup) {
            console.log('Validation failed - missing fields');
            return res.status(400).json({
                message: 'Missing required fields: patientProfileId, surveyAnswers, ageGroup'
            });
        }

        console.log('Validation passed - calling AssessmentService...');
        
        // Create ML assessment
        const assessmentResult = await AssessmentService.analyzeSurvey(
            patientProfileId,
            surveyAnswers,
            ageGroup
        );

        console.log('ML assessment created successfully:', {
            id: assessmentResult._id,
            riskScore: assessmentResult.autismRiskScore,
            riskLevel: assessmentResult.riskLevel
        });

        res.status(201).json({
            message: 'ML assessment created successfully',
            assessment: assessmentResult
        });

    } catch (error) {
        console.error('Error creating ML assessment:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Failed to create ML assessment',
            error: error.message
        });
    }
});

module.exports = router;

// Debug: Log when module is exported
console.log('=== PATIENT ROUTES MODULE EXPORTED ===');
