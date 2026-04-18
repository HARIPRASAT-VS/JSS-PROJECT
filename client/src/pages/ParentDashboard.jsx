import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import TopAppBar from '../components/TopAppBar';
import SideNavBar from '../components/SideNavBar';
import BottomNavBar from '../components/BottomNavBar';

const ParentDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await API.get('/parent/dashboard');
                setStats(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;

    const attendanceColor = stats?.stats?.attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500';

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <SideNavBar />
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                <TopAppBar title="Parent Portal" />
                
                <main className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Student Profile Overview */}
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <span className="material-symbols-outlined text-4xl">person</span>
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold text-slate-800">{stats?.child?.firstName} {stats?.child?.lastName}</h2>
                            <p className="text-slate-500 font-medium">B.Tech Information Technology</p>
                            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">STUDENT</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-500 text-sm">{stats?.child?.email}</span>
                            </div>
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Attendance Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4 group hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                    <circle 
                                        cx="80" cy="80" r="70" 
                                        stroke="currentColor" strokeWidth="12" fill="transparent" 
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * stats?.stats?.attendancePercentage) / 100}
                                        className={`${attendanceColor} transition-all duration-1000 ease-out`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-4xl font-black ${attendanceColor}`}>{stats?.stats?.attendancePercentage}%</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Attendance</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-500 text-sm font-medium">Current Session History</p>
                                <p className="text-slate-400 text-xs mt-1">{stats?.stats?.presentSessions} of {stats?.stats?.totalSessions} slots attended</p>
                            </div>
                        </div>

                        {/* Fees Card */}
                        <div 
                            onClick={() => navigate('/parent/fees')}
                            className="bg-indigo-900 rounded-3xl p-8 shadow-xl shadow-indigo-900/20 text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                        >
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                            
                            <div className="space-y-1 relative z-10">
                                <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Financial Status</span>
                                <h3 className="text-3xl font-bold">Fee Pending</h3>
                            </div>

                            <div className="mt-8 relative z-10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-medium opacity-60">₹</span>
                                    <span className="text-5xl font-black tracking-tight">{stats?.stats?.totalPending.toLocaleString()}</span>
                                </div>
                                <p className="text-indigo-300 text-sm mt-2 font-medium">Combined Academic & Campus Dues</p>
                            </div>

                            <div className="mt-8 flex items-center justify-between relative z-10">
                                <span className="px-6 py-3 bg-white text-indigo-900 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                                    View Details
                                </span>
                                <span className="material-symbols-outlined text-white/40 group-hover:translate-x-2 transition-transform">arrow_forward_ios</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <BottomNavBar />
        </div>
    );
};

export default ParentDashboard;
