const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Group = require('../models/Group');
const YearRegistry = require('../models/YearRegistry');

// ─── GET /api/student/year-faculties ──────────────────────────────────────────
// Returns all faculties from the year the student is registered under
router.get('/year-faculties', protect, async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Find associated years/faculties from both sources
        const [registry, group] = await Promise.all([
            YearRegistry.findOne({ members: userId }).populate('faculties', 'firstName lastName email'),
            Group.findOne({ students: userId, isDeleted: false }).populate('facultyId', 'firstName lastName email')
        ]);

        const faculties = new Map();
        let yearName = null;

        if (registry) {
            yearName = registry.year;
            registry.faculties.forEach(f => faculties.set(String(f._id), f));
        }

        if (group) {
            yearName = yearName || group.year;
            if (group.facultyId) {
                faculties.set(String(group.facultyId._id), group.facultyId);
            }
        }

        res.json({ 
            faculties: Array.from(faculties.values()), 
            year: yearName 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET /api/student/leaves ──────────────────────────────────────────────────
// Returns the full persistent leave history for the logged-in student
router.get('/leaves', protect, async (req, res) => {
    try {
        const leaves = await LeaveRequest
            .find({ userId: req.user.id })
            .populate('facultyId', 'firstName lastName email')
            .sort({ createdAt: -1 }); // newest first
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── POST /api/student/leaves ─────────────────────────────────────────────────
// Submit a new leave request
router.post('/leaves', protect, async (req, res) => {
    try {
        const { type, startDate, endDate, startTime, endTime, reason, facultyId, attendancePercentage } = req.body;

        // --- Required field checks ---
        if (!facultyId) {
            return res.status(400).json({ message: 'Please select a faculty for your leave request' });
        }
        if (!startTime || !endTime) {
            return res.status(400).json({ message: 'Start time and end time are required' });
        }

        // --- 24-hour minimum date gap ---
        const from = new Date(startDate);
        const to   = new Date(endDate);
        if (isNaN(from) || isNaN(to)) {
            return res.status(400).json({ message: 'Invalid date format provided' });
        }
        const diffHrs = (to - from) / (1000 * 60 * 60);
        if (diffHrs < 24) {
            return res.status(400).json({ message: 'End date must be at least 24 hours after the start date' });
        }

        const leave = await LeaveRequest.create({
            userId: req.user.id,
            facultyId,
            type,
            startDate,
            endDate,
            startTime,
            endTime,
            reason,
            attendancePercentageSnapshot: attendancePercentage
        });

        // Populate facultyId before returning so the frontend can display the name
        const populated = await leave.populate('facultyId', 'firstName lastName email');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
