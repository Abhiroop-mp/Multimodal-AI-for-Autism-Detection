const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Add patient to parent
router.post('/add-patient', async (req, res) => {
    try {
        const { parentEmail, patientEmail } = req.body;
        
        const parent = await User.findOne({ email: parentEmail, userType: 'parent' });
        const patient = await User.findOne({ email: patientEmail, userType: 'patient' });
        
        if (!parent || !patient) {
            return res.status(404).json({ message: 'Parent or patient not found' });
        }
        
        // Add patient to parent's list
        if (!parent.parentOf.includes(patient._id)) {
            parent.parentOf.push(patient._id);
            await parent.save();
        }
        
        // Add parent to patient's list  
        if (!patient.managedBy.includes(parent._id)) {
            patient.managedBy.push(parent._id);
            await patient.save();
        }
        
        res.json({ message: 'Patient added to parent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all patients for a parent
router.get('/parent-patients/:parentId', async (req, res) => {
    try {
        const parent = await User.findById(req.params.parentId)
            .populate('parentOf', 'name email phone createdAt');
        
        res.json(parent.parentOf);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all parents for a patient
router.get('/patient-parents/:patientId', async (req, res) => {
    try {
        const patient = await User.findById(req.params.patientId)
            .populate('managedBy', 'name email phone');
        
        res.json(patient.managedBy);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;