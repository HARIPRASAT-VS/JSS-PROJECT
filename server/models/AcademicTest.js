const mongoose = require('mongoose');

const academicTestSchema = new mongoose.Schema({
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: String, required: true },
    testType: { 
        type: String, 
        enum: ['TESTMARK', 'SEM RESULT', 'INTERNAL MARK'], 
        required: true 
    },
    testName: { type: String, required: true },
    subject: { type: String },
    totalMarks: { type: Number, required: true },
    scores: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        marks: {
            value: { type: Number, default: null },
            isAbsent: { type: Boolean, default: false }
        },
        parentViewed: {
            viewed: { type: Boolean, default: false },
            viewedAt: { type: Date }
        }
    }]
}, { timestamps: true });

// Optimizations
academicTestSchema.index({ facultyId: 1, testType: 1 });
academicTestSchema.index({ facultyId: 1, _id: 1 });
academicTestSchema.index({ facultyId: 1, testType: 1, assignedTo: 1, testName: 1 }, { unique: true });

module.exports = mongoose.model('AcademicTest', academicTestSchema);
