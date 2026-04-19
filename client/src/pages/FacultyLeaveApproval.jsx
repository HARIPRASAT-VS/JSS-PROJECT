import React, { useState, useEffect, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

// ─── Reducer ──────────────────────────────────────────────────────────────────
const initialState = {
    leaves: [],
    loading: true,
    error: null,
    actioning: {}, // { leaveId: 'Approved' | 'Rejected' }
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_LEAVES':
            return { ...state, leaves: action.payload, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'BEGIN_ACTION':
            return { ...state, actioning: { ...state.actioning, [action.payload.id]: action.payload.status } };
        case 'COMMIT_ACTION':
            // Update the status of the specific leave in place
            return {
                ...state,
                actioning: Object.fromEntries(
                    Object.entries(state.actioning).filter(([k]) => k !== action.payload.id)
                ),
                leaves: state.leaves.map(l =>
                    l._id === action.payload.id ? { ...l, status: action.payload.status } : l
                ),
            };
        case 'ROLLBACK_ACTION':
            return {
                ...state,
                actioning: Object.fromEntries(
                    Object.entries(state.actioning).filter(([k]) => k !== action.payload.id)
                ),
            };
        default:
            return state;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getExactDateTime = (dateStr, timeStr) => {
    const d = new Date(dateStr);
    if (!timeStr) return d;
    const [h, m] = timeStr.split(':');
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    return d;
};

const getLeaveStatus = (leave) => {
    if (leave.status !== 'Approved') return leave.status;
    const now = new Date();
    const from = getExactDateTime(leave.startDate || leave.fromDate, leave.startTime);
    const to = getExactDateTime(leave.endDate || leave.toDate, leave.endTime);
    if (now >= from && now <= to) return 'Ongoing';
    if (now > to) return 'Expired';
    return 'Upcoming';
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
const formatTimeString = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const styles = {
        Pending: 'bg-amber-50 text-amber-700 border-amber-200',
        Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Rejected: 'bg-red-50 text-red-600 border-red-200',
        Ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
        Expired: 'bg-slate-100 text-slate-500 border-slate-200',
        Upcoming: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    const dots = {
        Pending: 'bg-amber-500',
        Approved: 'bg-emerald-500',
        Rejected: 'bg-red-500',
        Ongoing: 'bg-blue-500 animate-pulse',
        Expired: 'bg-slate-400',
        Upcoming: 'bg-indigo-500',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles.Pending}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.Pending}`}></span>
            {status}
        </span>
    );
};

// ─── Leave Card ───────────────────────────────────────────────────────────────
const LeaveCard = ({ leave, showActions, onAction, actioning }) => {
    const isPending = leave.status === 'Pending';
    const isActioning = !!actioning[leave._id];

    const [liveStat, setLiveStat] = useState(getLeaveStatus(leave));
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (leave.status !== 'Approved') return;
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
                setLiveStat('Upcoming');
                setCountdown('');
            }
        };
        tick();
        const intId = setInterval(tick, 60000);
        return () => clearInterval(intId);
    }, [leave]);

    const studentName = leave.userId
        ? `${leave.userId.firstName} ${leave.userId.lastName}`
        : 'Unknown Student';
    const studentEmail = leave.userId?.email || '—';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className={`bg-white rounded-3xl border p-6 flex flex-col gap-5 shadow-sm transition-all relative overflow-hidden ${
                isPending ? 'border-slate-100 hover:border-indigo-100 hover:shadow-md' : 'border-slate-100'
            }`}
        >
            {isActioning && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Header row */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                        {studentName[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 truncate">{studentName}</h3>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{studentEmail}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={liveStat} />
                    {countdown && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-200">
                            {countdown}
                        </span>
                    )}
                    {leave.status === 'Rejected' && leave.parentStatus === 'Rejected' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[9px] font-black uppercase tracking-widest border border-rose-200">
                            Rejected by Parent
                        </span>
                    )}
                </div>
            </div>

            {/* Info grid - Optimized for mobile fit */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 bg-slate-50/80 p-3 md:p-4 rounded-2xl border border-slate-100">
                <div className="min-w-0">
                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                    <p className="text-[11px] md:text-sm font-bold text-slate-700 truncate">{leave.type || 'General'}</p>
                </div>
                <div className="min-w-0 text-right">
                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
                    <p className={`text-[11px] md:text-sm font-black ${
                         leave.liveAttendance === null ? 'text-slate-500' :
                         parseFloat(leave.liveAttendance) < 75 ? 'text-red-600' :
                         'text-emerald-600'
                    }`}>{leave.liveAttendance ? `${leave.liveAttendance}%` : '—'}</p>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/50 mt-1">
                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] md:text-sm font-bold text-slate-700">
                        <span>{formatDate(leave.startDate)}</span>
                        <span className="text-slate-300">→</span>
                        <span>{formatDate(leave.endDate)}</span>
                    </div>
                </div>
            </div>

            {/* Reason */}
            {leave.reason && (
                <div className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-sm text-slate-300 mt-0.5">chat_bubble</span>
                    <p className="text-xs text-slate-500 font-medium italic leading-relaxed">"{leave.reason}"</p>
                </div>
            )}

            {/* Action buttons (only for pending) */}
            {showActions && isPending && (
                <div className="pt-2 border-t border-slate-50 relative mt-2">
                    {leave.parentStatus === 'Pending' && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-2xl">
                            <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                Waiting for Parent Approval
                            </span>
                        </div>
                    )}
                    
                    <div className={`flex gap-3 ${leave.parentStatus === 'Pending' ? 'opacity-40 pointer-events-none' : ''}`}>
                        <button
                            disabled={isActioning || leave.parentStatus === 'Pending'}
                            onClick={() => onAction(leave._id, 'Approved')}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-emerald-100 hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-600/20 disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Approve
                        </button>
                        <button
                            disabled={isActioning || leave.parentStatus === 'Pending'}
                            onClick={() => onAction(leave._id, 'Rejected')}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-red-100 hover:border-red-600 hover:shadow-lg hover:shadow-red-600/20 disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined text-base">cancel</span>
                            Reject
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ message, icon }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 col-span-full"
    >
        <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-200 mb-6">
            <span className="material-symbols-outlined text-5xl">{icon}</span>
        </div>
        <p className="text-sm text-slate-400 font-bold">{message}</p>
    </motion.div>
);

// ─── View Tabs ─────────────────────────────────────────────────────────────────
const TABS = [
    { key: 'Pending', label: 'Pending Leaves', icon: 'hourglass_top' },
    { key: 'Approved', label: 'Approved Leaves', icon: 'check_circle' },
    { key: 'Rejected', label: 'Rejected Leaves', icon: 'cancel' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
const FacultyLeaveApproval = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [activeTab, setActiveTab] = useState('Pending');

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await api.get('/faculty/leaves');
            // Standardizing: handle both raw array and { success, data } wrapper
            const leavesData = res.data.success ? res.data.data : res.data;
            dispatch({ type: 'SET_LEAVES', payload: Array.isArray(leavesData) ? leavesData : [] });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.response?.data?.message || 'Failed to load leave requests' });
        }
    };

    const handleAction = async (leaveId, status) => {
        // Optimistic: mark as actioning
        dispatch({ type: 'BEGIN_ACTION', payload: { id: leaveId, status } });
        try {
            await api.post(`/faculty/leaves/${leaveId}`, { status });
            dispatch({ type: 'COMMIT_ACTION', payload: { id: leaveId, status } });
        } catch (err) {
            dispatch({ type: 'ROLLBACK_ACTION', payload: { id: leaveId } });
            alert(err.response?.data?.message || 'Action failed. Please try again.');
        }
    };

    // Derived filtered lists
    const pendingLeaves  = state.leaves.filter(l => l.status === 'Pending');
    const approvedLeaves = state.leaves.filter(l => l.status === 'Approved');
    const rejectedLeaves = state.leaves.filter(l => l.status === 'Rejected');

    const counts = { Pending: pendingLeaves.length, Approved: approvedLeaves.length, Rejected: rejectedLeaves.length };
    const visibleLeaves = activeTab === 'Pending' ? pendingLeaves :
                          activeTab === 'Approved' ? approvedLeaves :
                          rejectedLeaves;

    const emptyMessages = {
        Pending:  { msg: 'No pending leave requests', icon: 'inbox' },
        Approved: { msg: 'No approved leaves yet',     icon: 'check_circle' },
        Rejected: { msg: 'No rejected leaves yet',     icon: 'cancel' },
    };

    return (
        <div className="p-2 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full relative z-10 pb-24 overflow-x-hidden">
            {/* DEBUG TAG - REMOVE LATER */}
            <div className="fixed top-20 right-2 z-50 bg-indigo-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase shadow-lg pointer-events-none">Mobile UI V2</div>

            {/* PAGE HEADER */}
            <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.3em] mb-1">Captain Module</p>
                    <h1 className="text-2xl md:text-4xl font-black text-indigo-950 tracking-tight">Leave Approval</h1>
                    <p className="text-[10px] md:text-sm text-slate-400 font-medium mt-1">Review and action student leave requests</p>
                </div>
                <button
                    onClick={fetchLeaves}
                    disabled={state.loading}
                    className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all font-bold text-xs shadow-sm w-full justify-center lg:w-auto"
                >
                    <span className={`material-symbols-outlined text-base ${state.loading ? 'animate-spin' : ''}`}>refresh</span>
                    Refresh
                </button>
            </section>

            {/* STATS STRIP - Scrollable on very small screens */}
            <div className="flex lg:grid lg:grid-cols-3 gap-2 lg:gap-4 overflow-x-auto no-scrollbar px-0.5 py-1">
                {TABS.map(tab => {
                    const tabStyle = {
                        Pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',  dot: 'bg-amber-500' },
                        Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
                        Rejected: { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100',    dot: 'bg-red-500' },
                    }[tab.key];
                    return (
                        <div key={tab.key} className={`${tabStyle.bg} border ${tabStyle.border} p-2.5 md:p-5 rounded-2xl flex md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left min-w-[100px] flex-1`}>
                            <span className={`material-symbols-outlined text-lg md:text-2xl ${tabStyle.text}`}>{tab.icon}</span>
                            <div className="min-w-0">
                                <p className={`text-sm md:text-3xl font-black ${tabStyle.text} leading-none`}>{counts[tab.key]}</p>
                                <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest leading-tight mt-1 truncate">{tab.label.split(' ')[0]}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1 bg-white border border-slate-100 p-1 lg:p-2 rounded-xl lg:rounded-2xl w-full lg:w-fit shadow-sm shrink-0">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none ${
                            activeTab === tab.key
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        <span className="hidden xs:inline">{tab.label.split(' ')[0]}</span>
                        <span className={`w-3.5 h-3.5 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[8px] md:text-[9px] font-black ${
                            activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {counts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* ERROR STATE */}
            {state.error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 font-bold text-xs md:text-sm">
                    <span className="material-symbols-outlined">error</span>
                    {state.error}
                </div>
            )}

            {/* LEAVE CARDS */}
            <div className="pb-4">
                <AnimatePresence mode="popLayout">
                    {state.loading ? (
                        // Skeleton loaders
                        <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white rounded-[1.5rem] border border-slate-50 p-5 space-y-4 animate-pulse">
                                    <div className="flex justify-between">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-100"></div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-slate-100 rounded-lg w-28"></div>
                                                <div className="h-3 bg-slate-50 rounded-lg w-20"></div>
                                            </div>
                                        </div>
                                        <div className="h-5 bg-slate-50 rounded-full w-16"></div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl">
                                        {[1,2,3,4].map(j => <div key={j} className="h-8 bg-white rounded-lg"></div>)}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : visibleLeaves.length === 0 ? (
                        <EmptyState
                            key="empty"
                            message={emptyMessages[activeTab].msg}
                            icon={emptyMessages[activeTab].icon}
                        />
                    ) : (
                        <motion.div key="list" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {visibleLeaves.map(leave => (
                                <LeaveCard
                                    key={leave._id}
                                    leave={leave}
                                    showActions={activeTab === 'Pending'}
                                    onAction={handleAction}
                                    actioning={state.actioning}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FacultyLeaveApproval;
