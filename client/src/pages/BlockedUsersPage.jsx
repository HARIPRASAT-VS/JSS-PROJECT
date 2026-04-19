import React, { useState, useEffect } from 'react';
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
        let adminComment = '';
        if (status === 'Rejected') {
            adminComment = prompt('Reason for rejection:');
            if (adminComment === null) return; // User cancelled
            if (!adminComment.trim()) return alert('Comment is required for rejection');
        }

        try {
            await api.post(`/admin/unblock-resolve/${id}`, { status, adminComment });
            fetchData();
        } catch (err) {
            alert('Failed to resolve request');
        }
    };

    return (
        <div className="p-3 lg:p-6 space-y-6 max-w-7xl mx-auto w-full relative z-10 hidden-scrollbar pb-24 animate-in fade-in duration-500">
            <div className="flex justify-between items-end border-b border-slate-100 pb-4 lg:pb-6">
                <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Administrative Terminal</p>
                    <h2 className="text-2xl lg:text-3xl font-black text-indigo-950 tracking-tight">Security Management</h2>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Access Controls Active</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                {/* Section 1: Blocked Users */}
                <div className="space-y-4 lg:space-y-6">
                    <div className="flex items-center gap-2 lg:gap-3 ml-2">
                        <span className="material-symbols-outlined text-red-600 font-black text-[18px] lg:text-[24px]">block</span>
                        <h2 className="text-[10px] lg:text-sm font-black uppercase tracking-[0.15em] text-slate-500">Currently Restricted</h2>
                        <span className="bg-red-100 text-red-700 px-2.5 py-0.5 lg:px-3 lg:py-1 rounded-full text-[10px] font-black">{blockedUsers.length}</span>
                    </div>

                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                        {blockedUsers.length === 0 ? (
                            <div className="py-12 md:py-20 text-center bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                                    <span className="material-symbols-outlined text-slate-200 text-2xl md:text-3xl">verified_user</span>
                                </div>
                                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">No users are currently restricted.</p>
                            </div>
                        ) : (
                            blockedUsers.map(user => (
                                <motion.div 
                                    key={user._id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-50 flex flex-col md:flex-row justify-between md:items-center gap-4 group shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all hover:border-red-100"
                                >
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-red-50 flex shrink-0 items-center justify-center text-red-600 font-black text-lg md:text-xl shadow-sm">
                                            {user.firstName[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm md:text-base text-slate-900">{user.firstName} {user.lastName}</p>
                                            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.email}</p>
                                            <div className="flex items-center gap-2 md:gap-3 mt-1.5 md:mt-2">
                                                <span className="text-[8px] md:text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase tracking-widest border border-orange-100/50">W: {user.warningCount}</span>
                                                <span className="text-[8px] md:text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase tracking-widest border border-red-100/50">H: {user.totalBlockCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right mt-2 md:mt-0">
                                        <p className="text-[8px] md:text-[9px] uppercase font-black text-red-500 bg-red-50 px-2 md:px-3 py-1 rounded-lg inline-block tracking-wider border border-red-100/50">Suspended</p>
                                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-1.5 md:mt-2 font-bold italic truncate md:max-w-[100px]">Lead: {user.facultyId?.firstName || 'System'}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Section 2: Unblock Request */}
                <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center gap-2 md:gap-3 ml-2">
                        <span className="material-symbols-outlined text-indigo-600 font-black text-[18px] md:text-[24px]">pending_actions</span>
                        <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.15em] text-slate-500">Restoration Appeals</h2>
                        <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] font-black">{unblockRequests.length}</span>
                    </div>

                    <div className="space-y-4 md:space-y-6 max-h-[700px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                        {unblockRequests.length === 0 ? (
                            <div className="py-12 md:py-20 text-center bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                                    <span className="material-symbols-outlined text-slate-200 text-2xl md:text-3xl">task_alt</span>
                                </div>
                                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">No pending unblock requests.</p>
                            </div>
                        ) : (
                            unblockRequests.map(req => (
                                <motion.div 
                                    key={req._id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 space-y-4 md:space-y-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-900/5 transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 flex shrink-0 items-center justify-center text-indigo-600 text-[10px] md:text-xs font-black shadow-inner">
                                                UR
                                            </div>
                                            <div>
                                                <p className="text-base md:text-lg font-black text-slate-900">{req.studentId?.firstName} {req.studentId?.lastName}</p>
                                                <div className="flex items-center gap-1.5 md:gap-2 mt-1">
                                                    <p className="text-[8px] md:text-[10px] text-slate-400 font-black tracking-widest uppercase">Rep: {req.facultyId?.firstName}</p>
                                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <p className="text-[8px] md:text-[10px] text-red-500 font-black tracking-widest uppercase">History: {req.studentId?.totalBlockCount || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[8px] md:text-[10px] font-black px-3 py-1 md:px-4 md:py-1.5 rounded-full tracking-widest shadow-sm ${
                                            req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {req.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="p-3 md:p-5 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-50">
                                            <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 md:mb-2">Faculty Verification</p>
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span className={`material-symbols-outlined text-[16px] md:text-xl ${req.facultyVerified ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                    {req.facultyVerified ? 'check_circle' : 'cancel'}
                                                </span>
                                                <p className={`text-[9px] md:text-[10px] font-black uppercase ${req.facultyVerified ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {req.facultyVerified ? 'Letter Received' : 'Not Verified'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-3 md:p-5 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-50">
                                            <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 md:mb-2">Warnings at Block</p>
                                            <p className="text-xs md:text-sm font-black text-indigo-950 uppercase">{req.studentId?.warningCount || 5}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-6 bg-indigo-50/30 rounded-2xl md:rounded-3xl border border-indigo-100/50">
                                        <p className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 md:mb-3">Appeal Reasoning</p>
                                        <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-bold italic">"{req.reason}"</p>
                                    </div>

                                    {req.proofImageUrl && (
                                        <div className="space-y-2 md:space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence Submission</p>
                                                <a href={req.proofImageUrl} target="_blank" rel="noopener noreferrer" className="text-[8px] md:text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Full Res</a>
                                            </div>
                                            <div className="relative h-40 md:h-56 rounded-2xl md:rounded-3xl overflow-hidden border border-slate-100 group shadow-lg">
                                                <img src={req.proofImageUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                <div className="absolute inset-0 bg-indigo-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="bg-white/90 p-3 md:p-4 rounded-full shadow-2xl">
                                                        <span className="material-symbols-outlined text-indigo-600 text-2xl md:text-3xl">zoom_in</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {req.status === 'Pending' && (
                                        <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
                                            <button 
                                                onClick={() => handleResolve(req._id, 'Approved')}
                                                className="w-full md:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 md:py-5 rounded-[1rem] md:rounded-3xl text-[10px] md:text-xs font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-95 uppercase tracking-widest"
                                            >
                                                RESTORE ACCESS
                                            </button>
                                            <button 
                                                onClick={() => handleResolve(req._id, 'Rejected')}
                                                className="w-full md:flex-1 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 py-4 md:py-5 rounded-[1rem] md:rounded-3xl text-[10px] md:text-xs font-black transition-all active:scale-95 uppercase tracking-widest"
                                            >
                                                REJECT APPEAL
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
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
