const mongoose = require('mongoose');
const GridFSBucket = require('mongodb').GridFSBucket;
const PatientUpload = require('../models/PatientUpload');

class FileService {
    static getGridFSBucket() {
        const db = mongoose.connection.db;
        return new GridFSBucket(db, {
            bucketName: 'patientFiles'
        });
    }

    // Upload file to GridFS (MongoDB)
    static async uploadToGridFS(file, patientProfileId, fileType) {
        return new Promise((resolve, reject) => {
            const bucket = FileService.getGridFSBucket();
            const filename = `${fileType}-${Date.now()}-${file.originalname}`;
            
            const uploadStream = bucket.openUploadStream(filename, {
                metadata: {
                    patientProfileId,
                    fileType,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    uploadedAt: new Date()
                }
            });

            uploadStream.on('error', (error) => {
                reject(error);
            });

            uploadStream.on('finish', () => {
                resolve({
                    fileId: uploadStream.id,
                    filename: uploadStream.filename,
                    metadata: uploadStream.options.metadata
                });
            });

            // Pipe file buffer to GridFS
            uploadStream.end(file.buffer);
        });
    }

    // Get file from GridFS
    static async getFromGridFS(fileId) {
        return new Promise((resolve, reject) => {
            const bucket = FileService.getGridFSBucket();
            const downloadStream = bucket.openDownloadStream(fileId);
            
            const chunks = [];
            downloadStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            downloadStream.on('error', (error) => {
                reject(error);
            });

            downloadStream.on('end', () => {
                const fileBuffer = Buffer.concat(chunks);
                resolve(fileBuffer);
            });
        });
    }

    // Get file info from GridFS
    static async getFileInfo(fileId) {
        return new Promise((resolve, reject) => {
            const bucket = FileService.getGridFSBucket();
            bucket.find({ _id: fileId }).toArray((error, files) => {
                if (error) {
                    reject(error);
                } else if (files.length === 0) {
                    reject(new Error('File not found'));
                } else {
                    resolve(files[0]);
                }
            });
        });
    }

    // Delete file from GridFS
    static async deleteFromGridFS(fileId) {
        return new Promise((resolve, reject) => {
            const bucket = FileService.getGridFSBucket();
            bucket.delete(fileId, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Save file record to MongoDB
    static async saveFileRecord(patientProfileId, fileId, filename, fileType, metadata) {
        const upload = await PatientUpload.create({
            patientProfileId,
            type: fileType,
            fileUrl: `gridfs://${fileId}`, // Special URL format for GridFS
            filename,
            metadata: {
                fileId,
                ...metadata
            }
        });

        return upload;
    }

    // Get all files for a patient
    static async getPatientFiles(patientProfileId) {
        const files = await PatientUpload.find({ 
            patientProfileId 
        }).sort({ uploadedAt: -1 });

        const filesWithDetails = await Promise.all(
            files.map(async (file) => {
                if (file.fileUrl.startsWith('gridfs://')) {
                    const fileId = file.fileUrl.replace('gridfs://', '');
                    try {
                        const fileInfo = await FileService.getFileInfo(mongoose.Types.ObjectId(fileId));
                        return {
                            ...file.toObject(),
                            fileInfo: {
                                filename: fileInfo.filename,
                                length: fileInfo.length,
                                uploadDate: fileInfo.uploadDate,
                                metadata: fileInfo.metadata
                            }
                        };
                    } catch (error) {
                        return {
                            ...file.toObject(),
                            fileInfo: null,
                            error: 'File not found in GridFS'
                        };
                    }
                } else {
                    // Traditional file system storage
                    return {
                        ...file.toObject(),
                        fileInfo: {
                            filename: file.fileUrl.split('/').pop(),
                            path: file.fileUrl
                        }
                    };
                }
            })
        );

        return filesWithDetails;
    }
}

module.exports = FileService;
