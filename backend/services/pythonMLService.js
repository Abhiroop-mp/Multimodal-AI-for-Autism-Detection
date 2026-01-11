const { spawn } = require('child_process');
const path = require('path');

class PythonMLService {
    constructor() {
        this.pythonScript = path.join(__dirname, 'ml_predictor.py');
    }

    async predictRisk(surveyData, ageGroup = 'child') {
        try {
            console.log('Python ML prediction input:', { surveyData, ageGroup });

            return new Promise((resolve, reject) => {
                const pythonProcess = spawn('python', [this.pythonScript, 'predict', JSON.stringify(surveyData), ageGroup]);
                
                let dataString = '';
                let errorString = '';

                pythonProcess.stdout.on('data', (data) => {
                    dataString += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    errorString += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error('Python ML error:', errorString);
                        reject(new Error(`Python script exited with code ${code}: ${errorString}`));
                        return;
                    }

                    try {
                        const result = JSON.parse(dataString);
                        console.log('Python ML prediction result:', result);
                        resolve(result);
                    } catch (parseError) {
                        console.error('Failed to parse Python output:', parseError);
                        console.error('Raw output:', dataString);
                        reject(new Error(`Failed to parse Python output: ${parseError.message}`));
                    }
                });

                pythonProcess.on('error', (error) => {
                    console.error('Python process error:', error);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('Python ML service error:', error);
            return this.getFallbackPrediction();
        }
    }

    getFallbackPrediction() {
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

    async trainModels() {
        try {
            console.log('Training Python ML models...');

            return new Promise((resolve, reject) => {
                const pythonProcess = spawn('python', [this.pythonScript, 'train']);
                
                let outputString = '';
                let errorString = '';

                pythonProcess.stdout.on('data', (data) => {
                    outputString += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    errorString += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error('Python training error:', errorString);
                        reject(new Error(`Training failed with code ${code}: ${errorString}`));
                        return;
                    }

                    console.log('Python training output:', outputString);
                    resolve({ success: true, message: 'Models trained successfully' });
                });

                pythonProcess.on('error', (error) => {
                    console.error('Python training process error:', error);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('Training error:', error);
            throw error;
        }
    }
}

module.exports = PythonMLService;
