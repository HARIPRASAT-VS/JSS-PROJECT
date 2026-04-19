import React, { useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceDetail = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ percentage: '0', presentCount: 0, absentCount: 0, lateCount: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsRes, statsRes] = await Promise.all([
                    api.get('/attendance/logs'),
                    api.get('/attendance/stats')
                ]);
                setLogs(logsRes.data);
                setStats(statsRes.data);
            } catch (err) {
                console.error('Failed to fetch attendance data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter logs for selected date
    const filteredLogs = logs.filter(log => {
        if (!selectedDate) return true;
        const logDate = new Date(log.checkIn);
        const logDateString = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
        return logDateString === selectedDate;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Present': return 'text-emerald-600 bg-emerald-50';
            case 'Late': return 'text-amber-600 bg-amber-50';
            case 'Absent': return 'text-error bg-error-container/20';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="p-3 md:p-6 space-y-4 max-w-7xl mx-auto w-full relative z-10 pb-24">
            <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-black text-indigo-900 tracking-tighter">My Attendance</h1>
                <p className="text-on-surface-variant font-medium mt-1 text-xs md:text-sm">Detailed history and statistics.</p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-3 gap-3 md:gap-6">
                <div className="bg-white rounded-[1rem] p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                    <span className="text-lg md:text-3xl font-bold text-[#5b3eb5]">{loading ? '-' : `${stats.percentage}%`}</span>
                    <span className="text-[9px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Attendance</span>
                </div>
                <div className="bg-white rounded-[1rem] p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                    <span className="text-lg md:text-3xl font-bold text-indigo-900">{loading ? '-' : stats.presentCount}</span>
                    <span className="text-[9px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Present</span>
                </div>
                <div className="bg-white rounded-[1rem] p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                    <span className="text-lg md:text-3xl font-bold text-indigo-900">{loading ? '-' : stats.absentCount}</span>
                    <span className="text-[9px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Absent</span>
                </div>
            </div>

            {/* Date Picker Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Filter by Date</span>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-[#1e1b4b] focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20"
                />
            </div>

            {/* Logs List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Fetching records...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 font-bold uppercase tracking-widest bg-white rounded-xl border border-slate-100 border-dashed">No records found</div>
                ) : (
                    filteredLogs.map((log, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={log._id || idx} 
                            className="bg-white rounded-xl p-3 flex items-center shadow-sm border border-slate-100 relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5b3eb5]/20"></div>
                            
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3 text-slate-400 shrink-0">
                                <span className="material-symbols-outlined text-[18px]">schedule</span>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className="font-bold text-slate-800 text-xs md:text-sm">
                                        {new Date(log.checkIn).toLocaleDateString(undefined, { weekday: 'short' })}, {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </h4>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusStyles(log.status)}`}>
                                        <div className={`w-1 h-1 rounded-full ${log.status === 'Present' ? 'bg-emerald-500' : 'bg-current'}`}></div>
                                        {log.status}
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                                            {['Class Session', 'Forenoon'].includes(log.subject) || !log.subject ? 'Hostel Attendance' : log.subject}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AttendanceDetail;
