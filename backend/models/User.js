const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userType: {
        type: String,
        required: true,
        enum: ['patient', 'parent']
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    parentOf: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    managedBy: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);