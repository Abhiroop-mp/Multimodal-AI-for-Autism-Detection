const mongoose = require("mongoose");

const assessmentResultSchema = new mongoose.Schema({
    patientProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientProfile",
        required: true
    },

    // Autism Risk Assessment
    autismRiskScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },

    riskLevel: {
        type: String,
        enum: ["low", "moderate", "high"],
        required: true
    },

    // Detailed Analysis
    domainScores: {
        socialCommunication: { type: Number, min: 0, max: 100 },
        behaviorPatterns: { type: Number, min: 0, max: 100 },
        sensoryProcessing: { type: Number, min: 0, max: 100 },
        cognitiveAbilities: { type: Number, min: 0, max: 100 }
    },

    // Key Indicators
    keyIndicators: [{
        domain: String,
        score: Number,
        description: String,
        severity: String // mild, moderate, severe
    }],

    // Recommendations
    recommendations: [{
        category: String,
        priority: String, // low, medium, high
        description: String,
        actions: [String]
    }],

    // Assessment Metadata
    assessmentDate: {
        type: Date,
        default: Date.now
    },

    confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },

    // Follow-up needed
    followUpRecommended: {
        type: Boolean,
        default: false
    },

    followUpNotes: String
});

module.exports = mongoose.model("AssessmentResult", assessmentResultSchema);
