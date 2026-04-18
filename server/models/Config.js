const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    collegeLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        radiusMeters: { type: Number, default: 500 }
    },
    otpWindow: {
        startTime: { type: String, default: '20:00' }, // 24hr format
        durationMinutes: { type: Number, default: 60 } // Valid until 21:00
    },
    notificationTime: { type: String, default: '19:50' }
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);
