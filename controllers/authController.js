
const jwt = require("jsonwebtoken");
 const bcrypt = require("bcryptjs");
const User=require('../models/User');
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Check for email and password
        if (!email || !password) {
            return res.status(400).json({ success: false, msg: 'Please provide an email and password' });
        }

        // 2. Check for user in the database
        const user = await User.findOne({ email }).select('+password'); // Explicitly select the password

        if (!user) {
            return res.status(401).json({ success: false, msg: 'Invalid credentials' });
        }

        // 3. Compare the submitted password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Important: Use a generic error for security to prevent user enumeration
            return res.status(401).json({ success: false, msg: 'Invalid credentials' });
        }

        // 4. User is valid, create a token (JWT)
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1d' // Token expires in 1 day
        });

        res.status(200).json({
            success: true,
            msg: 'Logged in successfully',
            token: token ,
            userId: user._id   // ✅ add this
});


    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
module.exports=login;