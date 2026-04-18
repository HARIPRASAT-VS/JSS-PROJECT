import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
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
        <div className="flex min-h-screen bg-slate-50 pb-20 md:pb-0">
            <SideNavBar />
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Mobile Header matching Image 4 */}
                <div className="md:hidden bg-[#5b3eb5] text-white p-4 flex items-center shadow-md mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="ml-2 font-bold text-lg tracking-wide">My Attendance</h2>
                </div>

                <div className="hidden md:block">
                    <TopAppBar />
                </div>
                
                <div className="p-4 md:p-10 space-y-8 max-w-7xl mx-auto w-full relative z-10">
                    <div className="hidden md:block mb-8">
                        <h1 className="text-3xl font-black text-indigo-900 tracking-tighter">Attendance Services</h1>
                        <p className="text-on-surface-variant font-medium mt-1">Manage your academic tracking and passes.</p>
                    </div>

                    {/* Stats Summary - Matches top of Image 4/5 */}
                    <div className="grid grid-cols-3 gap-3 md:gap-6">
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                            <span className="text-xl md:text-3xl font-bold text-[#5b3eb5]">{loading ? '--' : `${stats.percentage}%`}</span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Attendance</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                            <span className="text-xl md:text-3xl font-bold text-indigo-900">{loading ? '--' : stats.presentCount}</span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Present</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-slate-100">
                            <span className="text-xl md:text-3xl font-bold text-indigo-900">{loading ? '--' : stats.absentCount}</span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Absent</span>
                        </div>
                    </div>

                    {/* Service Grid - Image 4 Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8">
                        {services.map((service, idx) => (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={idx}
                                onClick={() => service.path !== '#' && navigate(service.path)}
                                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group transition-all text-left"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                    <span className="material-symbols-outlined text-3xl">{service.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{service.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">Access service & details</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <BottomNavBar />
            </main>
        </div>
    );
};

export default AttendancePage;
