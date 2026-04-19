const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Always fetch fresh user data from DB so role/email are always current
            const user = await User.findById(decoded.id).select('_id role email firstName lastName');
            if (!user) return res.status(401).json({ message: 'User no longer exists' });
            
            req.user = {
                id: user._id.toString(),
                _id: user._id.toString(),
                role: user.role,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            };
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
};

module.exports = { protect };
