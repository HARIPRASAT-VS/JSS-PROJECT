import React, { useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import { motion, AnimatePresence } from 'framer-motion';

const AttendancePage = () => {
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
        <div className="flex min-h-screen bg-slate-50 pb-20 md:pb-0">
            <SideNavBar />
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Custom Header for Mobile matching Image 5 */}
                <div className="md:hidden bg-[#5b3eb5] text-white p-4 flex items-center shadow-md mb-4">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="ml-2 font-bold text-lg tracking-wide">My Attendance</h2>
                </div>

                <div className="hidden md:block">
                    <TopAppBar />
                </div>
                
                <div className="p-4 md:p-10 space-y-6 max-w-7xl mx-auto w-full relative z-10">
                    <div className="hidden md:block mb-8">
                        <h1 className="text-3xl font-black text-indigo-900 tracking-tighter">My Attendance</h1>
                        <p className="text-on-surface-variant font-medium mt-1">Detailed history and statistics.</p>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6">
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100">
                            <span className="text-xl md:text-3xl font-bold text-[#5b3eb5]">{loading ? '-' : `${stats.percentage}%`}</span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Attendance</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100">
                            <span className="text-xl md:text-3xl font-bold text-indigo-900">{loading ? '-' : stats.presentCount}</span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Present</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100">
                            <span className="text-xl md:text-3xl font-bold text-indigo-900">{loading ? '-' : stats.absentCount}</span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Absent</span>
                        </div>
                    </div>

                    {/* Date Picker Section */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 p-4 flex items-center justify-between mb-6">
                        <span className="text-sm font-bold text-slate-700">Filter by Date</span>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-[#5b3eb5] focus:outline-none focus:ring-2 focus:ring-[#5b3eb5]/20"
                        />
                    </div>

                    {/* Logs List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest animate-pulse">Fetching records...</div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest bg-white rounded-2xl border border-slate-100 border-dashed">No records found for this date</div>
                        ) : (
                            filteredLogs.map((log, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={log._id || idx} 
                                    className="bg-white rounded-2xl p-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#5b3eb5]/20"></div>
                                    
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mr-4 text-slate-400 shrink-0">
                                        <span className="material-symbols-outlined text-xl">schedule</span>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-800 text-sm">
                                                {new Date(log.checkIn).toLocaleDateString(undefined, { weekday: 'long' })}, {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </h4>
                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusStyles(log.status)}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'Present' ? 'bg-emerald-500' : 'bg-current'}`}></div>
                                                {log.status}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">
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

                <BottomNavBar />
            </main>
        </div>
    );
};

export default AttendancePage;
