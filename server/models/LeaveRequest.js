const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        required: true,
        enum: ['Sick Leave', 'Emergency Leave', 'Leave', 'On Duty']
    },
    attendancePercentageSnapshot: { type: Number },
    startDate: { type: Date,   required: true },
    endDate:   { type: Date,   required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime:   { type: String, required: true }, // e.g. "17:00"
    reason: { type: String, required: true },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Approved', 'Rejected']
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
