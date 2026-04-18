const mongoose = require('mongoose');

const yearRegistrySchema = new mongoose.Schema({
    year: {
        type: String,
        required: true,
        unique: true  // One document per year e.g. "1st Year"
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    faculties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('YearRegistry', yearRegistrySchema);
