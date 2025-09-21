const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // ✅ BCRYPT IS IMPORTED HERE

// This is a comprehensive profile schema to store all user inputs.
const ProfileSchema = new mongoose.Schema({
    education: { type: String },
    stream: { type: String },
    certs: { type: String },
    interests: { type: String },
    admires: { type: String },
    work_pace: { type: String, enum: ['fast', 'steady'] },
    risk_tolerance: { type: String, enum: ['startup', 'stable_company'] },
    skills: [String],
    project: { type: String },
    industries: { type: String },
    motivation: { type: String, enum: ['impact', 'growth', 'balance'] },
    resume: { type: Buffer },
    aiAnalysis: { type: Object }
});

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        select: false // ✅ Hide password from default queries for security
    },
    hasCompletedProfile: { // 🚀 ADD THIS FLAG
        type: Boolean,
        default: false
    },

    profile: ProfileSchema
}, { timestamps: true });

// --- PASSWORD HASHING FUNCTION ---
// This function will run automatically before any User document is saved.
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', UserSchema);
