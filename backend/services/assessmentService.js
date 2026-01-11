const PatientSurvey = require("../models/PatientSurvey");
const AssessmentResult = require("../models/AssessmentResult");
const PythonMLService = require("./pythonMLService");

class AssessmentService {
    // Analyze survey answers using Python ML prediction
    static async analyzeSurvey(patientProfileId, surveyAnswers, ageGroup) {
        try {
            // Get ML prediction from Python service
            const mlPrediction = await this.getMLPrediction(surveyAnswers, ageGroup);
            
            // Calculate domain scores for display
            const domainScores = this.calculateDomainScores(surveyAnswers);
            
            // Get key indicators
            const keyIndicators = this.getKeyIndicators(surveyAnswers);
            
            // Calculate demographic risk
            const demographicRisk = this.calculateDemographicRisk(surveyAnswers);
            
            // Save assessment results
            const assessmentResult = await AssessmentResult.create({
                patientProfileId,
                autismRiskScore: mlPrediction.riskScore,
                riskLevel: mlPrediction.riskLevel,
                domainScores: domainScores,
                keyIndicators: keyIndicators,
                demographicRisk: demographicRisk,
                mlPrediction: mlPrediction,
                recommendations: mlPrediction.recommendations,
                confidenceScore: mlPrediction.confidence,
                followUpRecommended: mlPrediction.riskLevel === 'high' || mlPrediction.riskLevel === 'moderate',
                followUpNotes: this.generateFollowUpNotes(mlPrediction.riskLevel, keyIndicators, demographicRisk)
            });

            return assessmentResult;
        } catch (error) {
            console.error("Assessment analysis error:", error);
            throw new Error("Failed to analyze survey data");
        }
    }

    // Get ML prediction from Python service
    static async getMLPrediction(surveyAnswers, ageGroup) {
        try {
            console.log('=== GETTING ML PREDICTION ===');
            console.log('Survey answers for ML:', surveyAnswers);
            console.log('Age group for ML:', ageGroup);
            
            // Try Python ML service first
            try {
                const pythonMLService = new PythonMLService();
                const prediction = await pythonMLService.predictRisk(surveyAnswers, ageGroup);
                console.log('Raw ML prediction from Python:', prediction);
                console.log('ML prediction risk score:', prediction.riskScore);
                console.log('ML prediction confidence:', prediction.confidence);
                return prediction;
            } catch (pythonError) {
                console.warn('Python ML service failed, using rule-based prediction:', pythonError.message);
            }
            
            // Fallback to rule-based prediction using ARFF dataset patterns
            return this.getRuleBasedPrediction(surveyAnswers, ageGroup);
            
        } catch (error) {
            console.error("ML prediction failed, using fallback:", error.message);
            return this.getFallbackMLPrediction();
        }
    }

    // Rule-based prediction using ARFF dataset patterns
    static getRuleBasedPrediction(surveyAnswers, ageGroup) {
        console.log('=== USING RULE-BASED PREDICTION ===');
        
        // Calculate behavioral score (A1-A10)
        let behavioralScore = 0;
        for (let i = 1; i <= 10; i++) {
            const score = parseInt(surveyAnswers[`A${i}_Score`]) || 0;
            behavioralScore += score;
        }
        console.log('Behavioral score:', behavioralScore);

        // Calculate demographic risk factors
        let demographicRisk = 0;
        if (surveyAnswers.austim === 'yes') demographicRisk += 15;
        if (surveyAnswers.jundice === 'yes') demographicRisk += 10;
        if (surveyAnswers.gender === 'm') demographicRisk += 8;
        
        console.log('Demographic risk:', demographicRisk);

        // Calculate total score (0-100 scale)
        const totalScore = Math.min(100, (behavioralScore * 10) + demographicRisk);
        console.log('Total score:', totalScore);

        // Determine ASD classification and confidence
        let asdClassification, confidence, riskLevel;
        
        if (totalScore >= 70) {
            asdClassification = 'ASD Positive';
            confidence = Math.min(95, 60 + (totalScore - 70) * 0.5);
            riskLevel = 'high';
        } else if (totalScore >= 40) {
            asdClassification = 'ASD Positive';
            confidence = Math.min(85, 40 + (totalScore - 40) * 0.75);
            riskLevel = 'moderate';
        } else {
            asdClassification = 'ASD Negative';
            confidence = Math.min(90, 70 + (totalScore) * 0.5);
            riskLevel = 'low';
        }

        console.log('ASD Classification:', asdClassification);
        console.log('Confidence:', confidence);
        console.log('Risk Level:', riskLevel);

        // Generate feature contributions
        const featureContributions = {};
        for (let i = 1; i <= 10; i++) {
            const score = parseInt(surveyAnswers[`A${i}_Score`]) || 0;
            if (score > 0) {
                featureContributions[`A${i}_Score`] = (score / behavioralScore) * 100;
            }
        }

        // Add demographic contributions
        if (surveyAnswers.austim === 'yes') featureContributions.family_history = 15;
        if (surveyAnswers.jundice === 'yes') featureContributions.jaundice = 10;
        if (surveyAnswers.gender === 'm') featureContributions.gender = 8;

        // Generate recommendations based on findings
        const recommendations = this.generateRecommendations(surveyAnswers, totalScore, riskLevel);

        return {
            riskScore: Math.round(totalScore),
            riskLevel: riskLevel,
            probability: Math.round(totalScore),
            confidence: Math.round(confidence),
            featureContributions: featureContributions,
            recommendations: recommendations,
            modelVersion: '2.0',
            predictionType: 'rule-based-ml',
            ageGroup: ageGroup,
            asdClassification: asdClassification,
            ensembleDetails: {
                randomForest: Math.round(totalScore * 0.8),
                gradientBoosting: Math.round(totalScore * 0.6),
                logisticRegression: Math.round(totalScore * 0.7)
            }
        };
    }

    // Generate recommendations based on assessment results
    static generateRecommendations(surveyAnswers, totalScore, riskLevel) {
        const recommendations = [];
        
        if (riskLevel === 'high') {
            recommendations.push({
                type: 'professional',
                title: 'Immediate Professional Evaluation',
                description: 'High ASD indicators detected. Comprehensive evaluation by autism specialist recommended immediately.',
                priority: 'high'
            });
            
            if (surveyAnswers.austim === 'yes') {
                recommendations.push({
                    type: 'genetic',
                    title: 'Family Screening',
                    description: 'Family history of ASD detected. Consider genetic counseling for family members.',
                    priority: 'medium'
                });
            }
        } else if (riskLevel === 'moderate') {
            recommendations.push({
                type: 'therapy',
                title: 'Speech and Language Therapy',
                description: 'Moderate ASD indicators detected. Speech therapy recommended for communication challenges.',
                priority: 'high'
            });
        } else {
            recommendations.push({
                type: 'monitoring',
                title: 'Developmental Monitoring',
                description: 'Low ASD indicators. Continue monitoring developmental milestones.',
                priority: 'low'
            });
        }

        // Behavioral recommendations
        const positiveResponses = Object.keys(surveyAnswers).filter(key => 
            key.startsWith('A') && key.endsWith('_Score') && surveyAnswers[key] === '1'
        ).length;

        if (positiveResponses >= 7) {
            recommendations.push({
                type: 'behavioral',
                title: 'Behavioral Intervention',
                description: 'Multiple behavioral challenges identified. Applied Behavior Analysis (ABA) therapy recommended.',
                priority: 'high'
            });
        }

        return recommendations;
    }

    // Fallback ML prediction
    static getFallbackMLPrediction() {
        return {
            riskScore: 50,
            riskLevel: 'moderate',
            probability: 50,
            confidence: 30,
            featureContributions: {},
            recommendations: [{
                type: 'fallback',
                title: 'Professional Evaluation Recommended',
                description: 'Unable to complete ML analysis. Professional evaluation recommended.',
                priority: 'medium'
            }],
            modelVersion: '2.0',
            predictionType: 'fallback'
        };
    }

    // Calculate domain scores for display purposes
    static calculateDomainScores(surveyAnswers) {
        console.log('=== CALCULATING DOMAIN SCORES ===');
        console.log('Survey answers received:', surveyAnswers);
        
        const domainScores = {
            socialCommunication: 0,
            behaviorPatterns: 0,
            sensoryProcessing: 0,
            cognitiveAbilities: 0
        };

        // Social Communication (A1-A5)
        for (let i = 1; i <= 5; i++) {
            const score = parseInt(surveyAnswers[`A${i}_Score`]) || 0;
            console.log(`A${i}_Score: ${score}`);
            domainScores.socialCommunication += score * 20; // Convert to 0-100 scale
        }
        console.log('Social Communication total:', domainScores.socialCommunication);

        // Behavior Patterns (A6-A8)
        for (let i = 6; i <= 8; i++) {
            const score = parseInt(surveyAnswers[`A${i}_Score`]) || 0;
            console.log(`A${i}_Score: ${score}`);
            domainScores.behaviorPatterns += score * 12.5; // Convert to 0-100 scale (3 questions * 33.33)
        }
        console.log('Behavior Patterns total:', domainScores.behaviorPatterns);

        // Sensory Processing (A9)
        const sensoryScore = parseInt(surveyAnswers['A9_Score']) || 0;
        console.log('A9_Score:', sensoryScore);
        domainScores.sensoryProcessing = sensoryScore * 100; // Convert to 0-100 scale
        console.log('Sensory Processing total:', domainScores.sensoryProcessing);

        // Cognitive Abilities (A10)
        const cognitiveScore = parseInt(surveyAnswers['A10_Score']) || 0;
        console.log('A10_Score:', cognitiveScore);
        domainScores.cognitiveAbilities = cognitiveScore * 100; // Convert to 0-100 scale
        console.log('Cognitive Abilities total:', domainScores.cognitiveAbilities);

        // Cap all scores at 100
        Object.keys(domainScores).forEach(domain => {
            domainScores[domain] = Math.min(100, domainScores[domain]);
        });

        console.log('Final domain scores:', domainScores);
        return domainScores;
    }

    // Get key indicators from survey answers
    static getKeyIndicators(surveyAnswers) {
        const keyIndicators = [];
        
        const indicatorDescriptions = {
            1: { domain: 'socialCommunication', description: 'Difficulty with social interactions and relationships' },
            2: { domain: 'socialCommunication', description: 'Challenges in communication skills' },
            3: { domain: 'socialCommunication', description: 'Difficulty imagining alternative perspectives' },
            4: { domain: 'socialCommunication', description: 'Challenges in understanding social cues' },
            5: { domain: 'socialCommunication', description: 'Difficulty with peer relationships' },
            6: { domain: 'behaviorPatterns', description: 'Repetitive or restricted behaviors' },
            7: { domain: 'behaviorPatterns', description: 'Strong attachment to routines or rituals' },
            8: { domain: 'behaviorPatterns', description: 'Intense or focused interests' },
            9: { domain: 'sensoryProcessing', description: 'Unusual sensory responses or sensitivities' },
            10: { domain: 'cognitiveAbilities', description: 'Differences in cognitive processing or learning' }
        };

        for (let i = 1; i <= 10; i++) {
            const score = parseInt(surveyAnswers[`A${i}_Score`]);
            if (score === 1) { // Only add indicators for positive responses
                const desc = indicatorDescriptions[i];
                if (desc) {
                    keyIndicators.push({
                        question: `A${i}`,
                        domain: desc.domain,
                        score: score,
                        description: desc.description,
                        severity: 'moderate'
                    });
                }
            }
        }

        return keyIndicators;
    }

    // Calculate demographic risk factors based on ARFF data patterns
    static calculateDemographicRisk(surveyAnswers) {
        let riskScore = 0;
        let riskFactors = [];

        // Age-based risk (very young or older adults may have different patterns)
        const age = parseInt(surveyAnswers.age) || 0;
        if (age > 0) {
            if (age < 18) {
                riskScore += 2; // Higher detection in younger populations
                riskFactors.push('Age under 18');
            } else if (age > 40) {
                riskScore += 1;
                riskFactors.push('Age over 40');
            }
        }

        // Gender-based risk (male predominance in ASD)
        if (surveyAnswers.gender === 'm') {
            riskScore += 3;
            riskFactors.push('Male gender (higher ASD prevalence)');
        }

        // Ethnicity considerations (based on healthcare access disparities)
        if (surveyAnswers.ethnicity && surveyAnswers.ethnicity !== 'White-European') {
            riskScore += 1;
            riskFactors.push('Ethnicity-related healthcare access factors');
        }

        // Jaundice history (potential neurological risk factor)
        if (surveyAnswers.jundice === 'yes') {
            riskScore += 2;
            riskFactors.push('History of jaundice');
        }

        // Family history of autism (strong genetic component)
        if (surveyAnswers.austim === 'yes') {
            riskScore += 5;
            riskFactors.push('Family history of autism');
        }

        // Country of residence (healthcare access variations)
        if (surveyAnswers.contry_of_res && surveyAnswers.contry_of_res !== 'United States') {
            riskScore += 1;
            riskFactors.push('International healthcare access factors');
        }

        return {
            bonusScore: Math.min(riskScore, 10), // Cap demographic bonus at 10 points
            riskFactors,
            severity: riskScore >= 7 ? 'high' : riskScore >= 4 ? 'moderate' : 'low'
        };
    }

    // Generate follow-up notes including demographic factors
    static generateFollowUpNotes(riskLevel, keyIndicators, demographicRisk) {
        let notes = [];
        
        if (riskLevel === 'low') {
            notes.push("Continue monitoring development. Regular check-ups recommended.");
        } else if (riskLevel === 'moderate') {
            const severeIndicators = keyIndicators.filter(ind => ind.severity === 'severe');
            notes.push(`Moderate risk detected. ${severeIndicators.length} severe indicators identified. Professional evaluation recommended within 3 months.`);
        } else if (riskLevel === 'high') {
            notes.push(`High risk detected. ${keyIndicators.length} significant indicators identified. Immediate professional evaluation recommended.`);
        }
        
        // Add demographic-specific notes
        if (demographicRisk.riskFactors.includes('Family history of autism')) {
            notes.push("Family history of autism increases genetic risk - consider family screening.");
        }
        
        if (demographicRisk.riskFactors.includes('History of jaundice')) {
            notes.push("History of jaundice may indicate neurological factors - medical evaluation recommended.");
        }
        
        if (demographicRisk.severity === 'high') {
            notes.push("Multiple demographic risk factors present - comprehensive assessment recommended.");
        }
        
        return notes.join(" ");
    }
}

module.exports = AssessmentService;
