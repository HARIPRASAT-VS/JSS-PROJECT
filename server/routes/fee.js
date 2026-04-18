const express = require('express');
const router = express.Router();
const FeeRecord = require('../models/FeeRecord');
const { protect } = require('../middleware/auth');

// @route   POST api/fee/set
// @desc    Admin sets or updates student fees
router.post('/set', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        
        const { studentId, college, hostel, mess } = req.body;

        const feeRecord = await FeeRecord.findOneAndUpdate(
            { studentId },
            { 
                college: college || { total: 0, paid: 0 }, 
                hostel: hostel || { total: 0, paid: 0 }, 
                mess: mess || { total: 0, paid: 0 } 
            },
            { upsert: true, new: true }
        );

        res.json(feeRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/fee/:studentId
router.get('/:studentId', protect, async (req, res) => {
    try {
        const feeRecord = await FeeRecord.findOne({ studentId: req.params.studentId });
        res.json(feeRecord || { college: { total: 0, paid: 0 }, hostel: { total: 0, paid: 0 }, mess: { total: 0, paid: 0 } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
