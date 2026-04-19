const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate JWT — include role and email so middleware can check permissions without extra DB calls
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, fcmToken } = req.body;
        const userExists = await User.findOne({ email });
        let userRole = role || 'student';
        if (email.toLowerCase() === 'harivelmani@gmail.com' || email.toLowerCase() === 'harivelamani@gmail.com') {
            userRole = 'admin';
        }

        const user = await User.create({ firstName, lastName, email, password, role: userRole, fcmToken });
        res.status(201).json({ 
            _id: user._id, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email, 
            role: user.role,
            token: generateToken(user) 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, fcmToken } = req.body;
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            if (fcmToken) {
                user.fcmToken = fcmToken;
                await user.save();
            }
            res.json({ _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, token: generateToken(user) });
        } else {
            res.status(401).json({ message: 'Incorrect email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/auth/google
// @desc    Google Sign-In / Sign-Up
router.post('/google', async (req, res) => {
    try {
        const { tokenId } = req.body;
        if (!tokenId) {
            return res.status(400).json({ message: 'No Google Token provided' });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        
        // --- DIAGNOSTIC LOGS ---
        console.log('--- GOOGLE AUTH DIAGNOSTICS START ---');
        console.log('ENV CLIENT_ID:', `"${clientId}"`);
        const decodedToken = jwt.decode(tokenId);
        console.log('TOKEN AUDIENCE:', `"${decodedToken?.aud}"`);
        console.log('TOKEN ISSUER:', `"${decodedToken?.iss}"`);
        console.log('MATCH:', clientId === decodedToken?.aud ? 'YES' : 'NO');
        console.log('--- GOOGLE AUTH DIAGNOSTICS END ---');
        // ------------------------

        // Initialize client dynamically to ensure it picks up the latest .env without needing a cold restart for everything
        const dynamicClient = new OAuth2Client(clientId);

        const ticket = await dynamicClient.verifyIdToken({
            idToken: tokenId,
            audience: clientId,
        });

        const payload = ticket.getPayload();
        const { email, given_name, family_name, sub } = payload;

        let user = await User.findOne({ email });
        
        const adminEmails = ['harivelmani@gmail.com', 'harivelamani@gmail.com'];

        if (!user) {
            // Check if this email is registered as a parent in any student's profile
            const isParent = await User.findOne({ 
                'parents.email': email.toLowerCase() 
            });

            const userRole = adminEmails.includes(email.toLowerCase()) 
                ? 'admin' 
                : (isParent ? 'parent' : 'student');
            
            // Handle missing fields from Google Profile robustly
            user = await User.create({ 
                firstName: given_name || email.split('@')[0], 
                lastName: family_name || ' ', // Default to space if family name missing to satisfy required field
                email, 
                googleId: sub, 
                role: userRole 
            });
        } else {
            // If user exists but didn't have a googleId, link it
            if (!user.googleId) {
                user.googleId = sub;
                await user.save();
            }
        }

        res.json({ 
            _id: user._id, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email, 
            role: user.role, 
            token: generateToken(user) 
        });
    } catch (error) {
        console.error('CRITICAL: Google Auth Error:', error.message);
        // Pass more detail back to frontend temporarily to help the user diagnose origin/audience issues
        res.status(500).json({ 
            message: 'Google authentication failed', 
            details: error.message 
        });
    }
});

// @route   POST api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOTP = otp;
        user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
        });

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Academic Curator - Password Reset OTP',
            html: `<h3>Your OTP is: <b>${otp}</b></h3><p>Valid for 5 minutes.</p>`
        });

        res.json({ message: 'OTP sent to email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email, resetOTP: otp, otpExpiry: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });
        res.json({ message: 'OTP verified' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email, resetOTP: otp, otpExpiry: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Invalid session' });

        user.password = newPassword;
        user.resetOTP = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/auth/me
// @desc    Fetch the current user's latest profile from DB (for live name/role sync)
const { protect } = require('../middleware/auth');
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('firstName lastName email role');
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const responseData = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };

        // If parent, find their children
        if (user.role === 'parent') {
            const children = await User.find({ 
                'parents.email': user.email.toLowerCase() 
            }).select('firstName lastName _id');
            responseData.children = children.map(child => ({
                _id: child._id,
                name: `${child.firstName} ${child.lastName}`
            }));
            // Provide a default active child if children exist
            if (responseData.children.length > 0) {
                responseData.child = responseData.children[0];
            }
        }

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
