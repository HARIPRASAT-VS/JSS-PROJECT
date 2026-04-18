import React, { useState, useEffect } from 'react';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';
import { motion } from 'framer-motion';
import api from '../utils/api';

const BlockedUsersPage = () => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [unblockRequests, setUnblockRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [blockedRes, reqsRes] = await Promise.all([
                api.get('/admin/blocked-users'),
                api.get('/admin/unblock-requests')
            ]);
            setBlockedUsers(blockedRes.data);
            setUnblockRequests(reqsRes.data);
        } catch (err) {
            console.error('Failure fetching data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id, status) => {
        try {
            await api.post(`/admin/unblock-resolve/${id}`, { status });
            fetchData();
        } catch (err) {
            alert('Failed to resolve request');
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            <SideNavBar />
            <main className="flex-1 md:ml-64 flex flex-col">
                <TopAppBar />
                
                <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto w-full">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Security Management</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Section 1: Blocked Users */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <span className="material-symbols-outlined text-red-600 font-black">block</span>
                                <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-500">Currently Blocked</h2>
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black">{blockedUsers.length}</span>
                            </div>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {blockedUsers.length === 0 ? (
                                    <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                                        <p className="text-slate-300 text-sm font-medium">No users are currently restricted.</p>
                                    </div>
                                ) : (
                                    blockedUsers.map(user => (
                                        <motion.div 
                                            key={user._id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center group shadow-sm hover:shadow-md transition-all hover:border-red-100"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 font-black text-xl">
                                                    {user.firstName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] uppercase font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg inline-block tracking-wider">Suspended</p>
                                                <p className="text-[10px] text-slate-400 mt-2 font-bold italic">Ref: {user.facultyId?.firstName || 'System'}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Section 2: Unblock Request */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <span className="material-symbols-outlined text-indigo-600 font-black">pending_actions</span>
                                <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-500">Unblock Appeals</h2>
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">{unblockRequests.length}</span>
                            </div>

                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {unblockRequests.length === 0 ? (
                                    <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                                        <p className="text-slate-300 text-sm font-medium">No pending unblock requests.</p>
                                    </div>
                                ) : (
                                    unblockRequests.map(req => (
                                        <motion.div 
                                            key={req._id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 space-y-5 shadow-sm hover:shadow-lg transition-all"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-black">
                                                        UR
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{req.studentId?.firstName} {req.studentId?.lastName}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Lead: {req.facultyId?.firstName}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-full tracking-widest ${
                                                    req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                    req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {req.status.toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Appeal Reasoning</p>
                                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{req.reason}</p>
                                            </div>

                                            {req.proofImageUrl && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidence Photo</p>
                                                    <a href={req.proofImageUrl} target="_blank" rel="noopener noreferrer" className="block relative h-48 rounded-2xl overflow-hidden border border-slate-100 group">
                                                        <img src={req.proofImageUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                        <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="bg-white/90 backdrop-blur p-3 rounded-full shadow-xl">
                                                                <span className="material-symbols-outlined text-indigo-600">visibility</span>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </div>
                                            )}

                                            {req.status === 'Pending' && (
                                                <div className="flex gap-3 pt-2">
                                                    <button 
                                                        onClick={() => handleResolve(req._id, 'Approved')}
                                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
                                                    >
                                                        RESTORE ACCESS
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResolve(req._id, 'Rejected')}
                                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-2xl text-xs font-black transition-all active:scale-95"
                                                    >
                                                        DECLINE
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}} />
        </div>
    );

};

export default BlockedUsersPage;
