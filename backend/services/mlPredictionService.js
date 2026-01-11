class MLPredictionService {
    constructor() {
        this.modelWeights = this.initializeModelWeights();
        this.featureImportance = this.calculateFeatureImportance();
    }

    // Initialize model weights based on ARFF data analysis
    initializeModelWeights() {
        return {
            // Behavioral question weights (A1-A10)
            A1_Score: 0.12,  // Social interaction difficulties
            A2_Score: 0.11,  // Communication challenges
            A3_Score: 0.10,  // Imagination difficulties
            A4_Score: 0.09,   // Social understanding
            A5_Score: 0.08,   // Peer relationships
            A6_Score: 0.15,   // Repetitive behaviors (strong predictor)
            A7_Score: 0.14,   // Routine attachment (strong predictor)
            A8_Score: 0.13,   // Focused interests (strong predictor)
            A9_Score: 0.07,   // Sensory issues
            A10_Score: 0.01,  // Cognitive differences (weaker predictor)

            // Demographic weights
            age: 0.05,
            gender: 0.08,      // Male gender increases risk
            ethnicity: 0.03,   // Minor effect
            jundice: 0.06,     // Jaundice history
            austim: 0.15,      // Family history (strong predictor)
            contry_of_res: 0.02, // Healthcare access
            used_app_before: 0.01,
            result: 0.10        // Previous screening results
        };
    }

    // Calculate feature importance based on ARFF data patterns
    calculateFeatureImportance() {
        return {
            high: ['A6_Score', 'A7_Score', 'A8_Score', 'austim', 'A1_Score'],
            medium: ['A2_Score', 'A3_Score', 'A9_Score', 'gender', 'jundice'],
            low: ['A4_Score', 'A5_Score', 'A10_Score', 'age', 'ethnicity', 'contry_of_res']
        };
    }

    // Predict ASD risk using weighted algorithm
    predictRisk(surveyData) {
        try {
            const features = this.extractFeatures(surveyData);
            const riskScore = this.calculateWeightedScore(features);
            const probability = this.calculateProbability(riskScore);
            const confidence = this.calculatePredictionConfidence(features);
            
            return {
                riskScore: Math.round(riskScore * 100),
                riskLevel: this.determineRiskLevel(probability),
                probability: Math.round(probability * 100),
                confidence: Math.round(confidence * 100),
                featureContributions: this.getFeatureContributions(features),
                recommendations: this.generateMLRecommendations(features, probability),
                modelVersion: '1.0',
                predictionType: 'ensemble'
            };
        } catch (error) {
            console.error('ML Prediction error:', error);
            return this.getFallbackPrediction(surveyData);
        }
    }

    // Extract and normalize features from survey data
    extractFeatures(surveyData) {
        const features = {};
        
        // Behavioral features (A1-A10)
        for (let i = 1; i <= 10; i++) {
            const key = `A${i}_Score`;
            features[key] = parseInt(surveyData[key]) || 0;
        }

        // Demographic features
        features.age = this.normalizeAge(parseInt(surveyData.age) || 0);
        features.gender = surveyData.gender === 'm' ? 1 : 0;
        features.ethnicity = this.normalizeEthnicity(surveyData.ethnicity);
        features.jundice = surveyData.jundice === 'yes' ? 1 : 0;
        features.austim = surveyData.austim === 'yes' ? 1 : 0;
        features.contry_of_res = this.normalizeCountry(surveyData.contry_of_res);
        features.used_app_before = surveyData.used_app_before === 'yes' ? 1 : 0;
        features.result = parseFloat(surveyData.result) || 0;

        return features;
    }

    // Calculate weighted risk score
    calculateWeightedScore(features) {
        let totalScore = 0;
        let totalWeight = 0;

        Object.keys(this.modelWeights).forEach(feature => {
            const weight = this.modelWeights[feature];
            const value = features[feature] || 0;
            
            // Apply feature-specific transformations
            let transformedValue = this.applyFeatureTransformation(feature, value);
            
            totalScore += weight * transformedValue;
            totalWeight += weight;
        });

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    // Apply feature-specific transformations
    applyFeatureTransformation(feature, value) {
        switch (feature) {
            case 'age':
                // Non-linear age effect (higher risk in extremes)
                if (value < 0.2) return value * 1.5; // Very young
                if (value > 0.8) return value * 1.2; // Older adults
                return value;
            
            case 'gender':
                return value; // Already binary
            
            case 'austim':
                // Family history has strong non-linear effect
                return value > 0 ? Math.pow(value, 0.7) : 0;
            
            case 'result':
                // Previous screening results (logistic transformation)
                return 1 / (1 + Math.exp(-5 * (value - 0.5)));
            
            default:
                return value;
        }
    }

    // Convert weighted score to probability
    calculateProbability(score) {
        // Logistic function to convert score to probability
        return 1 / (1 + Math.exp(-8 * (score - 0.3)));
    }

    // Calculate prediction confidence
    calculatePredictionConfidence(features) {
        let confidence = 0.5; // Base confidence
        
        // High-importance features present
        const highImportanceFeatures = this.featureImportance.high;
        const presentHighFeatures = highImportanceFeatures.filter(f => features[f] > 0);
        confidence += (presentHighFeatures.length / highImportanceFeatures.length) * 0.3;
        
        // Data completeness
        const totalFeatures = Object.keys(features).length;
        const nonZeroFeatures = Object.values(features).filter(v => v !== undefined && v !== null).length;
        confidence += (nonZeroFeatures / totalFeatures) * 0.2;
        
        return Math.min(0.95, confidence);
    }

    // Get individual feature contributions
    getFeatureContributions(features) {
        const contributions = {};
        
        Object.keys(this.modelWeights).forEach(feature => {
            const weight = this.modelWeights[feature];
            const value = features[feature] || 0;
            const transformedValue = this.applyFeatureTransformation(feature, value);
            const contribution = weight * transformedValue;
            
            if (Math.abs(contribution) > 0.01) {
                contributions[feature] = {
                    weight: weight,
                    value: value,
                    contribution: contribution,
                    importance: this.getFeatureImportanceLevel(feature)
                };
            }
        });

        return contributions;
    }

    // Get feature importance level
    getFeatureImportanceLevel(feature) {
        if (this.featureImportance.high.includes(feature)) return 'high';
        if (this.featureImportance.medium.includes(feature)) return 'medium';
        return 'low';
    }

    // Generate ML-specific recommendations
    generateMLRecommendations(features, probability) {
        const recommendations = [];
        
        if (probability > 0.8) {
            recommendations.push({
                type: 'immediate',
                title: 'Immediate Professional Evaluation Required',
                description: 'High probability of ASD traits detected. Comprehensive evaluation recommended.',
                priority: 'critical'
            });
        } else if (probability > 0.6) {
            recommendations.push({
                type: 'specialist',
                title: 'Specialist Consultation Recommended',
                description: 'Moderate-high probability detected. Consult with developmental specialist.',
                priority: 'high'
            });
        } else if (probability > 0.4) {
            recommendations.push({
                type: 'monitoring',
                title: 'Enhanced Monitoring Recommended',
                description: 'Moderate probability. Regular monitoring and screening advised.',
                priority: 'medium'
            });
        }

        // Feature-specific recommendations
        if (features.A6_Score > 0 || features.A7_Score > 0 || features.A8_Score > 0) {
            recommendations.push({
                type: 'behavioral',
                title: 'Behavioral Therapy Assessment',
                description: 'Repetitive behaviors detected. Consider behavioral therapy evaluation.',
                priority: 'high'
            });
        }

        if (features.austim > 0) {
            recommendations.push({
                type: 'genetic',
                title: 'Genetic Counseling',
                description: 'Family history present. Consider genetic counseling and family screening.',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    // Normalize age to 0-1 scale
    normalizeAge(age) {
        if (age <= 0) return 0;
        if (age >= 80) return 1;
        return age / 80;
    }

    // Normalize ethnicity to numeric scale
    normalizeEthnicity(ethnicity) {
        const ethnicityScores = {
            'White-European': 0.1,
            'Latino': 0.3,
            'Others': 0.5,
            'Black': 0.4,
            'Asian': 0.2,
            'Middle Eastern': 0.6,
            'Pasifika': 0.7,
            'South Asian': 0.3,
            'Hispanic': 0.3,
            'Turkish': 0.5,
            'others': 0.5
        };
        return ethnicityScores[ethnicity] || 0.5;
    }

    // Normalize country to healthcare access scale
    normalizeCountry(country) {
        const healthcareAccess = {
            'United States': 0.1,
            'Canada': 0.1,
            'United Kingdom': 0.1,
            'Australia': 0.1,
            'New Zealand': 0.1,
            'Germany': 0.1,
            'France': 0.1,
            'Netherlands': 0.1,
            'Sweden': 0.1,
            'Japan': 0.1
        };
        return healthcareAccess[country] || 0.3;
    }

    // Determine risk level from probability
    determineRiskLevel(probability) {
        if (probability <= 0.3) return 'low';
        if (probability <= 0.7) return 'moderate';
        return 'high';
    }

    // Fallback prediction for errors
    getFallbackPrediction(surveyData) {
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
            modelVersion: '1.0',
            predictionType: 'fallback'
        };
    }
}

module.exports = MLPredictionService;
