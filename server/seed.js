require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const YearRegistry = require('./models/YearRegistry');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB (Forcing IPv4)...');
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log('Connected successfully!');

        // 1. Clear existing critical structures
        console.log('Clearing old Registry data...');
        await YearRegistry.deleteMany({});
        await User.deleteMany({ role: 'admin' }); // Clear old admins to prevent duplicates

        // 2. Seed Academic Years (Required for Dashboard)
        console.log('Seeding Academic Years...');
        await YearRegistry.create([
            { year: '1st Year', students: [], facultyAssignments: [] },
            { year: '2nd Year', students: [], facultyAssignments: [] },
            { year: '3rd Year', students: [], facultyAssignments: [] },
            { year: 'Final Year', students: [], facultyAssignments: [] }
        ]);

        // 3. Create/Update your master Admin account
        console.log('Creating Admin Account...');
        await User.findOneAndUpdate(
            { email: 'hariprasatvs.it24@bitsathy.ac.in' },
            {
                firstName: 'Hari',
                lastName: 'Prasat V S',
                role: 'admin',
                password: 'password123' // Initial password, can be changed later
            },
            { upsert: true, new: true }
        );

        console.log('-------------------------------------------');
        console.log('SUCCESS: Database seeded and Dashboard ready!');
        console.log('-------------------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('SEEDING ERROR:', error);
        process.exit(1);
    }
};

seedData();
