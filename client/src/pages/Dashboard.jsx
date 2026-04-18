import React, { useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import CheckInCard from '../components/CheckInCard';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ percentage: '0.0', presentCount: 0, absentCount: 0, lateCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/attendance/stats');
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch real stats');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen pb-20 md:pb-0 bg-surface-container-lowest">
            <SideNavBar />
            <main className="flex-1 md:ml-64 flex flex-col relative min-h-screen">
                <TopAppBar />
                
                <div className="p-4 md:p-10 space-y-6 max-w-7xl mx-auto w-full">
                    {/* Welcome Header */}
                    <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <h1 className="text-2xl md:text-4xl font-black text-indigo-900 tracking-tighter">Academic Overview</h1>
                            <p className="text-on-surface-variant text-sm font-medium mt-1">Welcome back, {user?.firstName}.</p>
                        </motion.div>
                    </section>

                    {/* Attendance Hero - Moved to Top */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/10 group w-full"
                    >
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase inline-block mb-4">Live Aggregate</span>
                                <h3 className="text-5xl md:text-6xl font-black tracking-tighter flex items-end">
                                    {loading ? '---' : stats.percentage}<span className="text-primary-fixed text-2xl md:text-3xl mb-1 ml-1">%</span>
                                </h3>
                                <p className="text-indigo-100 font-medium text-sm md:text-base mt-2 opacity-90">Subject-wise Attendance</p>
                            </div>
                            <div className="flex items-center gap-4 border-t border-white/20 pt-4 md:border-t-0 md:pt-0">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1.5">Status</p>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border font-sans tracking-wide ${parseFloat(stats.percentage) > 75 ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' : 'bg-amber-400/20 text-amber-300 border-amber-400/30'}`}>
                                        {parseFloat(stats.percentage) > 75 ? 'EXEMPLARY' : 'NEEDS ATTENTION'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    </motion.div>

                    {/* Check-In Interaction */}
                    <div className="w-full">
                        <CheckInCard />
                    </div>
                </div>

                <BottomNavBar />
            </main>
        </div>
    );
};

export default Dashboard;
