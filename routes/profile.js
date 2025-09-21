const express = require('express');
const router = express.Router();
// Import the new controller function
const { submitProfile, getMyProfile, getProfileStatus } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- NEW ROUTE ---
// Checks if the logged-in user has a completed profile analysis
router.get('/status', protect, getProfileStatus);

// Your existing routes
router.post('/submit', protect, upload, submitProfile);
router.get('/me', protect, getMyProfile);

module.exports = router;