const mongoose = require('mongoose');

const blockRequestSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proofImageUrl: { type: String, required: true }, // Cloudinary URL
    reason: { type: String, required: true },
    facultyVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    adminComment: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BlockRequest', blockRequestSchema);
