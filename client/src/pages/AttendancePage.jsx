import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const AttendancePage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ percentage: '0', presentCount: 0, absentCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/attendance/stats');
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const services = [
        { name: 'My Attendance', icon: 'calendar_month', path: '/attendance/detail', color: 'bg-indigo-50 text-indigo-600' },
        { name: 'Movement Pass', icon: 'directions_run', path: '#', color: 'bg-emerald-50 text-emerald-600' },
        { name: 'Booking', icon: 'auto_stories', path: '#', color: 'bg-blue-50 text-blue-600' },
        { name: 'Transport Pass', icon: 'directions_bus', path: '#', color: 'bg-amber-50 text-amber-600' },
        { name: 'Group Discussion', icon: 'groups', path: '#', color: 'bg-rose-50 text-rose-600' },
    ];

    return (
        <div className="p-3 lg:p-6 space-y-6 max-w-7xl mx-auto w-full relative z-10 pb-24">
            <div className="mb-4">
                <h1 className="text-2xl lg:text-3xl font-black text-indigo-900 tracking-tighter">Attendance Services</h1>
                <p className="text-on-surface-variant font-medium mt-1 text-xs lg:text-sm">Manage your academic tracking and passes.</p>
            </div>

            {/* Stats Summary - Matches top of Image 4/5 */}
            <div className="grid grid-cols-3 gap-3 lg:gap-6">
                <div className="bg-white rounded-[1rem] p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                    <span className="text-lg lg:text-3xl font-bold text-[#1e1b4b]">{loading ? '-' : `${stats.percentage}%`}</span>
                    <span className="text-[9px] lg:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Attendance</span>
                </div>
                <div className="bg-white rounded-[1rem] p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                    <span className="text-lg lg:text-3xl font-bold text-[#1e1b4b]">{loading ? '--' : stats.presentCount}</span>
                    <span className="text-[9px] lg:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Present</span>
                </div>
                <div className="bg-white rounded-[1rem] p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                    <span className="text-lg lg:text-3xl font-bold text-[#1e1b4b]">{loading ? '--' : stats.absentCount}</span>
                    <span className="text-[9px] lg:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Absent</span>
                </div>
            </div>

            {/* Service Grid - Updated to 2 columns on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
                {services.map((service, idx) => (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={idx}
                        onClick={() => service.path !== '#' && navigate(service.path)}
                        className="bg-white p-4 md:p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-4 group transition-all text-left"
                    >
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl ${service.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <span className="material-symbols-outlined text-[24px] lg:text-3xl">{service.icon}</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-[#1e1b4b] text-sm lg:text-lg leading-tight">{service.name}</h4>
                            <p className="text-[10px] lg:text-xs text-slate-400 mt-1 font-medium">Access service & details</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default AttendancePage;
