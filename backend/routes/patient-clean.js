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

console.log('=== CLEAN PATIENT ROUTES FILE LOADED ===');

// Simple test route to debug the issue
router.get('/test-simple', (req, res) => {
    console.log('=== SIMPLE TEST ROUTE CALLED ===');
    res.json({ message: 'Simple test route works!' });
});

// Check if email already exists
router.get('/check-email', async (req, res) => {
    try {
        console.log('=== CHECK EMAIL ROUTE CALLED ===');
        console.log('Request headers:', req.headers);
        console.log('Request query:', req.query);
        
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

// Check if email already exists (without auth for testing)
router.get('/check-email-no-auth', async (req, res) => {
    try {
        console.log('=== CHECK EMAIL NO AUTH ROUTE CALLED ===');
        console.log('Request headers:', req.headers);
        console.log('Request query:', req.query);
        
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

            // Keep first (oldest) patient, remove the rest
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

module.exports = router;

console.log('=== CLEAN PATIENT ROUTES MODULE EXPORTED ===');
