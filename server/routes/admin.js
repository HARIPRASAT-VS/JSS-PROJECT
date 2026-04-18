const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const BlockRequest = require('../models/BlockRequest');
const Group = require('../models/Group');

const authorizeAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to find or create user
const findOrCreateUser = async (email, firstName, lastName, role) => {
    let user = await User.findOne({ email });
    if (!user) {
        // Create a basic account if it doesn't exist
        user = await User.create({
            email,
            firstName: firstName || 'New',
            lastName: lastName || 'User',
            role,
            password: 'Password123!' // Default password, they can reset it
        });
    } else if (user.role !== role) {
        // Update role if it's different (e.g. from student to faculty??)
        // Actually best to keep it as is or handle it carefully
        user.role = role;
        await user.save();
    }
    return user;
};

// @route   POST api/admin/groups
// @desc    Create a new group
router.post('/groups', protect, authorizeAdmin, async (req, res) => {
    try {
        const { year, facultyName, facultyEmail, members } = req.body;

        if (!year || !facultyEmail || !members) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Handle Faculty
        const faculty = await findOrCreateUser(facultyEmail, facultyName, '', 'faculty');

        // 2. Handle Students
        const studentIds = [];
        for (const m of members) {
            const student = await findOrCreateUser(m.email, m.name, '', 'student');
            student.facultyId = faculty._id;
            await student.save();
            studentIds.push(student._id);
        }

        // 3. Create Group
        const newGroup = await Group.create({
            year,
            facultyId: faculty._id,
            students: studentIds
        });

        const populatedGroup = await Group.findById(newGroup._id)
            .populate('facultyId', 'firstName lastName email')
            .populate('students', 'firstName lastName email warningCount isBlocked');

        res.status(201).json({ success: true, data: populatedGroup });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET api/admin/groups
// @desc    Get groups (optional filter by year)
router.get('/groups', protect, authorizeAdmin, async (req, res) => {
    try {
        const { year } = req.query;
        const filter = { isDeleted: false };
        if (year) filter.year = year;

        const groups = await Group.find(filter)
            .populate('facultyId', 'firstName lastName email')
            .populate('students', 'firstName lastName email warningCount isBlocked')
            .sort({ updatedAt: -1 });

        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT api/admin/groups/:id
// @desc    Update a group with concurrency safety
router.put('/groups/:id', protect, authorizeAdmin, async (req, res) => {
    try {
        const { facultyName, facultyEmail, members, lastUpdatedAt } = req.body;
        
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        // Concurrency Check
        if (lastUpdatedAt && group.updatedAt.toISOString() !== lastUpdatedAt) {
            return res.status(409).json({ 
                success: false, 
                message: 'Concurrency Conflict: This team has been updated by someone else.',
                serverData: await Group.findById(req.params.id)
                    .populate('facultyId', 'firstName lastName email')
                    .populate('students', 'firstName lastName email')
            });
        }

        // 1. Update Faculty if needed
        const faculty = await findOrCreateUser(facultyEmail, facultyName, '', 'faculty');
        group.facultyId = faculty._id;

        // 2. Update Students
        const studentIds = [];
        for (const m of members) {
            const student = await findOrCreateUser(m.email, m.name, '', 'student');
            student.facultyId = faculty._id;
            await student.save();
            studentIds.push(student._id);
        }
        group.students = studentIds;

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate('facultyId', 'firstName lastName email')
            .populate('students', 'firstName lastName email warningCount isBlocked');

        res.json({ success: true, data: updatedGroup });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE api/admin/groups/:id
// @desc    Soft delete a group
router.delete('/groups/:id', protect, authorizeAdmin, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        group.isDeleted = true;
        await group.save();

        res.json({ success: true, message: 'Group soft-deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET api/admin/blocked-users
// @desc    Get all blocked students
router.get('/blocked-users', protect, authorizeAdmin, async (req, res) => {
    try {
        const blockedUsers = await User.find({ isBlocked: true, role: 'student' }).populate('facultyId', 'firstName lastName email');
        res.json(blockedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/unblock-requests
// @desc    Get all unblock requests
router.get('/unblock-requests', protect, authorizeAdmin, async (req, res) => {
    try {
        const requests = await BlockRequest.find()
            .populate('studentId', 'firstName lastName email warningCount')
            .populate('facultyId', 'firstName lastName');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/admin/unblock-resolve/:id
// @desc    Approve or Reject an unblock request
router.post('/unblock-resolve/:id', protect, authorizeAdmin, async (req, res) => {
    try {
        const { status } = req.body; // 'Approved' or 'Rejected'
        const request = await BlockRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        await request.save();

        if (status === 'Approved') {
            const student = await User.findById(request.studentId);
            student.isBlocked = false;
            student.warningCount = 0; // Reset warnings on unblock
            await student.save();
        }

        res.json({ message: `Request ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

