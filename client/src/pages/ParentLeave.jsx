import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getExactDateTime = (dateStr, timeStr) => {
    const d = new Date(dateStr);
    if (!timeStr) return d;
    const [h, m] = timeStr.split(':');
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    return d;
};

const getLeaveStatus = (leave) => {
    if (leave.parentStatus !== 'Pending') return leave.parentStatus;
    const now = new Date();
    const to = getExactDateTime(leave.endDate || leave.toDate, leave.endTime);
    if (now > to) return 'Expired';
    return 'Pending';
};

const LeaveCard = ({ leave, onAction }) => {
    const [liveStat, setLiveStat] = useState(getLeaveStatus(leave));
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (leave.parentStatus !== 'Pending') return;
        
        const tick = () => {
            const now = new Date();
            const from = getExactDateTime(leave.startDate || leave.fromDate, leave.startTime);
            const to = getExactDateTime(leave.endDate || leave.toDate, leave.endTime);
            
            if (now > to) {
                setLiveStat('Expired');
                setCountdown('');
            } else if (now >= from && now <= to) {
                setLiveStat('Ongoing');
                const diffMs = to - now;
                const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                let parts = [];
                if (d > 0) parts.push(`${d}d`);
                if (h > 0) parts.push(`${h}h`);
                parts.push(`${m}m`);
                setCountdown(parts.join(' ') + ' left');
            } else {
                setLiveStat('Pending');
                setCountdown('');
            }
        };

        tick();
        const intId = setInterval(tick, 60000);
        return () => clearInterval(intId);
    }, [leave]);

    const isExpired = liveStat === 'Expired';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2rem] p-5 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6"
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 shadow-inner">
                        <span className="material-symbols-outlined text-3xl">
                            {leave.type === 'Sick Leave' ? 'medical_services' : 'event_busy'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-indigo-950 tracking-tight">{leave.type}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Application ID: {leave._id.slice(-6)}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                        isExpired ? 'bg-slate-50 text-slate-400 border-slate-200' :
                        liveStat === 'Ongoing' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                        {isExpired ? 'Expired' : 'Authorization Required'}
                    </span>
                    {countdown && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-100">
                             {countdown}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Duration</p>
                    <p className="font-bold text-slate-800 text-xs">
                        {new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                </div>
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Timings</p>
                    <p className="font-bold text-slate-800 text-xs">{leave.startTime} to {leave.endTime}</p>
                </div>
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Live Attendance</p>
                    <p className={`font-black text-xs ${
                         leave.liveAttendance === null ? 'text-slate-500' :
                         parseFloat(leave.liveAttendance) < 75 ? 'text-red-600' :
                         parseFloat(leave.liveAttendance) < 85 ? 'text-amber-600' :
                         'text-emerald-600'
                    }`}>
                        {leave.liveAttendance ? `${leave.liveAttendance}%` : '—'}
                    </p>
                </div>
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Authority</p>
                    <p className="font-bold text-indigo-600 text-[10px] uppercase truncate">{leave.facultyId?.firstName || 'Assigned'}</p>
                </div>
            </div>

            {leave.reason && (
                <div className="flex gap-3 items-start p-2">
                    <span className="material-symbols-outlined text-sm text-slate-300 mt-0.5">chat_bubble</span>
                    <p className="text-xs text-slate-500 font-medium italic leading-relaxed">"{leave.reason}"</p>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button 
                    disabled={isExpired}
                    onClick={() => onAction(leave._id, 'approve')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Approve
                </button>
                <button 
                    onClick={() => onAction(leave._id, 'reject')}
                    className="flex-1 bg-white border border-rose-100 text-rose-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Reject
                </button>
            </div>
        </motion.div>
    );
};

const ParentLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [childName, setChildName] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const [leavesRes, dashRes] = await Promise.all([
                API.get('/parent/leave'),
                API.get('/parent/dashboard')
            ]);
            setLeaves(leavesRes.data);
            setChildName(dashRes.data.child?.name || '');
        } catch (err) {
            console.error('Error fetching leaves:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleAction = async (id, action) => {
        try {
            setLeaves(prev => prev.map(l => {
                if (l._id !== id) return l;
                return {
                    ...l,
                    parentStatus: action === 'approve' ? 'Approved' : 'Rejected',
                    status: action === 'reject' ? 'Rejected' : l.status
                };
            }));
            await API.patch(`/parent/leave/${id}/${action}`);
            fetchLeaves();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating leave status');
            fetchLeaves();
        }
    };

    const pendingLeaves = leaves.filter(l => l.parentStatus === 'Pending');

    return (
        <div className="p-3 md:p-6 space-y-6 max-w-4xl mx-auto w-full relative z-10 pb-24">
            <div className="mb-2 md:mb-6">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Guardian Portal</p>
                <h2 className="text-2xl md:text-4xl font-black text-indigo-950 tracking-tighter">Authorization</h2>
                <p className="text-[10px] md:text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">Review and approve {childName}'s requests</p>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Records...</p>
                </div>
            ) : (
                <section>
                    {pendingLeaves.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-5xl">task_alt</span>
                            </div>
                            <h3 className="text-xl font-black text-indigo-950 mb-1">Inbox Zero</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All authorization requests resolved</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-4">
                                {pendingLeaves.map(leave => (
                                    <LeaveCard key={leave._id} leave={leave} onAction={handleAction} />
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </section>
            )}
        </div>
    );
};

export default ParentLeave;
