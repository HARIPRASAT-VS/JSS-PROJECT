require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/models/User');
const YearRegistry = require('../server/models/YearRegistry');

async function checkAssignments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const registries = await YearRegistry.find().populate('faculties', 'firstName lastName email').populate('members', 'firstName lastName email');
        
        console.log('\n--- Year Registries ---');
        registries.forEach(reg => {
            console.log(`Year: ${reg.year}`);
            console.log(`Faculties: ${reg.faculties.map(f => f.email).join(', ')}`);
            console.log(`Students: ${reg.members.length}`);
            console.log('----------------------');
        });

        const faculty = await User.find({ role: 'faculty' });
        console.log('\n--- Faculty Members ---');
        faculty.forEach(f => {
            console.log(`${f.firstName} ${f.lastName} (${f.email}) - ID: ${f._id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAssignments();
