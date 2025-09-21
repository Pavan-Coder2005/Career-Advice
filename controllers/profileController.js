const User = require('../models/User');
const { analysisQueue } = require('../queue');

// --- NEW FUNCTION TO CHECK PROFILE STATUS ---
exports.getProfileStatus = async (req, res) => {
    try {
        // req.user is already attached by the 'protect' middleware.
        // We check if the aiAnalysis object exists and is not empty.
        const profile = req.user.profile;
        const hasCompletedProfile = !!(profile && profile.aiAnalysis && Object.keys(profile.aiAnalysis).length > 0);

        res.status(200).json({ success: true, hasCompletedProfile });
    } catch (err) {
        console.error("Get profile status error:", err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// This is your existing submitProfile function (no changes needed)
exports.submitProfile = async (req, res) => {
    // ... your existing code
    try {
        const userId = req.user.id;
        const profileData = req.body;
        if (profileData.skills) {
            profileData.skills = profileData.skills.split(',').map(skill => skill.trim());
        }
        if (req.file) {
            profileData.resume = req.file.buffer;
        }
        const user = await User.findByIdAndUpdate(userId, { $set: { profile: profileData } }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }
        await analysisQueue.add('analyze-profile', { userId: user.id });
        res.status(202).json({ success: true, msg: 'Profile received. Analysis is in progress.' });
    } catch (err) {
        console.error("Profile submission error:", err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// This is your existing getMyProfile function (no changes needed)
exports.getMyProfile = async (req, res) => {
    // ... your existing code
    try {
        const user = await User.findById(req.user.id).select('-profile.resume');
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};