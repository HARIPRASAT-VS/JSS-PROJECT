const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    year: { 
        type: String, 
        required: true 
    }, // e.g., "1st Year", "2nd Year"
    facultyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    students: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
