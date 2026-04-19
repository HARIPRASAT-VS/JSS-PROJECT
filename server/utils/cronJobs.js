const cron = require('node-cron');
const User = require('../models/User');
const Config = require('../models/Config');
const OTP = require('../models/OTP');
const Attendance = require('../models/Attendance');
const { sendPushNotification } = require('./firebase');

const initCronJobs = (io) => {
    console.log('Cron jobs initialized.');

    // 7:50 PM: Attendance Reminder
    cron.schedule('50 19 * * *', async () => {
        console.log('Running 7:50 PM CRON: Attendance Reminder');
        const config = await Config.findOne();
        if (!config) return;

        const students = await User.find({ role: 'student' });
        
        // Notify via Socket.IO for online users
        io.emit('attendanceReminder', { message: 'Update attendance without fail!' });

        // Notify via FCM
        for (const student of students) {
            if (student.fcmToken) {
                await sendPushNotification(
                    student.fcmToken,
                    'Attendance Reminder',
                    'Update attendance without fail!',
                    { type: 'ATTENDANCE_REMINDER' }
                );
            }
        }
    }, { timezone: 'Asia/Kolkata' });

    // Auto Absentee & Warning Increment (e.g. at Midnight)
    // Runs every day to check if an active student got late or didn't check in
    cron.schedule('0 0 * * *', async () => {
        console.log('Running Midnight CRON: Processing Absentees');
        
        // Find students who didn't check-in today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0,0,0,0);
        
        const now = new Date();
        now.setHours(0,0,0,0);

        const allStudents = await User.find({ role: 'student', isBlocked: false });
        
        for (const student of allStudents) {
            const hasCheckIn = await Attendance.findOne({
                userId: student._id,
                checkIn: { $gte: yesterday, $lt: now }
            });

            if (!hasCheckIn) {
                // If no check-in, check if they have an approved leave
                const hasLeave = false; // Add actual leave checking logic here later if needed
                
                if (!hasLeave) {
                    // Mark as absentee logic handled dynamically generally, but we increment warning here
                    student.warningCount += 1;
                    if (student.warningCount >= 5) {
                        if (!student.isBlocked) {
                            student.totalBlockCount = (student.totalBlockCount || 0) + 1;
                        }
                        student.isBlocked = true;
                    }
                    await student.save();
                }
            }
        }
    }, { timezone: 'Asia/Kolkata' });
};

module.exports = initCronJobs;
