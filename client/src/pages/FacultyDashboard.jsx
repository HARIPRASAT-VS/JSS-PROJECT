import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { SocketContext } from '../context/SocketContext';

const FacultyDashboard = () => {
    const [activeOtp, setActiveOtp] = useState(null);
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [timeLeft, setTimeLeft] = useState('00:00');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { socket } = useContext(SocketContext);

    useEffect(() => {
        fetchStudents();
        fetchActiveOtp();
    }, []);

    useEffect(() => {
        let interval;
        if (activeOtp && otpExpiry) {
            // Initial call
            const diff = new Date(otpExpiry) - new Date();
            if (diff > 0) {
                const m = Math.floor(diff / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setTimeLeft(`${m}:${s}`);
            }

            interval = setInterval(() => {
                const currentDiff = new Date(otpExpiry) - new Date();
                if (currentDiff <= 0) {
                    setActiveOtp(null);
                    setOtpExpiry(null);
                    setTimeLeft('00:00');
                    setMessage('OTP window has expired.');
                } else {
                    const m = Math.floor(currentDiff / 60000).toString().padStart(2, '0');
                    const s = Math.floor((currentDiff % 60000) / 1000).toString().padStart(2, '0');
                    setTimeLeft(`${m}:${s}`);
                }
            }, 1000);
        } else {
            setTimeLeft('00:00');
        }
        return () => clearInterval(interval);
    }, [activeOtp, otpExpiry]);

    const fetchActiveOtp = async () => {
        try {
            const res = await api.get('/faculty/active-otp');
            const otpData = res.data.success ? res.data.data : res.data;
            if (otpData) {
                setActiveOtp(otpData.otpCode);
                setOtpExpiry(otpData.expiresAt);
            }
        } catch (err) {
            console.error('Failed to fetch active OTP', err);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/faculty/students');
            const studentsData = res.data.success ? res.data.data : res.data;
            setStudents(Array.isArray(studentsData) ? studentsData : []);
        } catch (err) {
            console.error('Failed to fetch students', err);
        }
    };

    const handleGenerateOTP = async () => {
        setLoading(true);
        setMessage('');
        try {
            const res = await api.post('/faculty/generate-otp');
            const otpData = res.data.success ? res.data.data : res.data;
            setActiveOtp(otpData.otpCode);
            setOtpExpiry(otpData.expiresAt);
            setMessage('OTP generated successfully and valid for the configured window.');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to generate OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleStopSharing = async () => {
        setLoading(true);
        try {
            await api.post('/faculty/stop-otp');
            setActiveOtp(null);
            setOtpExpiry(null);
            setMessage('OTP sharing stopped.');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to stop OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 md:p-6 space-y-4 max-w-7xl mx-auto w-full pb-24">
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-2 px-1">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl md:text-4xl font-black text-indigo-900 tracking-tighter">Faculty Command Center</h1>
                    <p className="text-on-surface-variant text-sm font-medium mt-1">Manage class attendance and student activity.</p>
                </motion.div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OTP Generation */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[1.5rem] p-5 text-white relative overflow-hidden shadow-sm shadow-indigo-900/5"
                >
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Start Session</h3>
                        <p className="text-indigo-200 text-xs mb-6">Generate an OTP to start today's attendance window. Students will be notified.</p>
                        
                        {activeOtp ? (
                            <div className="space-y-4">
                                <div className="bg-white/20 backdrop-blur-md rounded-[1rem] p-4 text-center border border-white/10">
                                    <p className="text-[10px] uppercase tracking-widest text-indigo-200 mb-1">Current OTP code</p>
                                    <h4 className="text-4xl font-black tracking-widest">{activeOtp}</h4>
                                    <p className="text-[10px] font-bold text-indigo-50 mt-2 bg-black/10 inline-block px-3 py-1 rounded-full">
                                        Expires in: <span className="font-mono text-white">{timeLeft}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={handleStopSharing}
                                    disabled={loading}
                                    className="w-full bg-red-500/20 text-red-100 border border-red-500/50 py-3 rounded-xl font-bold text-sm hover:bg-red-500/40 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {loading ? 'Stopping...' : 'Stop Sharing'}
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleGenerateOTP}
                                disabled={loading}
                                className="w-full bg-white text-indigo-900 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : 'Generate Attendance OTP'}
                            </button>
                        )}
                        
                        {message && <p className="mt-3 text-[10px] font-bold text-indigo-100 bg-white/10 p-2 rounded-lg">{message}</p>}
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                </motion.div>

                {/* Assigned Students */}
                <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[1.5rem] p-5 shadow-sm shadow-indigo-900/5 flex flex-col h-full border border-slate-100"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-bold text-indigo-900">Assigned Students</h4>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{students.length} Total</span>
                    </div>
                    
                    <div className="mb-3 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input 
                            type="text"
                            placeholder="Search student name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
                        {students.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-4">No students assigned yet.</p>
                        ) : (() => {
                            const filtered = students.filter(s => 
                                `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                s.email.toLowerCase().includes(searchQuery.toLowerCase())
                            );
                            if (filtered.length === 0) return <p className="text-xs text-slate-400 italic text-center py-4">No match found.</p>;
                            return filtered.map(student => (
                                <div key={student._id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="font-bold text-xs text-indigo-900">{student.firstName} {student.lastName}</p>
                                        <p className="text-[10px] text-slate-500 truncate max-w-[150px] md:max-w-xs">{student.email}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                       {student.isBlocked && <span className="px-2 py-0.5 text-[9px] bg-red-100 text-red-700 rounded-md font-bold uppercase mb-1">Blocked</span>}
                                       <span className={`text-[9px] font-bold ${student.warningCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                           {student.warningCount} Warnings
                                       </span>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FacultyDashboard;
