const mongoose = require("mongoose");

const patientUploadSchema = new mongoose.Schema({
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientProfile",
    required: true
  },

  type: {
    type: String,
    enum: ["photo", "video", "xray", "prescription"],
    required: true
  },

  fileUrl: {
    type: String,
    required: true
  },

  filename: {
    type: String,
    required: false // Optional for GridFS
  },

  storageType: {
    type: String,
    enum: ["filesystem", "gridfs"],
    default: "filesystem"
  },

  metadata: {
    fileId: mongoose.Schema.Types.ObjectId, // GridFS file ID
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: Date
  },

  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("PatientUpload", patientUploadSchema);
