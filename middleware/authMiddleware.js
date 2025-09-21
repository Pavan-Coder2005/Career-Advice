const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, msg: 'Not authorized, no token' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find the user by the ID from the token, excluding the password
        req.user = await User.findById(decoded.id).select('-password');
        
        // --- CRITICAL FIX ---
        // If, for any reason, the user is not found in the database, stop the request.
        if (!req.user) {
            return res.status(401).json({ success: false, msg: 'Not authorized, user not found' });
        }
        
        // If everything is successful, proceed to the next middleware (upload)
        next();
    } catch (err) {
        // This will catch expired tokens, invalid tokens, etc.
        return res.status(401).json({ success: false, msg: 'Not authorized, token failed' });
    }
};