const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const AcademicTest = require('../models/AcademicTest');
const LeaveRequest = require('../models/LeaveRequest');
const FeeRecord = require('../models/FeeRecord');
const { protect } = require('../middleware/auth');

// Helper: Ensure user is a parent and find their child
const getChildId = async (parentEmail) => {
    const child = await User.findOne({ 'parents.email': parentEmail.toLowerCase() });
    return child ? child._id : null;
};

// @route   GET api/parent/dashboard
router.get('/dashboard', protect, async (req, res) => {
    try {
        if (req.user.role !== 'parent') return res.status(403).json({ message: 'Access denied' });
        
        const childId = await getChildId(req.user.email);
        if (!childId) return res.status(404).json({ message: 'Child not found' });

        const child = await User.findById(childId).select('firstName lastName email');
        
        // Dynamic Attendance Calculation
        const attendance = await Attendance.find({ userId: childId });
        const totalSessions = attendance.length;
        const presentSessions = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
        const attendancePercentage = totalSessions > 0 ? ((presentSessions / totalSessions) * 100).toFixed(1) : 0;

        // Dynamic Fee Summary
        const feeRecord = await FeeRecord.findOne({ studentId: childId });
        const totalPending = feeRecord ? feeRecord.totalPending : 0;

        res.json({
            child,
            stats: {
                attendancePercentage,
                presentSessions,
                totalSessions,
                totalPending
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/parent/fees
router.get('/fees', protect, async (req, res) => {
    try {
        const childId = await getChildId(req.user.email);
        const feeRecord = await FeeRecord.findOne({ studentId: childId });
        res.json(feeRecord || { college: {}, hostel: {}, mess: {} });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/parent/marks
router.get('/marks', protect, async (req, res) => {
    try {
        const childId = await getChildId(req.user.email);
        
        // Find all tests where this child has a score
        const tests = await AcademicTest.find({
            'scores.studentId': childId
        }).select('testName testType testDate totalMarks subject scores.$');

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/parent/leave
router.get('/leave', protect, async (req, res) => {
    try {
        const childId = await getChildId(req.user.email);
        const leaves = await LeaveRequest.find({ userId: childId, status: 'Pending' })
            .populate('facultyId', 'firstName lastName');
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH api/parent/leave/:id/approve
router.patch('/leave/:id/:action', protect, async (req, res) => {
    try {
        const { id, action } = req.params; // action = approve or reject
        const childId = await getChildId(req.user.email);
        
        const leave = await LeaveRequest.findOne({ _id: id, userId: childId });
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        leave.parentStatus = action === 'approve' ? 'Approved' : 'Rejected';
        
        // If parent rejects, it automatically rejects for faculty too
        if (action === 'reject') {
            leave.status = 'Rejected';
        }

        await leave.save();
        res.json({ message: `Leave ${action}d by parent`, leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
