const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() { return !this.googleId; } },
    googleId: { type: String },
    resetOTP: { type: String },
    otpExpiry: { type: Date },
    role: { type: String, enum: ['student', 'faculty', 'admin', 'parent'], default: 'student' },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For students
    warningCount: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    totalBlockCount: { type: Number, default: 0 },
    fcmToken: { type: String },
    parents: {
        type: [{
            name: { type: String, required: true },
            email: { type: String, required: true, match: [/.+\@.+\..+/, 'Please fill a valid email address'] }
        }],
        validate: { validator: v => v.length <= 2, message: 'Maximum 2 parents allowed' }
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
