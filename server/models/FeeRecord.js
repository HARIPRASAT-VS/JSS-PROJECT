const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    college: {
        total: { type: Number, default: 0 },
        paid: { type: Number, default: 0 }
    },
    hostel: {
        total: { type: Number, default: 0 },
        paid: { type: Number, default: 0 }
    },
    mess: {
        total: { type: Number, default: 0 },
        paid: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Virtual for dynamic balance calculation
feeRecordSchema.virtual('collegeBalance').get(function() { return this.college.total - this.college.paid; });
feeRecordSchema.virtual('hostelBalance').get(function() { return this.hostel.total - this.hostel.paid; });
feeRecordSchema.virtual('messBalance').get(function() { return this.mess.total - this.mess.paid; });
feeRecordSchema.virtual('totalPending').get(function() { 
    return (this.college.total - this.college.paid) + 
           (this.hostel.total - this.hostel.paid) + 
           (this.mess.total - this.mess.paid); 
});

feeRecordSchema.set('toJSON', { virtuals: true });
feeRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
