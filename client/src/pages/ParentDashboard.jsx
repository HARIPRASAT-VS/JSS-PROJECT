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
    const [children, setChildren] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState(localStorage.getItem('selectedChildId'));
    const [loading, setLoading] = useState(true);
    const [switchLoading, setSwitchLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSwitcher, setShowSwitcher] = useState(false);

    const fetchDashboardData = async (childId = null) => {
        try {
            setSwitchLoading(true);
            const res = await API.get('/parent/dashboard');
            setStats(res.data);
            if (res.data.child?._id) {
                setSelectedChildId(res.data.child._id);
                localStorage.setItem('selectedChildId', res.data.child._id);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching dashboard');
        } finally {
            setLoading(false);
            setSwitchLoading(false);
        }
    };

    const fetchChildren = async () => {
        try {
            const res = await API.get('/parent/children');
            setChildren(res.data);
            // If no child is selected yet, pick the first one
            if (!localStorage.getItem('selectedChildId') && res.data.length > 0) {
                localStorage.setItem('selectedChildId', res.data[0]._id);
                setSelectedChildId(res.data[0]._id);
            }
        } catch (err) {
            console.error('Error fetching children:', err);
        }
    };

    useEffect(() => {
        fetchChildren();
        fetchDashboardData();
    }, []);

    const handleChildSwitch = (childId) => {
        localStorage.setItem('selectedChildId', childId);
        setSelectedChildId(childId);
        setShowSwitcher(false);
        fetchDashboardData(childId);
    };

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;

    const attendanceColor = stats?.stats?.attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500';

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <SideNavBar />
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                <TopAppBar title={stats?.child?.name ? `Parent of ${stats.child.name}` : "Parent Portal"} />
                
                <main className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Student Profile Overview & Switcher */}
                    <section className="relative">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <span className="material-symbols-outlined text-5xl">person</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                        {stats?.child?.name || 'Loading Name...'}
                                    </h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
                                        {stats?.registryYear || 'Fetching Registry...'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                                        <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">STUDENT</span>
                                        <span className="text-slate-200 ml-1">|</span>
                                        <span className="text-slate-400 text-sm font-medium ml-1">{stats?.child?.email || 'No email found'}</span>
                                    </div>
                                </div>
                            </div>

                            {children.length > 1 && (
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowSwitcher(!showSwitcher)}
                                        className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                        Switch Student
                                        <span className="material-symbols-outlined text-sm">{showSwitcher ? 'expand_less' : 'expand_more'}</span>
                                    </button>

                                    {showSwitcher && (
                                        <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 animate-in zoom-in-95 slide-in-from-top-2 duration-200">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3 border-b border-slate-50 mb-2">My Students</p>
                                            {children.map((child) => (
                                                <button
                                                    key={child._id}
                                                    onClick={() => handleChildSwitch(child._id)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedChildId === child._id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedChildId === child._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            {child.name[0]}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold truncate max-w-[120px]">{child.name}</p>
                                                            <p className="text-[10px] opacity-60 font-medium">{child.year}</p>
                                                        </div>
                                                    </div>
                                                    {selectedChildId === child._id && (
                                                        <span className="material-symbols-outlined text-indigo-500">check_circle</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {switchLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[2.5rem] flex items-center justify-center z-10 animate-in fade-in duration-300">
                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </section>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Attendance Card */}
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-6 group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500">
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="96" cy="96" r="85" stroke="currentColor" strokeWidth="15" fill="transparent" className="text-slate-50" />
                                    <circle 
                                        cx="96" cy="96" r="85" 
                                        stroke="currentColor" strokeWidth="15" fill="transparent" 
                                        strokeDasharray={534}
                                        strokeDashoffset={534 - (534 * stats?.stats?.attendancePercentage) / 100}
                                        className={`${attendanceColor} transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-5xl font-black tracking-tighter ${attendanceColor}`}>
                                        {Number(stats?.stats?.attendancePercentage || 0).toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Attendance</span>
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-slate-800 text-lg font-black tracking-tight">Active Session Status</p>
                                <p className="text-slate-400 font-medium text-sm">{stats?.stats?.presentSessions} of {stats?.stats?.totalSessions} total slots attended</p>
                            </div>
                        </div>

                        {/* Fees Card */}
                        <div 
                            onClick={() => navigate('/parent/fees')}
                            className="bg-indigo-950 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-950/20 text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-all duration-500"
                        >
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                            <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-3xl transition-all"></div>
                            
                            <div className="space-y-2 relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Financial Standing</span>
                                </div>
                                <h3 className="text-4xl font-black tracking-tight">Fee Pending</h3>
                            </div>

                            <div className="mt-10 relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold opacity-40">₹</span>
                                    <span className="text-7xl font-black tracking-tighter tabular-nums">{stats?.stats?.totalPending?.toLocaleString()}</span>
                                </div>
                                <p className="text-indigo-300/80 text-sm mt-3 font-bold uppercase tracking-widest text-[10px]">Academic, Hostel & Multi-Campus Dues</p>
                            </div>

                            <div className="mt-12 flex items-center justify-between relative z-10">
                                <button className="px-8 py-4 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-lg shadow-white/10">
                                    View Full Ledger
                                </button>
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                                    <span className="material-symbols-outlined text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <BottomNavBar />
            
            {/* Click outside switcher to close */}
            {showSwitcher && <div className="fixed inset-0 z-40" onClick={() => setShowSwitcher(false)}></div>}
        </div>
    );
};

export default ParentDashboard;
