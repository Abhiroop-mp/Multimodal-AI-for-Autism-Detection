const express = require("express");
const router = express.Router();

console.log('=== MINIMAL PATIENT ROUTES FILE LOADED ===');

// Simple test route
router.get('/test-minimal', (req, res) => {
    console.log('=== MINIMAL TEST ROUTE CALLED ===');
    res.json({ message: 'Minimal patient route works!' });
});

// Check email route
router.get('/check-email', (req, res) => {
    console.log('=== MINIMAL CHECK EMAIL ROUTE CALLED ===');
    res.json({ exists: false, message: 'Email is available (minimal)' });
});

// Cleanup duplicates route
router.post('/cleanup-duplicates', (req, res) => {
    console.log('=== MINIMAL CLEANUP ROUTE CALLED ===');
    res.json({ message: 'Cleanup route works (minimal)', totalRemoved: 0 });
});

module.exports = router;

console.log('=== MINIMAL PATIENT ROUTES MODULE EXPORTED ===');
