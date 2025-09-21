const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require('../models/User');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password || password.length < 6) {
            return res.status(400).json({ msg: "Please provide a valid email and a password of at least 6 characters." });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: "User with this email already exists." });
        }

        // Create a new user instance (password will be hashed by the pre-save hook in the User model)
        const newUser = new User({ email, password });
        await newUser.save();

        // --- THIS IS THE KEY CHANGE ---
        // Send a success response WITHOUT a token.
        res.status(201).json({
            success: true,
            msg: "User registered successfully. Please log in."
        });
        
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ msg: "Server error" });
    }
};
module.exports=register;