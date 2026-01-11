// Machine Learning Model for Game Prediction Based on 4-Factor Assessment
// Uses neural network approach for personalized game recommendations

class GamePredictionML {
    constructor() {
        this.model = null;
        this.isTraining = false;
        this.isTrained = false;
        this.trainingData = [];
        this.features = ['age', 'socialCommunication', 'behavioralPatterns', 'sensoryProcessing', 'cognitiveAbilities'];
        this.labels = [];
        this.gameMapping = new Map();
        this.domainMapping = {
            'SocialCommunication': 0,
            'BehavioralPatterns': 1,
            'SensoryProcessing': 2,
            'CognitiveAbilities': 3,
            'CrossDomain': 4
        };
    }

    // Load and prepare training data from CSV
    async loadTrainingData() {
        try {
            console.log('Loading training data from enhanced CSV...');
            const response = await fetch('personalized-games-dataset-enhanced.csv');
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            
            // Process and structure training data
            this.trainingData = this.processTrainingData(data);
            console.log('Training data loaded:', this.trainingData.length, 'samples');
            
            return true;
        } catch (error) {
            console.error('Error loading training data:', error);
            return false;
        }
    }

    // Parse CSV data
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });
                data.push(entry);
            }
        }
        return data;
    }

    // Parse CSV line handling commas
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    // Process raw CSV data into training format
    processTrainingData(data) {
        const processed = [];
        const gameIndexMap = new Map();
        let gameIndex = 0;

        data.forEach(entry => {
            // Create game mapping
            const gameKey = `${entry.PriorityDomain}_${entry.Difficulty}_${entry.AgeGroup}`;
            if (!gameIndexMap.has(gameKey)) {
                gameIndexMap.set(gameKey, gameIndex);
                this.gameMapping.set(gameIndex, {
                    id: entry.GameID,
                    name: entry.GameName,
                    type: entry.GameType,
                    difficulty: entry.Difficulty,
                    domain: entry.PriorityDomain,
                    ageGroup: entry.AgeGroup,
                    icon: entry.Icon,
                    description: entry.PersonalizedDescription,
                    skills: entry.Skills.split('|'),
                    recommendedTime: entry.RecommendedTime,
                    targetScore: entry.TargetScore,
                    priority: parseInt(entry.Priority)
                });
                gameIndex++;
            }

            // Extract features
            const features = [
                parseInt(entry.Age),
                parseInt(entry.SocialCommunicationScore),
                parseInt(entry.BehavioralPatternsScore),
                parseInt(entry.SensoryProcessingScore),
                parseInt(entry.CognitiveAbilitiesScore)
            ];

            // Normalize features (0-1 range)
            const normalizedFeatures = this.normalizeFeatures(features);

            // Create label (one-hot encoded for game category)
            const label = gameIndexMap.get(gameKey);
            
            processed.push({
                features: normalizedFeatures,
                label: label,
                domainScore: parseInt(entry[entry.PriorityDomain + 'Score']),
                priority: parseInt(entry.Priority),
                userId: entry.UserID,
                userName: entry.UserName
            });
        });

        this.labels = Array.from(gameIndexMap.keys());
        console.log('Game categories created:', this.labels.length);
        return processed;
    }

    // Normalize features to 0-1 range
    normalizeFeatures(features) {
        return [
            features[0] / 35,  // age (normalized to max 35)
            features[1] / 100, // social communication
            features[2] / 100, // behavioral patterns
            features[3] / 100, // sensory processing
            features[4] / 100  // cognitive abilities
        ];
    }

    // Create and train the neural network model
    async createModel() {
        console.log('Creating ML model...');
        
        // Simple neural network architecture
        const model = {
            layers: [
                { inputSize: 5, outputSize: 16, activation: 'relu' },
                { inputSize: 16, outputSize: 8, activation: 'relu' },
                { inputSize: 8, outputSize: this.labels.length, activation: 'softmax' }
            ],
            weights: [],
            biases: []
        };

        // Initialize weights and biases
        for (let i = 0; i < model.layers.length; i++) {
            const layer = model.layers[i];
            const weights = [];
            const biases = [];
            
            for (let j = 0; j < layer.outputSize; j++) {
                const weightRow = [];
                for (let k = 0; k < layer.inputSize; k++) {
                    weightRow.push((Math.random() - 0.5) * 0.5); // Small random weights
                }
                weights.push(weightRow);
                biases.push((Math.random() - 0.5) * 0.5);
            }
            
            model.weights.push(weights);
            model.biases.push(biases);
        }

        this.model = model;
        console.log('Model created with', this.labels.length, 'output categories');
        return model;
    }

    // Activation functions
    relu(x) {
        return Math.max(0, x);
    }

    softmax(arr) {
        const max = Math.max(...arr);
        const exp = arr.map(x => Math.exp(x - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(x => x / sum);
    }

    // Forward pass through the network
    forward(features) {
        if (!this.model) return null;

        let current = features;
        
        for (let i = 0; i < this.model.layers.length; i++) {
            const layer = this.model.layers[i];
            const weights = this.model.weights[i];
            const biases = this.model.biases[i];
            
            const next = [];
            for (let j = 0; j < layer.outputSize; j++) {
                let sum = biases[j];
                for (let k = 0; k < layer.inputSize; k++) {
                    sum += current[k] * weights[j][k];
                }
                
                if (layer.activation === 'relu') {
                    next.push(this.relu(sum));
                } else if (layer.activation === 'softmax') {
                    // We'll apply softmax after calculating all outputs
                    next.push(sum);
                }
            }
            
            if (layer.activation === 'softmax') {
                current = this.softmax(next);
            } else {
                current = next;
            }
        }
        
        return current;
    }

    // Train the model using gradient descent
    async train(epochs = 100, learningRate = 0.01) {
        if (this.isTraining) return;
        if (this.trainingData.length === 0) {
            console.error('No training data available');
            return false;
        }

        this.isTraining = true;
        console.log('Training model for', epochs, 'epochs...');

        await this.createModel();

        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalLoss = 0;
            
            // Shuffle training data
            const shuffled = [...this.trainingData].sort(() => Math.random() - 0.5);
            
            for (const sample of shuffled) {
                // Forward pass
                const predictions = this.forward(sample.features);
                
                // Calculate loss (cross-entropy)
                const target = new Array(this.labels.length).fill(0);
                target[sample.label] = 1;
                
                let loss = 0;
                for (let i = 0; i < predictions.length; i++) {
                    loss -= target[i] * Math.log(predictions[i] + 1e-10);
                }
                totalLoss += loss;
                
                // Simple gradient descent (simplified for demonstration)
                this.updateWeights(sample.features, target, predictions, learningRate);
            }
            
            if (epoch % 10 === 0) {
                console.log(`Epoch ${epoch}: Loss = ${(totalLoss / this.trainingData.length).toFixed(4)}`);
            }
        }

        this.isTrained = true;
        this.isTraining = false;
        console.log('Training completed!');
        return true;
    }

    // Simplified weight update (gradient descent)
    updateWeights(features, target, predictions, learningRate) {
        // This is a simplified version - in practice you'd use backpropagation
        for (let i = 0; i < this.model.weights.length; i++) {
            const layer = this.model.weights[i];
            for (let j = 0; j < layer.length; j++) {
                for (let k = 0; k < layer[j].length; k++) {
                    const error = predictions[j] - target[j];
                    const gradient = error * (k < features.length ? features[k] : 1);
                    layer[j][k] -= learningRate * gradient;
                }
            }
        }
    }

    // Predict games for a given assessment
    predict(assessment, age) {
        if (!this.isTrained) {
            console.warn('Model not trained yet');
            return [];
        }

        // Prepare input features
        const features = this.normalizeFeatures([
            age,
            assessment.domainScores?.socialCommunication || 0,
            assessment.domainScores?.behavioralPatterns || 0,
            assessment.domainScores?.sensoryProcessing || 0,
            assessment.domainScores?.cognitiveAbilities || 0
        ]);

        // Get predictions
        const predictions = this.forward(features);
        
        // Sort by probability and get top recommendations
        const sortedPredictions = predictions
            .map((prob, index) => ({ index, probability: prob }))
            .sort((a, b) => b.probability - a.probability);

        // Convert to game recommendations
        const recommendations = [];
        const ageGroup = this.getAgeGroup(age);
        
        for (let i = 0; i < Math.min(6, sortedPredictions.length); i++) {
            const pred = sortedPredictions[i];
            const gameInfo = this.gameMapping.get(pred.index);
            
            if (gameInfo && gameInfo.ageGroup === ageGroup) {
                recommendations.push({
                    ...gameInfo,
                    confidence: pred.probability,
                    predictedDifficulty: this.predictDifficulty(assessment, gameInfo.domain),
                    domainScore: assessment.domainScores?.[this.getDomainKey(gameInfo.domain)] || 0
                });
            }
        }

        return recommendations;
    }

    // Predict difficulty level based on scores
    predictDifficulty(assessment, domain) {
        const score = assessment.domainScores?.[this.getDomainKey(domain)] || 0;
        if (score < 40) return 'beginner';
        if (score < 60) return 'intermediate';
        return 'advanced';
    }

    // Get domain key from domain name
    getDomainKey(domainName) {
        const keyMap = {
            'SocialCommunication': 'socialCommunication',
            'BehavioralPatterns': 'behavioralPatterns',
            'SensoryProcessing': 'sensoryProcessing',
            'CognitiveAbilities': 'cognitiveAbilities'
        };
        return keyMap[domainName] || 'cognitiveAbilities';
    }

    // Get age group from age
    getAgeGroup(age) {
        if (age < 5) return 'toddler';
        if (age < 13) return 'child';
        if (age < 18) return 'adolescent';
        return 'adult';
    }

    // Get model accuracy
    evaluate() {
        if (!this.isTrained || this.trainingData.length === 0) {
            return { accuracy: 0, details: 'Model not trained' };
        }

        let correct = 0;
        let total = 0;

        for (const sample of this.trainingData) {
            const predictions = this.forward(sample.features);
            const predicted = predictions.indexOf(Math.max(...predictions));
            
            if (predicted === sample.label) {
                correct++;
            }
            total++;
        }

        const accuracy = (correct / total) * 100;
        console.log(`Model accuracy: ${accuracy.toFixed(2)}% (${correct}/${total})`);
        
        return { accuracy, correct, total };
    }

    // Save model to localStorage
    saveModel() {
        if (!this.isTrained) return false;
        
        const modelData = {
            model: this.model,
            gameMapping: Array.from(this.gameMapping.entries()),
            labels: this.labels,
            isTrained: true
        };
        
        localStorage.setItem('gamePredictionML', JSON.stringify(modelData));
        console.log('Model saved to localStorage');
        return true;
    }

    // Load model from localStorage
    loadModel() {
        try {
            const modelData = localStorage.getItem('gamePredictionML');
            if (!modelData) return false;
            
            const parsed = JSON.parse(modelData);
            this.model = parsed.model;
            this.gameMapping = new Map(parsed.gameMapping);
            this.labels = parsed.labels;
            this.isTrained = parsed.isTrained;
            
            console.log('Model loaded from localStorage');
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            return false;
        }
    }
}

// Global instance
window.gamePredictionML = new GamePredictionML();
