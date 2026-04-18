const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const YearRegistry = require('../models/YearRegistry');

// ─── Middleware ────────────────────────────────────────────────────────────────
const authorizeAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Helper: find or auto-create user ─────────────────────────────────────────
const findOrCreateUser = async (email, name, role) => {
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';

    let user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
        user = await User.create({
            email: email.trim().toLowerCase(),
            firstName,
            lastName,
            role,
            password: 'Password123!'
        });
    }
    return user;
};

// ─── Helper: get or create YearRegistry doc ───────────────────────────────────
const getOrCreateYear = async (year) => {
    let doc = await YearRegistry.findOne({ year });
    if (!doc) doc = await YearRegistry.create({ year, members: [], faculties: [] });
    return doc;
};

// ─── Helper: populate and return standard format ──────────────────────────────
const populateYear = (doc) =>
    YearRegistry.findById(doc._id)
        .populate('members', 'firstName lastName email role warningCount isBlocked')
        .populate('faculties', 'firstName lastName email role');

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/registry  →  all years with populated data
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/', protect, authorizeAdmin, async (req, res) => {
    try {
        const docs = await YearRegistry.find()
            .populate('members', 'firstName lastName email role warningCount isBlocked')
            .populate('faculties', 'firstName lastName email role')
            .sort({ year: 1 });
        res.json({ success: true, data: docs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/registry/:year  →  single year (URL-encoded ok)
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/:year', protect, authorizeAdmin, async (req, res) => {
    try {
        const doc = await getOrCreateYear(req.params.year);
        res.json({ success: true, data: await populateYear(doc) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/registry/:year/members  →  add one or more members
// body: { people: [{ name, email }] }
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/:year/members', protect, authorizeAdmin, async (req, res) => {
    try {
        const { people } = req.body;
        if (!people || !Array.isArray(people) || people.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide at least one member' });
        }

        const doc = await getOrCreateYear(req.params.year);

        for (const p of people) {
            if (!p.name || !p.email) continue;
            const user = await findOrCreateUser(p.email, p.name, 'student');
            if (!doc.members.map(String).includes(String(user._id))) {
                doc.members.push(user._id);
            }
        }
        await doc.save();
        res.json({ success: true, data: await populateYear(doc) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/registry/:year/members/:userId  →  remove member
// ═══════════════════════════════════════════════════════════════════════════════
router.delete('/:year/members/:userId', protect, authorizeAdmin, async (req, res) => {
    try {
        const doc = await YearRegistry.findOne({ year: req.params.year });
        if (!doc) return res.status(404).json({ success: false, message: 'Year not found' });

        doc.members = doc.members.filter(id => String(id) !== req.params.userId);
        await doc.save();
        res.json({ success: true, data: await populateYear(doc) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/registry/:year/faculties  →  add one or more faculties
// body: { people: [{ name, email }] }
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/:year/faculties', protect, authorizeAdmin, async (req, res) => {
    try {
        const { people } = req.body;
        if (!people || !Array.isArray(people) || people.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide at least one faculty' });
        }

        const doc = await getOrCreateYear(req.params.year);

        for (const p of people) {
            if (!p.name || !p.email) continue;
            const user = await findOrCreateUser(p.email, p.name, 'faculty');
            if (!doc.faculties.map(String).includes(String(user._id))) {
                doc.faculties.push(user._id);
            }
        }
        await doc.save();
        res.json({ success: true, data: await populateYear(doc) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/registry/:year/faculties/:userId  →  remove faculty
// ═══════════════════════════════════════════════════════════════════════════════
router.delete('/:year/faculties/:userId', protect, authorizeAdmin, async (req, res) => {
    try {
        const doc = await YearRegistry.findOne({ year: req.params.year });
        if (!doc) return res.status(404).json({ success: false, message: 'Year not found' });

        doc.faculties = doc.faculties.filter(id => String(id) !== req.params.userId);
        await doc.save();
        res.json({ success: true, data: await populateYear(doc) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/registry/users/:userId  →  update user name/email
// ═══════════════════════════════════════════════════════════════════════════════
router.put('/users/:userId', protect, authorizeAdmin, async (req, res) => {
    try {
        const { firstName, lastName, email, parents } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (email !== undefined) user.email = email.trim().toLowerCase();

        if (parents !== undefined) {
            if (!Array.isArray(parents)) return res.status(400).json({ success: false, message: 'Parents must be an array' });
            if (parents.length < 1) return res.status(400).json({ success: false, message: 'Minimum 1 parent required' });
            if (parents.length > 2) return res.status(400).json({ success: false, message: 'Maximum 2 parents allowed' });
            
            const emails = parents.map(p => p.email.toLowerCase().trim());
            const emailRegex = /.+\@.+\..+/;
            for (let em of emails) {
                if (!emailRegex.test(em)) return res.status(400).json({ success: false, message: `Invalid parent email format: ${em}` });
            }
            if (new Set(emails).size !== emails.length) {
                return res.status(400).json({ success: false, message: 'Duplicate parent emails are not allowed for the same student' });
            }
            user.parents = parents;
        }

        await user.save();
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
