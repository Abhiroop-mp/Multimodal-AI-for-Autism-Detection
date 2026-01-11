const mongoose = require("mongoose");

const patientProfileSchema = new mongoose.Schema({
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    patientEmail: {
        type: String,
        required: true,
        lowercase: true
    },

    patientName: {
        type: String,
        required: true
    },
    age: { type: Number, required: true },
    ageUnit: { type: String, enum: ["months", "years"], required: true },
    ageGroup: {
        type: String,
        enum: ["toddler", "child", "adolescent", "adult"],
        required: true
    },
    linkedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null // filled when patient actually registers
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("PatientProfile", patientProfileSchema);
