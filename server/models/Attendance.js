const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkIn: { type: Date, default: Date.now },
    checkOut: { type: Date },
    otpUsed: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        isValid: { type: Boolean, default: false }
    },
    status: { type: String, enum: ['Present', 'Late', 'Absent'], default: 'Present' },
    isActive: { type: Boolean, default: true },
    subject: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
