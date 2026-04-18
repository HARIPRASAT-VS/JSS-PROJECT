require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');
const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log('Connected for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await LeaveRequest.deleteMany({});

        // Create Admin
        const admin = await User.create({
            firstName: 'System',
            lastName: 'Admin',
            email: 'admin@academic.edu',
            password: 'password123',
            role: 'admin'
        });

        // Create Demo Students
        const students = await User.create([
            { firstName: 'Hari', lastName: 'Prasat V S', email: 'hariprasatvs.it24@bitsathy.ac.in', password: 'password123', role: 'student' },
            { firstName: 'Alice', lastName: 'Johnson', email: 'alice@student.edu', password: 'password123', role: 'student' },
            { firstName: 'Bob', lastName: 'Smith', email: 'bob@student.edu', password: 'password123', role: 'student' }
        ]);

        const subjects = ['Advanced Mathematics', 'Computer Networks', 'Software Engineering', 'Cloud Computing', 'Data Structures'];

        // Generate Attendance History (Last 30 days)
        console.log('Generating attendance history...');
        for (const student of students) {
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                
                // Randomly skip some days to create "Absent" or just don't create entry
                const rand = Math.random();
                if (rand > 0.1) { // 90% attendance rate
                    const status = rand > 0.8 ? 'Late' : 'Present';
                    
                    // Create multiple sessions per day
                    for (const sub of subjects) {
                        const checkIn = new Date(date);
                        checkIn.setHours(9 + subjects.indexOf(sub), 0, 0);
                        const checkOut = new Date(checkIn);
                        checkOut.setHours(checkIn.getHours() + 1);

                        await Attendance.create({
                            userId: student._id,
                            subject: sub,
                            checkIn,
                            checkOut,
                            status,
                            isActive: false
                        });
                    }
                }
            }
        }

        // Generate some Leave Requests
        console.log('Generating leave requests...');
        await LeaveRequest.create([
            { userId: students[0]._id, type: 'Sick Leave', startDate: new Date('2023-10-14'), endDate: new Date('2023-10-14'), reason: 'Fever', status: 'Approved' },
            { userId: students[0]._id, type: 'Personal Research', startDate: new Date('2023-10-20'), endDate: new Date('2023-10-21'), reason: 'Project Symposium', status: 'Pending' }
        ]);

        console.log('Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
