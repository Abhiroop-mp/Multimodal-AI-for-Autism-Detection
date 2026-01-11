const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// MongoDB
mongoose.connect('mongodb://localhost:27017/asd-detection')
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.log('❌ MongoDB connection error:', err));

// Email validation endpoint
app.get('/api/check-email-working', async (req, res) => {
    try {
        console.log('=== EMAIL CHECK WORKING ===');
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                message: 'Email parameter is required'
            });
        }

        const PatientProfile = require('./models/PatientProfile');
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

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Email server is working!' });
});

// Start server on different port
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`🚀 Email validation server running on port ${PORT}`);
});
