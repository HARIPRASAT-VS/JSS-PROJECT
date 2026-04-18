const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/User');
const YearRegistry = require('../server/models/YearRegistry');

async function diagnose() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const registries = await YearRegistry.find().populate('members faculties');
        console.log('\n--- ALL REGISTRIES ---');
        registries.forEach(r => {
            console.log(`Year: "${r.year}"`);
            console.log(`Members: ${r.members.length}`);
            console.log(`Faculties: ${r.faculties.length} (${r.faculties.map(f => f.email).join(', ')})`);
            console.log('---------------------');
        });

        const studentCount = await User.countDocuments({ role: 'student' });
        const facultyCount = await User.countDocuments({ role: 'faculty' });
        console.log(`\nStats: Students=${studentCount}, Faculty=${facultyCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Diagnosis Failed:', err);
        process.exit(1);
    }
}

diagnose();
