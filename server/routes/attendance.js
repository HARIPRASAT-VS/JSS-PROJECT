const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Config = require('../models/Config');
const LeaveRequest = require('../models/LeaveRequest');

// Helper function: Haversine distance
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius of the earth in m
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in m
}

// @route   GET api/attendance/active-otp
// @desc    Get the active OTP for the student's assigned faculty
router.get('/active-otp', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.facultyId) {
            return res.status(400).json({ message: 'No faculty assigned to you.' });
        }
        
        const activeOtp = await OTP.findOne({ 
            facultyId: user.facultyId, 
            isActive: true, 
            expiresAt: { $gt: new Date() } 
        });
        
        if (activeOtp) {
            res.json({ otpCode: activeOtp.otpCode, expiresAt: activeOtp.expiresAt });
        } else {
            res.json(null);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/attendance/check-in
// @desc    Start an attendance session with OTP and Location
router.post('/check-in', protect, async (req, res) => {
    try {
        const { subject, otp, lat, lng } = req.body;
        const user = await User.findById(req.user.id);
        
        if (user.isBlocked) return res.status(403).json({ message: 'You are blocked. Submit an unblock request via Faculty.' });
        
        // Ensure student has a faculty assigned
        if (!user.facultyId) return res.status(400).json({ message: 'No faculty assigned to you. Cannot mark attendance.' });

        // OTP Validation
        const validOtp = await OTP.findOne({ facultyId: user.facultyId, otpCode: otp, isActive: true, expiresAt: { $gt: new Date() } });
        if (!validOtp) return res.status(400).json({ message: 'Invalid or Expired OTP' });

        // Location Validation
        const config = await Config.findOne();
        let isLocationValid = false;
        
        if (config && config.collegeLocation && lat && lng) {
            const distance = getDistanceFromLatLonInMeters(lat, lng, config.collegeLocation.lat, config.collegeLocation.lng);
            if (distance <= config.collegeLocation.radiusMeters) {
                isLocationValid = true;
            } else {
                return res.status(400).json({ message: 'Location out of bounds' });
            }
        } else if (!config) {
            isLocationValid = true; // Fallback for dev if Config not setup
        } else {
            return res.status(400).json({ message: 'Location tracking is required' });
        }

        // Leave conflict validation
        const today = new Date();
        today.setHours(0,0,0,0);
        const activeLeave = await LeaveRequest.findOne({
            userId: user._id, 
            status: 'Approved',
            startDate: { $lte: new Date() },
            endDate: { $gte: today }
        });
        
        if (activeLeave) {
            return res.status(400).json({ message: 'You have an active approved leave. System marked as leave.' });
        }

        // Check if user already marked attendance today
        const existingSession = await Attendance.findOne({ 
            userId: req.user.id, 
            checkIn: { $gte: today } 
        });

        if (existingSession) {
            return res.status(400).json({ message: 'Attendance already marked for today' });
        }

        const now = new Date();
        const session = await Attendance.create({
            userId: req.user.id,
            subject: subject || 'Hostel Attendance',
            checkIn: now,
            checkOut: now,
            otpUsed: otp,
            location: { lat, lng, isValid: isLocationValid },
            isActive: false
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/attendance/check-out
// @desc    End an active attendance session
router.post('/check-out', protect, async (req, res) => {
    try {
        const session = await Attendance.findOne({ userId: req.user.id, isActive: true });
        if (!session) {
            return res.status(404).json({ message: 'No active session found' });
        }

        session.checkOut = new Date();
        session.isActive = false;
        await session.save();

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/attendance/status
// @desc    Get current session status
router.get('/status', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);
        const session = await Attendance.findOne({ 
            userId: req.user.id, 
            checkIn: { $gte: today } 
        }).sort({ checkIn: -1 });

        res.json({ isActive: !!session, session });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/attendance/stats
// @desc    Get attendance statistics for the logged-in user
router.get('/stats', protect, async (req, res) => {
    try {
        const allAttendance = await Attendance.find({ userId: req.user.id });
        const presentCount = allAttendance.filter(a => a.status === 'Present').length;
        const absentCount = allAttendance.filter(a => a.status === 'Absent').length;
        const lateCount = allAttendance.filter(a => a.status === 'Late').length;
        
        const total = allAttendance.length || 1;
        const percentage = ((presentCount + lateCount) / total * 100).toFixed(1);

        res.json({
            percentage,
            presentCount,
            absentCount,
            lateCount,
            totalSessions: allAttendance.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/attendance/logs
// @desc    Get all attendance logs for the user
router.get('/logs', protect, async (req, res) => {
    try {
        const logs = await Attendance.find({ userId: req.user.id }).sort({ checkIn: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/attendance/admin/live
// @desc    (Admin) Get all active sessions
router.get('/admin/live', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const activeSessions = await Attendance.find({ isActive: true }).populate('userId', 'firstName lastName email');
        res.json(activeSessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
