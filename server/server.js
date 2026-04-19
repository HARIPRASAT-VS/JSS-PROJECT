require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const facultyRoutes = require('./routes/faculty');
const studentRoutes = require('./routes/student');
const registryRoutes = require('./routes/registry');
const parentRoutes = require('./routes/parent');
const feeRoutes = require('./routes/fee');
const initCronJobs = require('./utils/cronJobs');

const app = express();
const server = http.createServer(app);

// Dynamic CORS configuration for both Express and Socket.io
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

app.set('io', io); // so we can access it via req.app.get('io') in routes

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);
    
    // Can join a specific room if logged in
    socket.on('joinRoom', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their specific room`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Initialize Cron Jobs
initCronJobs(io);

// Middleware
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/registry', registryRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/fee', feeRoutes);

// Diagnostic Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', version: '2026-04-18-v2', timestamp: new Date() });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
