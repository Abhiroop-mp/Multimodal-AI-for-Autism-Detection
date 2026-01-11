const mongoose = require('mongoose');
const PatientProfile = require('./models/PatientProfile');
const AssessmentResult = require('./models/AssessmentResult');
const PatientSurvey = require('./models/PatientSurvey');
const AssessmentService = require('./services/assessmentService');
require('dotenv').config();

async function fixAllDomainScores() {
    try {
        await mongoose.connect('mongodb://localhost:27017/asd-detection');
        console.log('Connected to MongoDB');

        // Get all assessment results to check their domainScores
        const assessments = await AssessmentResult.find({});
        console.log(`Found ${assessments.length} total assessments`);

        for (const assessment of assessments) {
            console.log(`\nProcessing assessment: ${assessment._id}`);
            console.log('Domain scores:', assessment.domainScores);
            console.log('Domain scores type:', typeof assessment.domainScores);
            console.log('Domain scores keys:', assessment.domainScores ? Object.keys(assessment.domainScores) : 'N/A');
            
            // Check if domainScores is empty or missing
            if (!assessment.domainScores || Object.keys(assessment.domainScores).length === 0) {
                console.log('Domain scores are empty, calculating...');
                
                // Find the latest survey for this patient
                const latestSurvey = await PatientSurvey.findOne({ 
                    patientProfileId: assessment.patientProfileId 
                }).sort({ createdAt: -1 });

                if (latestSurvey && latestSurvey.answers) {
                    console.log('Found survey, calculating domain scores...');
                    
                    // Calculate domain scores
                    const calculatedDomainScores = AssessmentService.calculateDomainScores(latestSurvey.answers);
                    console.log('Calculated domain scores:', calculatedDomainScores);
                    
                    // Update the assessment
                    assessment.domainScores = calculatedDomainScores;
                    await assessment.save();
                    
                    console.log('✅ Updated assessment with domain scores');
                } else {
                    console.log('❌ No survey data found for this assessment');
                }
            } else {
                console.log('Domain scores already exist, skipping...');
            }
        }

        console.log('\n✅ Domain scores check completed!');
        process.exit(0);

    } catch (error) {
        console.error('Error fixing domain scores:', error);
        process.exit(1);
    }
}

fixAllDomainScores();
