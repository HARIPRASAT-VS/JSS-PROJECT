import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const AdminDashboard = () => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [unblockRequests, setUnblockRequests] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [blockedRes, reqsRes] = await Promise.all([
                api.get('/admin/blocked-users'),
                api.get('/admin/unblock-requests')
            ]);
            setBlockedUsers(blockedRes.data);
            setUnblockRequests(reqsRes.data);
        } catch (err) {
            console.error('Failure fetching admin data', err);
        }
    };

    const handleResolve = async (id, status) => {
        try {
            await api.post(`/admin/unblock-resolve/${id}`, { status });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to resolve request');
        }
    };

    return (
        <div className="p-3 md:p-6 space-y-4 max-w-7xl mx-auto w-full pb-24">
            <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-2 px-1">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl lg:text-4xl font-black text-indigo-900 tracking-tighter">System Administration</h1>
                    <p className="text-on-surface-variant text-sm font-medium mt-1">Review block statuses and manage unblock appeals securely.</p>
                </motion.div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Blocked Users Box */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[1.5rem] p-5 shadow-sm shadow-indigo-900/5 h-full border border-slate-100"
                >
                    <h4 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">block</span>
                        Blocked Users
                    </h4>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {blockedUsers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No users are currently blocked.</p>
                        ) : (
                            blockedUsers.map(user => (
                                <div key={user._id} className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-red-900 text-xs">{user.firstName} {user.lastName}</p>
                                        <p className="text-[10px] text-red-700/70 truncate max-w-[150px]">{user.email}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                        Warnings Exceeded
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Unblock Requests */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[1.5rem] p-5 shadow-sm shadow-indigo-900/5 border border-slate-100"
                >
                    <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                        Appeals
                    </h4>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                        {unblockRequests.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No pending appeals.</p>
                        ) : (
                            unblockRequests.map(req => (
                                <div key={req._id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] uppercase font-bold text-slate-400">Student</p>
                                            <p className="font-bold text-xs text-indigo-900">{req.studentId?.firstName} {req.studentId?.lastName}</p>
                                            <p className="text-[10px] text-slate-500 mb-1">Faculty: {req.facultyId?.firstName}</p>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                                            req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    
                                    <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Reason</p>
                                        {req.reason}
                                    </div>

                                    {req.proofImageUrl && (
                                        <div>
                                            <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Attached Proof</p>
                                            <a href={req.proofImageUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg h-20 hover:opacity-80 transition-opacity bg-slate-200">
                                                <img src={req.proofImageUrl} alt="Proof" className="w-full h-full object-cover" />
                                            </a>
                                        </div>
                                    )}

                                    {req.status === 'Pending' && (
                                        <div className="flex gap-2 pt-2 border-t border-slate-200 mt-2">
                                            <button onClick={() => handleResolve(req._id, 'Approved')} className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-colors">Approve</button>
                                            <button onClick={() => handleResolve(req._id, 'Rejected')} className="flex-1 py-1.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-100 transition-colors">Reject</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
