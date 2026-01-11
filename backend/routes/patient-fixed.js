const express = require("express");
const router = express.Router();
const PatientProfile = require("../models/PatientProfile");
const PatientSurvey = require("../models/PatientSurvey");
const PatientUpload = require("../models/PatientUpload");
const AssessmentResult = require("../models/AssessmentResult");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const AssessmentService = require("../services/assessmentService");
const FileService = require("../services/fileService");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

console.log('=== FIXED PATIENT ROUTES FILE LOADED ===');

// Get all patients (for enhanced dashboard)
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('=== GET ALL PATIENTS ROUTE CALLED ===');
        
        const patients = await PatientProfile.find({}).sort({ createdAt: -1 });
        console.log('Found patients:', patients.length);
        
        res.json(patients);
    } catch (error) {
        console.error('Error fetching all patients:', error);
        res.status(500).json({ message: 'Failed to fetch patients' });
    }
});

// Simple test route to verify routing works
router.get('/test-simple', (req, res) => {
    console.log('=== SIMPLE TEST ROUTE CALLED ===');
    res.json({ message: 'Simple test route works!' });
});

// Check if email already exists
router.get('/check-email', async (req, res) => {
    try {
        console.log('=== CHECK EMAIL ROUTE CALLED ===');
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                message: 'Email parameter is required'
            });
        }

        const existingPatient = await PatientProfile.findOne({ 
            patientEmail: email.toLowerCase().trim() 
        });

        console.log('Database query result:', existingPatient);

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

// Test route without authentication for debugging
router.post('/test-add', async (req, res) => {
    try {
        console.log('=== TEST PATIENT ADD ROUTE CALLED ===');
        console.log('Request body:', req.body);
        
        const {
            patientEmail,
            patientName,
            patientAge,
            age,
            ageUnit,
            parentId
        } = req.body;

        const resolvedAge = age ?? patientAge;
        console.log('Resolved age:', resolvedAge);

        if (!patientEmail || !patientName || !resolvedAge || !ageUnit) {
            return res.status(400).json({
                message: 'patientName, patientEmail, age, and ageUnit are required'
            });
        }

        const normalizedEmail = patientEmail.toLowerCase().trim();
        console.log('Normalized email:', normalizedEmail);

        // Calculate ageGroup based on age and ageUnit
        let ageGroup;
        if (ageUnit.toLowerCase() === 'months') {
            ageGroup = Number(resolvedAge) < 48 ? 'toddler' : 'child';
        } else {
            if (Number(resolvedAge) < 4) {
                ageGroup = 'toddler';
            } else if (Number(resolvedAge) <= 11) {
                ageGroup = 'child';
            } else if (Number(resolvedAge) <= 16) {
                ageGroup = 'adolescent';
            } else {
                ageGroup = 'adult';
            }
        }
        console.log('Calculated ageGroup:', ageGroup);

        const profile = await PatientProfile.create({
            patientName,
            patientEmail: normalizedEmail,
            age: Number(resolvedAge),
            ageUnit,
            ageGroup,
            parentId: parentId || '695f0dc4e7e27ebe5ff9d335'
        });
        console.log('Profile created:', profile);

        res.json({
            message: 'Test patient added successfully',
            patientProfileId: profile._id,
            profile
        });
    } catch (error) {
        console.error('Test add patient error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Failed to add test patient: ' + error.message });
    }
});

router.post('/add', authMiddleware, async (req, res) => {
    try {
        console.log('=== PATIENT ADD ROUTE CALLED ===');
        console.log('Request body:', req.body);
        console.log('Request user:', req.user);
        
        const {
            patientEmail,
            patientName,
            patientAge,
            age,
            ageUnit,
            parentId,
            surveyAnswers,
            surveyResponses,
            surveyNotes
        } = req.body;

        console.log('=== EXTRACTED FIELDS ===');
        console.log('patientEmail:', patientEmail);
        console.log('patientName:', patientName);
        console.log('patientAge:', patientAge);
        console.log('age:', age);
        console.log('ageUnit:', ageUnit);
        console.log('parentId:', parentId);
        console.log('surveyAnswers:', surveyAnswers);
        console.log('surveyResponses:', surveyResponses);
        console.log('surveyNotes:', surveyNotes);

        const resolvedAge = age ?? patientAge;
        const resolvedSurveyAnswers = surveyAnswers ?? surveyResponses;
        
        console.log('=== SURVEY DATA ANALYSIS ===');
        console.log('surveyAnswers:', surveyAnswers);
        console.log('surveyResponses:', surveyResponses);
        console.log('resolvedSurveyAnswers:', resolvedSurveyAnswers);
        console.log('resolvedSurveyAnswers type:', typeof resolvedSurveyAnswers);
        console.log('resolvedSurveyAnswers isArray:', Array.isArray(resolvedSurveyAnswers));
        console.log('resolvedSurveyAnswers keys:', Object.keys(resolvedSurveyAnswers || {}));
        console.log('resolvedSurveyAnswers length:', resolvedSurveyAnswers && (Array.isArray(resolvedSurveyAnswers) ? resolvedSurveyAnswers.length : Object.keys(resolvedSurveyAnswers || {}).length));

        if (!patientEmail || !patientName || !resolvedAge || !ageUnit) {
            return res.status(400).json({
                message: 'patientName, patientEmail, age, and ageUnit are required'
            });
        }

        const normalizedEmail = patientEmail.toLowerCase().trim();
        console.log('=== EMAIL VALIDATION ===');
        console.log('Original email:', patientEmail);
        console.log('Normalized email:', normalizedEmail);

        const existingPatient = await PatientProfile.findOne({ patientEmail: normalizedEmail });
        console.log('Existing patient check result:', existingPatient);
        
        if (existingPatient) {
            console.log('=== EMAIL ALREADY REGISTERED ===');
            console.log('Existing patient details:', {
                id: existingPatient._id,
                email: existingPatient.patientEmail,
                name: existingPatient.patientName,
                parentId: existingPatient.parentId
            });
            return res.status(409).json({
                message: 'This email address is already registered to another patient.'
            });
        }

        if (parentId && req.user.userId !== parentId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Validate that the parent exists
        const parentUserId = parentId || req.user.userId;
        const parentUser = await User.findById(parentUserId);
        if (!parentUser) {
            return res.status(400).json({ 
                message: 'Invalid parent account. Please log out and log back in.' 
            });
        }

        // Calculate ageGroup based on age and ageUnit
        let ageGroup;
        if (ageUnit.toLowerCase() === 'months') {
            ageGroup = Number(resolvedAge) < 48 ? 'toddler' : 'child';
        } else {
            if (Number(resolvedAge) < 4) {
                ageGroup = 'toddler';
            } else if (Number(resolvedAge) <= 11) {
                ageGroup = 'child';
            } else if (Number(resolvedAge) <= 16) {
                ageGroup = 'adolescent';
            } else {
                ageGroup = 'adult';
            }
        }

        const profile = await PatientProfile.create({
            patientName,
            patientEmail: normalizedEmail,
            age: Number(resolvedAge),
            ageUnit,
            ageGroup, // Add the required ageGroup field
            parentId: parentId || req.user.userId
        });

        let assessmentResult = null;
        if (resolvedSurveyAnswers && Array.isArray(resolvedSurveyAnswers) ? resolvedSurveyAnswers.length > 0 : Object.keys(resolvedSurveyAnswers || {}).length > 0) {
            await PatientSurvey.create({
                patientProfileId: profile._id,
                age: Number(resolvedAge),
                ageUnit,
                answers: resolvedSurveyAnswers,
                ageGroup: ageGroup, // Add the required ageGroup field
                notes: surveyNotes || ''
            });

            try {
                const ageGroup = String(ageUnit).toLowerCase() === 'months'
                    ? (Number(resolvedAge) < 48 ? 'toddler' : 'child')
                    : (Number(resolvedAge) < 4 ? 'toddler' : (Number(resolvedAge) <= 11 ? 'child' : (Number(resolvedAge) <= 16 ? 'adolescent' : 'adult')));

                assessmentResult = await AssessmentService.analyzeSurvey(
                    profile._id,
                    resolvedSurveyAnswers,
                    ageGroup
                );
            } catch (assessmentError) {
                console.error('Assessment analysis failed:', assessmentError);
            }
        }

        res.json({
            message: 'Patient added successfully',
            patientProfileId: profile._id,
            profile,
            assessment: assessmentResult
        });
    } catch (error) {
        console.error('Add patient error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            errno: error.errno,
            syscall: error.syscall
        });
        console.error('Request body received:', req.body);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to add patient';
        if (error.name === 'ValidationError') {
            errorMessage = 'Validation error: ' + error.message;
        } else if (error.message.includes('Cast to ObjectId failed')) {
            errorMessage = 'Invalid user ID. Please log out and log back in.';
        }
        
        res.status(500).json({ message: errorMessage });
    }
});

// Temporary test route without authentication
router.get('/parent-test/:parentId', async (req, res) => {
    try {
        console.log('=== TEST ROUTE CALLED ===');
        console.log('req.params.parentId:', req.params.parentId);
        
        // Convert string ID to ObjectId for MongoDB query
        let parentId;
        try {
            parentId = new mongoose.Types.ObjectId(req.params.parentId);
        } catch (error) {
            console.log('Invalid ObjectId format, trying as string:', req.params.parentId);
            parentId = req.params.parentId;
        }
        
        const profiles = await PatientProfile.find({ parentId: parentId }).sort({ createdAt: -1 });
        console.log('Found profiles:', profiles.length);

        // Include latest assessment data like the original route
        const withLatest = await Promise.all(
            profiles.map(async (p) => {
                const latestAssessment = await AssessmentResult.findOne({ patientProfileId: p._id })
                    .sort({ assessmentDate: -1 })
                    .select('autismRiskScore riskLevel assessmentDate confidenceScore domainScores')
                    .lean(); // Use lean() for better JSON serialization

                // Always log domain scores for debugging
                if (latestAssessment) {
                    console.log('=== PATIENT DEBUG INFO ===');
                    console.log('Patient ID:', p._id);
                    console.log('Patient Name:', p.patientName);
                    console.log('Has Assessment:', 'Yes');
                    console.log('Has Domain Scores:', latestAssessment.domainScores ? 'Yes' : 'No');
                    
                    if (latestAssessment.domainScores) {
                        console.log('Domain Scores Keys:', Object.keys(latestAssessment.domainScores));
                        console.log('Full Domain Scores:', JSON.stringify(latestAssessment.domainScores, null, 2));
                        console.log('Behavioral Score:', latestAssessment.domainScores.behaviorPatterns);
                    } else {
                        console.log('Domain Scores: NULL/UNDEFINED');
                    }
                    console.log('=== END DEBUG INFO ===');
                } else {
                    console.log('=== PATIENT DEBUG INFO ===');
                    console.log('Patient ID:', p._id);
                    console.log('Patient Name:', p.patientName);
                    console.log('Has Assessment:', 'No');
                    console.log('=== END DEBUG INFO ===');
                }

                // If assessment exists but doesn't have domainScores or domainScores is empty, calculate them
                if (latestAssessment && (!latestAssessment.domainScores || Object.keys(latestAssessment.domainScores).length === 0)) {
                    console.log('Assessment missing or has empty domainScores for patient', p._id, ', calculating from survey data...');
                    console.log('Latest assessment:', latestAssessment);
                    
                    // Get the latest survey to calculate domain scores
                    const latestSurvey = await PatientSurvey.findOne({ 
                        patientProfileId: p._id 
                    }).sort({ createdAt: -1 });
                    
                    console.log('Latest survey found:', latestSurvey ? 'Yes' : 'No');
                    if (latestSurvey) {
                        console.log('Survey answers count:', Object.keys(latestSurvey.answers || {}).length);
                    }
                    
                    if (latestSurvey && latestSurvey.answers) {
                        const AssessmentService = require('../services/assessmentService');
                        const calculatedDomainScores = AssessmentService.calculateDomainScores(latestSurvey.answers);
                        
                        console.log('Calculated domain scores:', calculatedDomainScores);
                        
                        // Update the assessment with calculated domain scores
                        await AssessmentResult.updateOne(
                            { _id: latestAssessment._id },
                            { domainScores: calculatedDomainScores }
                        );
                        
                        // Update the local object
                        latestAssessment.domainScores = calculatedDomainScores;
                        
                        console.log('Domain scores calculated and saved for patient', p._id, ':', calculatedDomainScores);
                    } else {
                        console.log('No survey data found for patient', p._id, '- cannot calculate domain scores');
                    }
                }

                return {
                    ...p.toObject(),
                    latestAssessment: latestAssessment || null
                };
            })
        );

        console.log('Final patient data with assessments:', withLatest);
        res.json(withLatest);
    } catch (error) {
        console.error('Test route error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/parent/:parentId', authMiddleware, async (req, res) => {
    try {
        console.log('=== GET PATIENTS ROUTE CALLED ===');
        console.log('req.params.parentId:', req.params.parentId);
        console.log('req.user.userId:', req.user.userId);
        console.log('Comparison result:', req.user.userId !== req.params.parentId);
        
        if (req.user.userId !== req.params.parentId) {
            console.log('ACCESS DENIED - User ID mismatch');
            return res.status(403).json({ message: 'Access denied' });
        }

        console.log('ACCESS GRANTED - Fetching patients...');
        const profiles = await PatientProfile.find({ parentId: req.params.parentId }).sort({ createdAt: -1 });
        console.log('Found profiles:', profiles.length);

        const withLatest = await Promise.all(
            profiles.map(async (p) => {
                const latestAssessment = await AssessmentResult.findOne({ patientProfileId: p._id })
                    .sort({ assessmentDate: -1 })
                    .select('autismRiskScore riskLevel assessmentDate confidenceScore');

                return {
                    ...p.toObject(),
                    latestAssessment: latestAssessment ? latestAssessment.toObject() : null
                };
            })
        );

        console.log('Final patient data:', withLatest);
        res.json(withLatest);
    } catch (error) {
        console.error('Failed to load patients:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Failed to load patients' });
    }
});

router.get('/profile/:patientId', authMiddleware, async (req, res) => {
    try {
        const profile = await PatientProfile.findOne({
            _id: req.params.patientId,
            parentId: req.user.userId
        });

        if (!profile) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Failed to load profile:', error);
        res.status(500).json({ message: 'Failed to load patient profile' });
    }
});

router.get('/surveys/:patientId', authMiddleware, async (req, res) => {
    try {
        const patient = await PatientProfile.findOne({
            _id: req.params.patientId,
            parentId: req.user.userId
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const surveys = await PatientSurvey.find({ patientProfileId: req.params.patientId }).sort({ createdAt: 1 });
        res.json(surveys);
    } catch (error) {
        console.error('Failed to load surveys:', error);
        res.status(500).json({ message: 'Failed to load surveys' });
    }
});

router.get('/assessments/:patientId', authMiddleware, async (req, res) => {
    try {
        const patient = await PatientProfile.findOne({
            _id: req.params.patientId,
            parentId: req.user.userId
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const assessments = await AssessmentResult.find({ patientProfileId: req.params.patientId }).sort({ assessmentDate: 1 });
        res.json(assessments);
    } catch (error) {
        console.error('Failed to load assessments:', error);
        res.status(500).json({ message: 'Failed to load assessments' });
    }
});

// Remove duplicate patients and keep only one per email
router.post('/cleanup-duplicates', authMiddleware, async (req, res) => {
    try {
        console.log('=== CLEANING UP DUPLICATE PATIENTS ROUTE CALLED ===');
        
        const allPatients = await PatientProfile.find({}).sort({ createdAt: 1 });
        console.log(`Found ${allPatients.length} total patients`);

        const emailGroups = {};
        for (const patient of allPatients) {
            const email = patient.patientEmail.toLowerCase().trim();
            if (!emailGroups[email]) {
                emailGroups[email] = [];
            }
            emailGroups[email].push(patient);
        }

        const duplicateEmails = Object.keys(emailGroups).filter(email => emailGroups[email].length > 1);
        console.log(`Found ${duplicateEmails.length} email addresses with duplicates`);

        let totalRemoved = 0;
        let cleanupResults = [];

        for (const email of duplicateEmails) {
            const patients = emailGroups[email];
            console.log(`Processing email: ${email} (${patients.length} patients)`);

            const patientToKeep = patients[0];
            const patientsToRemove = patients.slice(1);

            console.log(`Keeping patient: ${patientToKeep.patientName} (${patientToKeep._id})`);
            console.log(`Removing ${patientsToRemove.length} duplicate patients`);

            for (const patient of patientsToRemove) {
                try {
                    await PatientSurvey.deleteMany({ patientProfileId: patient._id });
                    await PatientUpload.deleteMany({ patientProfileId: patient._id });
                    await AssessmentResult.deleteMany({ patientProfileId: patient._id });
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

// Get patient-specific personalization data for dashboard
router.get('/patient-personalization/:patientId', authMiddleware, async (req, res) => {
    try {
        console.log('=== GET PATIENT PERSONALIZATION ROUTE CALLED ===');
        console.log('req.params.patientId:', req.params.patientId);
        console.log('req.user.userId:', req.user.userId);
        
        // Verify patient belongs to this user
        const patient = await PatientProfile.findOne({ 
            _id: req.params.patientId,
            parentId: req.user.userId 
        });
        
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        // Get latest assessment
        const latestAssessment = await AssessmentResult.findOne({ 
            patientProfileId: patient._id 
        }).sort({ assessmentDate: -1 });
        
        // Return patient-specific personalization data
        res.json({
            patient: patient,
            assessment: latestAssessment,
            personalizationData: {
                ageGroup: patient.ageGroup,
                riskLevel: latestAssessment?.riskLevel || 'unknown',
                domainScores: latestAssessment?.domainScores || {},
                overallRisk: latestAssessment?.autismRiskScore || 0
            }
        });
    } catch (error) {
        console.error('Failed to load patient personalization:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get patient activities with personalization
router.get('/activities/:patientId', authMiddleware, async (req, res) => {
    try {
        console.log('=== GET PATIENT ACTIVITIES ROUTE CALLED ===');
        console.log('req.params.patientId:', req.params.patientId);
        console.log('req.user.userId:', req.user.userId);
        
        // Verify patient belongs to this user
        const patient = await PatientProfile.findOne({ 
            _id: req.params.patientId,
            parentId: req.user.userId 
        });
        
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        // Get latest assessment
        const latestAssessment = await AssessmentResult.findOne({ 
            patientProfileId: patient._id 
        }).sort({ assessmentDate: -1 });
        
        // Generate personalized activities based on assessment and patient data
        const activities = generatePersonalizedActivities(patient, latestAssessment);
        
        res.json({
            patient: patient,
            assessment: latestAssessment,
            activities: activities
        });
    } catch (error) {
        console.error('Failed to load patient activities:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get current patient data for dashboard
router.get('/current-patient', authMiddleware, async (req, res) => {
    try {
        console.log('=== GET CURRENT PATIENT ROUTE CALLED ===');
        
        // Find patient profile linked to this user account
        const patientProfile = await PatientProfile.findOne({ 
            linkedUserId: req.user.userId 
        });

        if (!patientProfile) {
            return res.status(404).json({ 
                message: 'No patient profile linked to this account' 
            });
        }

        // Get latest assessment for this patient
        const latestAssessment = await AssessmentResult.findOne({ 
            patientProfileId: patientProfile._id 
        }).sort({ assessmentDate: -1 });

        // If assessment exists but doesn't have domainScores, calculate them
        if (latestAssessment && !latestAssessment.domainScores) {
            console.log('Assessment missing domainScores, calculating from survey data...');
            console.log('Latest assessment:', latestAssessment);
            
            // Get the latest survey to calculate domain scores
            const latestSurvey = await PatientSurvey.findOne({ 
                patientProfileId: patientProfile._id 
            }).sort({ createdAt: -1 });
            
            console.log('Latest survey found:', latestSurvey ? 'Yes' : 'No');
            if (latestSurvey) {
                console.log('Survey answers count:', Object.keys(latestSurvey.answers || {}).length);
                console.log('Sample survey answers:', latestSurvey.answers);
            }
            
            if (latestSurvey && latestSurvey.answers) {
                const AssessmentService = require('../services/assessmentService');
                const calculatedDomainScores = AssessmentService.calculateDomainScores(latestSurvey.answers);
                
                console.log('Calculated domain scores:', calculatedDomainScores);
                
                // Update the assessment with calculated domain scores
                latestAssessment.domainScores = calculatedDomainScores;
                await latestAssessment.save();
                
                console.log('Domain scores calculated and saved:', calculatedDomainScores);
            } else {
                console.log('No survey data found - cannot calculate domain scores');
            }
        } else if (latestAssessment && latestAssessment.domainScores) {
            console.log('Assessment already has domain scores:', latestAssessment.domainScores);
        } else {
            console.log('No assessment found for patient');
        }

        // Get patient surveys for additional context
        const surveys = await PatientSurvey.find({ 
            patientProfileId: patientProfile._id 
        }).sort({ createdAt: -1 }).limit(5);

        res.json({
            profile: patientProfile,
            latestAssessment: latestAssessment,
            recentSurveys: surveys,
            recommendations: latestAssessment ? latestAssessment.recommendations : []
        });

    } catch (error) {
        console.error('Failed to load current patient:', error);
        res.status(500).json({ message: 'Failed to load patient data' });
    }
});

// Get personalized activities based on patient assessment
router.get('/activities/:patientId', authMiddleware, async (req, res) => {
    try {
        console.log('=== GET PATIENT ACTIVITIES ROUTE CALLED ===');
        
        const patient = await PatientProfile.findOne({
            _id: req.params.patientId,
            parentId: req.user.userId
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const latestAssessment = await AssessmentResult.findOne({ 
            patientProfileId: patient._id 
        }).sort({ assessmentDate: -1 });

        // Generate personalized activities based on assessment
        const activities = generatePersonalizedActivities(patient, latestAssessment);
        
        res.json({
            patient: patient,
            assessment: latestAssessment,
            activities: activities
        });

    } catch (error) {
        console.error('Failed to load patient activities:', error);
        res.status(500).json({ message: 'Failed to load activities' });
    }
});

// Load games dataset
const gamesDataset = require('../../games-dataset.js');

// Generate personalized activities based on patient profile and assessment
function generatePersonalizedActivities(patient, assessment) {
    let recommendedActivities = [];
    
    if (assessment && assessment.domainScores) {
        // Use the new games dataset for personalized recommendations
        try {
            const games = gamesDataset.getPersonalizedGames(assessment, patient.ageGroup);
            
            // Convert games to activity format
            recommendedActivities = games.map(game => ({
                id: game.id,
                name: game.name,
                icon: game.icon,
                difficulty: game.difficulty,
                description: game.description,
                personalizedDescription: game.personalizedDescription,
                recommendedTime: game.recommendedTime,
                skills: game.skills || [],
                gameType: game.gameType,
                targetScore: game.targetScore,
                domainScore: game.domainScore,
                priority: game.priority,
                isCrossDomain: game.isCrossDomain || false,
                ageAppropriate: true
            }));
            
        } catch (error) {
            console.error('Error using games dataset:', error);
            // Fallback to basic activities if games dataset fails
            recommendedActivities = generateBasicActivities(patient, assessment);
        }
    } else {
        // No assessment data - provide basic activities
        recommendedActivities = generateBasicActivities(patient, assessment);
    }

    return recommendedActivities;
}

// Fallback function to generate basic activities
function generateBasicActivities(patient, assessment) {
    const baseActivities = {
        social: [
            { id: 'social-story', name: 'Social Stories', icon: 'fa-book', difficulty: 'easy', description: 'Interactive social scenario stories' },
            { id: 'emotion-cards', name: 'Emotion Cards', icon: 'fa-smile', difficulty: 'easy', description: 'Learn to recognize emotions' },
            { id: 'conversation-practice', name: 'Conversation Practice', icon: 'fa-comments', difficulty: 'medium', description: 'Practice social conversations' }
        ],
        cognitive: [
            { id: 'memory-match', name: 'Memory Match', icon: 'fa-brain', difficulty: 'easy', description: 'Memory matching games' },
            { id: 'pattern-puzzles', name: 'Pattern Puzzles', icon: 'fa-puzzle-piece', difficulty: 'medium', description: 'Complete visual patterns' },
            { id: 'sequencing-games', name: 'Sequencing Games', icon: 'fa-sort-numeric-up', difficulty: 'medium', description: 'Order and sequence activities' }
        ],
        sensory: [
            { id: 'calm-breathing', name: 'Calm Breathing', icon: 'fa-wind', difficulty: 'easy', description: 'Breathing exercises for relaxation' },
            { id: 'sensory-exploration', name: 'Sensory Exploration', icon: 'fa-hand-sparkles', difficulty: 'easy', description: 'Gentle sensory activities' },
            { id: 'movement-fun', name: 'Movement Fun', icon: 'fa-running', difficulty: 'medium', description: 'Physical movement activities' }
        ],
        behavioral: [
            { id: 'routine-builder', name: 'Routine Builder', icon: 'fa-calendar-check', difficulty: 'easy', description: 'Build daily routines' },
            { id: 'focus-practice', name: 'Focus Practice', icon: 'fa-eye', difficulty: 'medium', description: 'Attention and focus exercises' },
            { id: 'emotion-regulation', name: 'Emotion Regulation', icon: 'fa-heart', difficulty: 'medium', description: 'Learn emotional control' }
        ]
    };

    let recommendedActivities = [];
    let priorityAreas = [];

    if (assessment && assessment.domainScores) {
        const scores = assessment.domainScores;
        
        // Identify areas needing support (lower scores need more support)
        if (scores.socialCommunication < 60) priorityAreas.push('social');
        if (scores.cognitiveAbilities < 60) priorityAreas.push('cognitive');
        if (scores.sensoryProcessing < 60) priorityAreas.push('sensory');
        if (scores.behaviorPatterns < 60) priorityAreas.push('behavioral');
    }

    // If no assessment or all scores are good, provide balanced activities
    if (priorityAreas.length === 0) {
        priorityAreas = ['social', 'cognitive', 'sensory', 'behavioral'];
    }

    // Select activities based on priority areas and age group
    priorityAreas.forEach(area => {
        const areaActivities = baseActivities[area] || [];
        // Filter activities appropriate for age group
        const appropriateActivities = areaActivities.filter(activity => 
            isActivityAppropriateForAge(activity, patient.ageGroup)
        );
        recommendedActivities.push(...appropriateActivities.slice(0, 2)); // Take 2 activities per area
    });

    // Add age-specific modifications
    recommendedActivities = recommendedActivities.map(activity => ({
        ...activity,
        ageAppropriate: true,
        personalizedDescription: personalizeDescription(activity, patient, assessment),
        recommendedTime: getRecommendedTime(activity, patient.ageGroup)
    }));

    return recommendedActivities;
}

// Helper function to check if activity is appropriate for age group
function isActivityAppropriateForAge(activity, ageGroup) {
    // All activities are appropriate for all age groups in this basic implementation
    // Can be enhanced with age-specific filtering
    return true;
}

// Helper function to personalize activity descriptions
function personalizeDescription(activity, patient, assessment) {
    let description = activity.description;
    
    if (assessment && assessment.domainScores) {
        const scores = assessment.domainScores;
        
        // Add personalized context based on assessment
        if (activity.id.includes('social') && scores.socialCommunication < 60) {
            description += ' - Great for building social confidence!';
        } else if (activity.id.includes('cognitive') && scores.cognitiveAbilities < 60) {
            description += ' - Helps strengthen cognitive skills!';
        } else if (activity.id.includes('sensory') && scores.sensoryProcessing < 60) {
            description += ' - Gentle sensory support activities!';
        } else if (activity.id.includes('focus') && scores.behaviorPatterns < 60) {
            description += ' - Excellent for improving focus!';
        }
    }
    
    return description;
}

// Helper function to get recommended time for activities
function getRecommendedTime(activity, ageGroup) {
    const timeRecommendations = {
        toddler: '5-10 minutes',
        child: '10-15 minutes',
        adolescent: '15-20 minutes',
        adult: '20-30 minutes'
    };
    
    return timeRecommendations[ageGroup] || '10-15 minutes';
}

module.exports = router;

console.log('=== FIXED PATIENT ROUTES MODULE EXPORTED ===');
