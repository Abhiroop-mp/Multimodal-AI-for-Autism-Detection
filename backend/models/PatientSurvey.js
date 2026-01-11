const mongoose = require("mongoose");

const patientSurveySchema = new mongoose.Schema({
    patientProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientProfile",
        required: true
    },

    answers: {
        type: Object, // flexible for now
        required: true
    },
    ageGroup: {
        type: String,
        enum: ["toddler", "child", "adolescent", "adult"],
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("PatientSurvey", patientSurveySchema);
