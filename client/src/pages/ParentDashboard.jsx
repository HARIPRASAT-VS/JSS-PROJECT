import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';

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
        <div className="p-3 lg:p-6 space-y-4 max-w-7xl mx-auto w-full relative pb-24">
            <main className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Student Profile Overview & Switcher */}
                <section className="relative">
                    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center gap-4 transition-all">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                <span className="material-symbols-outlined text-3xl">person</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {stats?.child?.name || 'Loading Name...'}
                                </h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                                    {stats?.registryYear || 'Fetching Registry...'}
                                </p>
                                <div className="flex items-center gap-2 mt-2 justify-center">
                                    <span className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm shadow-indigo-600/20">STUDENT</span>
                                </div>
                            </div>
                        </div>

                        {children.length > 1 && (
                            <div className="relative w-full">
                                <button 
                                    onClick={() => setShowSwitcher(!showSwitcher)}
                                    className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                    Switch Student
                                    <span className="material-symbols-outlined text-sm">{showSwitcher ? 'expand_less' : 'expand_more'}</span>
                                </button>

                                {showSwitcher && (
                                    <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in zoom-in-95 slide-in-from-top-2 duration-200 text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 border-b border-slate-50 mb-1">My Students</p>
                                        {children.map((child) => (
                                            <button
                                                key={child._id}
                                                onClick={() => handleChildSwitch(child._id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedChildId === child._id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${selectedChildId === child._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        {child.name[0]}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-bold truncate max-w-[120px]">{child.name}</p>
                                                        <p className="text-[9px] opacity-60 font-medium">{child.year}</p>
                                                    </div>
                                                </div>
                                                {selectedChildId === child._id && (
                                                    <span className="material-symbols-outlined text-indigo-500 text-sm">check_circle</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {switchLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[1.5rem] flex items-center justify-center z-10 animate-in fade-in duration-300">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Attendance Card */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                                <circle 
                                    cx="72" cy="72" r="60" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray={377}
                                    strokeDashoffset={377 - (377 * stats?.stats?.attendancePercentage) / 100}
                                    className={`${attendanceColor} transition-all duration-1000 ease-out`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-black tracking-tighter ${attendanceColor}`}>
                                    {Number(stats?.stats?.attendancePercentage || 0).toFixed(1)}%
                                </span>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Attendance</span>
                            </div>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-slate-800 text-sm font-black tracking-tight">Active Session Status</p>
                            <p className="text-slate-400 font-medium text-xs">{stats?.stats?.presentSessions} of {stats?.stats?.totalSessions} total slots attended</p>
                        </div>
                    </div>

                    {/* Fees Card */}
                    <div 
                        onClick={() => navigate('/parent/fees')}
                        className="bg-indigo-950 rounded-[1.5rem] p-6 shadow-md shadow-indigo-950/20 text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all duration-300"
                    >
                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px]"></div>
                        
                        <div className="space-y-1 relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                <span className="text-indigo-200 text-[9px] font-black uppercase tracking-[0.2em]">Financial Standing</span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Fee Pending</h3>
                        </div>

                        <div className="mt-6 relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold opacity-40">₹</span>
                                <span className="text-5xl font-black tracking-tighter tabular-nums">{stats?.stats?.totalPending?.toLocaleString()}</span>
                            </div>
                            <p className="text-indigo-300/80 text-[9px] mt-2 font-bold uppercase tracking-widest">Academic, Hostel & Multi-Campus Dues</p>
                        </div>

                        <div className="mt-8 flex items-center justify-between relative z-10">
                            <button className="px-5 py-3 bg-white text-indigo-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm">
                                View Full Ledger
                            </button>
                            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/60 text-sm">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
                        
            {/* Click outside switcher to close */}
            {showSwitcher && <div className="fixed inset-0 z-40" onClick={() => setShowSwitcher(false)}></div>}
        </div>
    );
};

export default ParentDashboard;
