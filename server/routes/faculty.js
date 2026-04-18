const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Attendance = require('../models/Attendance');
const Config = require('../models/Config');
const LeaveRequest = require('../models/LeaveRequest');
const BlockRequest = require('../models/BlockRequest');
const YearRegistry = require('../models/YearRegistry');
const AcademicTest = require('../models/AcademicTest');
const { upload } = require('../utils/cloudinary');

const authorizeFaculty = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'faculty') {
            return res.status(403).json({ success: false, message: 'Access denied. Faculty only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Authorization error: ' + error.message });
    }
};

// @route   POST api/faculty/generate-otp
// @desc    Generate attendance OTP
router.post('/generate-otp', protect, authorizeFaculty, async (req, res) => {
    try {
        const config = await Config.findOne();
        const now = new Date();
        const currentTimeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        
        // Disable strict timing logic for local dev if config doesn't exist, but follow the logic otherwise
        if (config) {
            // Very basic time string comparison '13:00' >= '20:00'
            if (currentTimeString < config.otpWindow.startTime) {
                return res.status(400).json({ message: `OTP generation is only available after ${config.otpWindow.startTime}` });
            }
        }

        // Deactivate old OTPs for this faculty
        await OTP.updateMany({ facultyId: req.user.id, isActive: true }, { isActive: false });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + (config ? config.otpWindow.durationMinutes : 30));

        const otp = await OTP.create({ facultyId: req.user.id, otpCode, expiresAt });
        
        // Emit to sockets (assuming app.get('io') is set in server.js)
        const io = req.app.get('io');
        if (io) {
            io.emit('otpGenerated', { 
                facultyId: req.user.id, 
                otpCode: otp.otpCode, 
                expiresAt: otp.expiresAt,
                message: 'OTP Window is now open' 
            });
        }

        res.json({ success: true, data: otp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET api/faculty/active-otp
// @desc    Get current active OTP for the faculty
router.get('/active-otp', protect, authorizeFaculty, async (req, res) => {
    try {
        const activeOtp = await OTP.findOne({ 
            facultyId: req.user.id, 
            isActive: true, 
            expiresAt: { $gt: new Date() } 
        });
        res.json({ success: true, data: activeOtp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST api/faculty/stop-otp
// @desc    Stop sharing current active OTP
router.post('/stop-otp', protect, authorizeFaculty, async (req, res) => {
    try {
        await OTP.updateMany({ facultyId: req.user.id, isActive: true }, { isActive: false });
        
        const io = req.app.get('io');
        if (io) {
            io.emit('otpRevoked', { facultyId: req.user.id, message: 'OTP sharing stopped' });
        }
        res.json({ message: 'OTP sharing stopped successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/faculty/students
// @desc    Get assigned students
router.get('/students', protect, authorizeFaculty, async (req, res) => {
    try {
        const registries = await YearRegistry.find({ faculties: req.user.id })
            .populate('members', 'firstName lastName email warningCount isBlocked');
        
        const membersMap = new Map();
        for (const registry of registries) {
            for (const member of registry.members) {
                membersMap.set(member._id.toString(), member);
            }
        }
        
        res.json({ success: true, data: Array.from(membersMap.values()) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET api/faculty/assigned-groups
// @desc    Get assigned students grouped securely by year
router.get('/assigned-groups', protect, authorizeFaculty, async (req, res) => {
    try {
        const registries = await YearRegistry.find({ faculties: req.user.id })
            .populate('members', 'firstName lastName email warningCount isBlocked');
        
        const groups = registries.map(r => ({
            year: r.year,
            students: r.members
        }));
        
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/faculty/academic-tests
// @desc    Batch upsert academic marks securely
router.post('/academic-tests', protect, authorizeFaculty, async (req, res) => {
    try {
        const { assignedTo, testType, testName, totalMarks, testDate, scores } = req.body;
        
        if (!assignedTo || !testType || !testName || !totalMarks || !testDate || !scores) {
            return res.status(400).json({ message: 'Missing required configuration fields (testDate is required).' });
        }

        // Get all students currently assigned to this faculty across all registries
        const registries = await YearRegistry.find({ faculties: req.user.id });
        const validStudentIds = new Set();
        registries.forEach(reg => {
            reg.members.forEach(id => validStudentIds.add(String(id)));
        });

        for (const s of scores) {
            if (!validStudentIds.has(String(s.studentId))) {
                return res.status(403).json({ message: `Illegal grading operation tracking unassigned student: ${s.studentId}` });
            }
            if (!s.marks || typeof s.marks.isAbsent !== 'boolean') {
                return res.status(400).json({ message: 'Malformed marks structure detected.' });
            }
        }

        const test = await AcademicTest.findOneAndUpdate(
            { facultyId: req.user.id, testType, testName, assignedTo },
            { totalMarks, testDate, scores },
            { new: true, upsert: true }
        );

        res.json({ success: true, data: test });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/faculty/tests
// @desc    Get list of tests for report selection
router.get('/tests', protect, authorizeFaculty, async (req, res) => {
    try {
        const { type } = req.query;
        if (!type) return res.status(400).json({ message: 'Test type is required.' });

        // Using lean() for faster read access as requested
        const tests = await AcademicTest.find({ 
            facultyId: req.user.id, 
            testType: type 
        })
        .select('_id testName totalMarks createdAt')
        .sort({ createdAt: -1 })
        .lean();

        res.json({ success: true, data: tests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/faculty/tests/:testId
// @desc    Get full details of a specific test
router.get('/tests/:testId', protect, authorizeFaculty, async (req, res) => {
    try {
        const test = await AcademicTest.findOne({ 
            _id: req.params.testId, 
            facultyId: req.user.id 
        })
        .populate({
            path: 'scores.studentId',
            select: 'firstName lastName email'
        })
        .lean();

        if (!test) return res.status(404).json({ message: 'Test record not found or access denied.' });

        // Map scores to a cleaner format for frontend
        const formattedScores = test.scores.map(s => ({
            student: {
                id: s.studentId?._id,
                name: `${s.studentId?.firstName || 'Unknown'} ${s.studentId?.lastName || ''}`.trim(),
                email: s.studentId?.email
            },
            marks: s.marks,
            parentViewed: s.parentViewed
        }));

        res.json({
            success: true,
            data: {
                ...test,
                scores: formattedScores
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/faculty/leaves
// @desc    Get leave requests for faculty's students
router.get('/leaves', protect, authorizeFaculty, async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ facultyId: req.user.id }).populate('userId', 'firstName lastName email');
        res.json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST api/faculty/leaves/:id
// @desc    Action a leave request
router.post('/leaves/:id', protect, authorizeFaculty, async (req, res) => {
    try {
        const { status } = req.body;
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
        
        // PARENT GATE: Faculty cannot approve/reject before Parent
        if (leave.parentStatus === 'Pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Action blocked. This leave request is still waiting for Parent approval.' 
            });
        }

        leave.status = status;
        await leave.save();
        res.json({ success: true, data: leave });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST api/faculty/unblock-submission
// @desc    Submit proof to unblock a student
router.post('/unblock-submission', protect, authorizeFaculty, upload.single('proofImage'), async (req, res) => {
    try {
        const { studentId, reason } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Proof image is required' });

        const unblockReq = await BlockRequest.create({
            studentId,
            facultyId: req.user.id,
            reason,
            proofImageUrl: req.file.path // Cloudinary URL automatically returned by multer storage
        });

        res.status(201).json(unblockReq);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
