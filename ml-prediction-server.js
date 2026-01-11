const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ML Prediction Endpoint
app.post('/api/predict-games', async (req, res) => {
    try {
        const { ageGroup, socialScore, behavioralScore, sensoryScore, cognitiveScore } = req.body;

        // Validate input
        if (!ageGroup || !socialScore || !behavioralScore || !sensoryScore || !cognitiveScore) {
            return res.status(400).json({
                error: 'Missing required fields: ageGroup, socialScore, behavioralScore, sensoryScore, cognitiveScore'
            });
        }

        // Validate age group
        const validAgeGroups = ['toddler', 'child', 'adolescent', 'adult'];
        if (!validAgeGroups.includes(ageGroup)) {
            return res.status(400).json({
                error: 'Invalid age group. Must be one of: toddler, child, adolescent, adult'
            });
        }

        // Call Python ML model
        const predictions = await callPythonML(ageGroup, socialScore, behavioralScore, sensoryScore, cognitiveScore);
        
        res.json({
            success: true,
            predictions: predictions,
            input: {
                ageGroup,
                scores: {
                    social: socialScore,
                    behavioral: behavioralScore,
                    sensory: sensoryScore,
                    cognitive: cognitiveScore
                }
            }
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({
            error: 'Failed to generate predictions',
            details: error.message
        });
    }
});

// Function to call Python ML model
function callPythonML(ageGroup, socialScore, behavioralScore, sensoryScore, cognitiveScore) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'predict_games.py');
        
        const pythonProcess = spawn('python', [
            pythonScript,
            ageGroup,
            socialScore.toString(),
            behavioralScore.toString(),
            sensoryScore.toString(),
            cognitiveScore.toString()
        ]);

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
                reject(new Error(`Python script exited with code ${code}: ${errorString}`));
                return;
            }

            try {
                const predictions = JSON.parse(dataString);
                resolve(predictions);
            } catch (parseError) {
                reject(new Error(`Failed to parse Python output: ${parseError.message}`));
            }
        });

        pythonProcess.on('error', (error) => {
            reject(new Error(`Failed to start Python process: ${error.message}`));
        });
    });
}

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ml-game-prediction.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'ML Game Prediction API'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ML Game Prediction Server running on http://localhost:${PORT}`);
    console.log(`📊 Open http://localhost:${PORT} to use the prediction interface`);
});

module.exports = app;
