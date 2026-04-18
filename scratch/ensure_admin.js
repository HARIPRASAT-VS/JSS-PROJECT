const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' });

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'admin@pro.com';
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                firstName: 'System',
                lastName: 'Admin',
                email: email,
                password: 'Password123!',
                role: 'admin'
            });
            console.log('Admin created:', email);
        } else {
            user.role = 'admin';
            await user.save();
            console.log('User upgraded to admin:', email);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createAdmin();
