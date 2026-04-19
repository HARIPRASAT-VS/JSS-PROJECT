const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const AcademicTest = require('../models/AcademicTest');
const LeaveRequest = require('../models/LeaveRequest');
const FeeRecord = require('../models/FeeRecord');
const Group = require('../models/Group');
const YearRegistry = require('../models/YearRegistry');
const { protect } = require('../middleware/auth');

// Helper: Ensure user is a parent and find their child (more robust)
const getChildId = async (req) => {
    const parentEmail = req.user.email;
    const requestedChildId = req.headers['x-child-id'];
    
    if (!parentEmail) return null;
    const emailToSearch = parentEmail.trim().toLowerCase();

    // If a specific child is requested, verify they belong to this parent
    if (requestedChildId && requestedChildId !== 'undefined' && requestedChildId !== 'null') {
        const child = await User.findOne({ 
            _id: requestedChildId,
            'parents.email': { $regex: new RegExp(`^${emailToSearch}$`, 'i') } 
        }).select('_id firstName lastName email parents');
        if (child) return child;
    }

    // Default: find the first child associated with this parent email
    const child = await User.findOne({ 
        'parents.email': { $regex: new RegExp(`^${emailToSearch}$`, 'i') } 
    }).select('_id firstName lastName email parents');
    
    return child || null;
};

// @route   GET api/parent/children
// @desc    Get all children associated with this parent
router.get('/children', protect, async (req, res) => {
    try {
        if (req.user.role !== 'parent') return res.status(403).json({ message: 'Access denied' });
        
        const parentEmail = req.user.email.trim().toLowerCase();
        const children = await User.find({ 
            'parents.email': { $regex: new RegExp(`^${parentEmail}$`, 'i') } 
        }).select('_id firstName lastName email');
        
        // Find registry year for each child
        const childrenWithYear = await Promise.all(children.map(async (child) => {
            const [group, registry] = await Promise.all([
                Group.findOne({ students: child._id, isDeleted: false }),
                YearRegistry.findOne({ members: child._id })
            ]);
            const year = group ? group.year : (registry ? registry.year : 'Unassigned');
            return {
                _id: child._id,
                name: `${child.firstName} ${child.lastName}`,
                email: child.email,
                year
            };
        }));

        res.json(childrenWithYear);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/parent/dashboard
router.get('/dashboard', protect, async (req, res) => {
    try {
        if (req.user.role !== 'parent') return res.status(403).json({ message: 'Access denied' });
        
        const child = await getChildId(req);
        if (!child) return res.status(404).json({ message: 'Child not found' });
        const childId = child._id;
        
        // Dynamic Attendance Calculation
        const attendance = await Attendance.find({ userId: childId });
        const totalSessions = attendance.length;
        const presentSessions = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
        const attendancePercentage = totalSessions > 0 ? ((presentSessions / totalSessions) * 100).toFixed(1) : 0;

        // Dynamic Fee Summary
        const feeRecord = await FeeRecord.findOne({ studentId: childId });
        const totalPending = feeRecord ? feeRecord.totalPending : 0;
        
        // Dynamic Year Info (Unify Search)
        const [group, registry] = await Promise.all([
            Group.findOne({ students: childId, isDeleted: false }),
            YearRegistry.findOne({ members: childId })
        ]);
        const registryYear = group ? group.year : (registry ? registry.year : 'Unassigned Year');
  
        res.json({
            child: {
                _id: childId,
                name: (child.firstName + ' ' + (child.lastName || '')).trim() || 'Assigned Student',
                email: child.email || 'N/A'
            },
            registryYear: registryYear || 'Not Enrolled',
            stats: {
                attendancePercentage: Number(attendancePercentage),
                presentSessions: Number(presentSessions),
                totalSessions: Number(totalSessions),
                totalPending: Number(totalPending)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/parent/fees
router.get('/fees', protect, async (req, res) => {
    try {
        const child = await getChildId(req);
        if (!child) return res.status(404).json({ message: 'Child not found' });
        const feeRecord = await FeeRecord.findOne({ studentId: child._id });
        res.json(feeRecord || { college: {}, hostel: {}, mess: {} });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/parent/marks
router.get('/marks', protect, async (req, res) => {
    try {
        const child = await getChildId(req);
        if (!child) return res.status(404).json({ message: 'Child not found' });
        
        // Find all tests where this child has a score
        const tests = await AcademicTest.find({
            'scores.studentId': child._id
        }).select('testName testType testDate totalMarks subject scores.$');

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/parent/leave
router.get('/leave', protect, async (req, res) => {
    try {
        const child = await getChildId(req);
        if (!child) return res.json([]);
        const childId = child._id;
        
        // Show all leaves for that child (not just pending) to show history
        const leaves = await LeaveRequest.find({ userId: childId })
            .populate('facultyId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH api/parent/leave/:id/approve
router.patch('/leave/:id/:action', protect, async (req, res) => {
    try {
        const { id, action } = req.params; // action = approve or reject
        const child = await getChildId(req);
        if (!child) return res.status(404).json({ message: 'Child not found' });
        
        const leave = await LeaveRequest.findOne({ _id: id, userId: child._id });
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

