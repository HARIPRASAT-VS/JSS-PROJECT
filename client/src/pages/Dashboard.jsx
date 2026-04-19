import React, { useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
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
        <div className="p-3 md:p-6 space-y-4 max-w-7xl mx-auto w-full pb-24">
            {/* Welcome Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-2 px-1">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl md:text-4xl font-black text-indigo-900 tracking-tighter">Academic Overview</h1>
                    <p className="text-on-surface-variant text-sm font-medium mt-1">Welcome back, {user?.firstName}.</p>
                </motion.div>
            </section>

            {/* Attendance Hero - Moved to Top */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary to-primary-container rounded-[1.5rem] p-4 md:p-6 text-white relative overflow-hidden shadow-sm shadow-indigo-900/5 w-full"
            >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase inline-block mb-3">Live Aggregate</span>
                        <h3 className="text-4xl md:text-5xl font-black tracking-tighter flex items-end">
                            {loading ? '---' : stats.percentage}<span className="text-primary-fixed text-xl md:text-2xl mb-1 ml-1">%</span>
                        </h3>
                        <p className="text-indigo-100 font-medium text-xs md:text-sm mt-1 opacity-90">Subject-wise Attendance</p>
                    </div>
                    <div className="flex items-center gap-4 border-t border-white/20 pt-3 md:border-t-0 md:pt-0">
                        <div>
                            <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Status</p>
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
    );
};

export default Dashboard;
