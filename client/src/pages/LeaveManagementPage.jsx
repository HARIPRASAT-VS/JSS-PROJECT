import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const LEAVE_TYPES = ['Sick Leave', 'Emergency Leave', 'On Duty', 'Leave'];

const getExactDateTime = (dateStr, timeStr) => {
    const d = new Date(dateStr);
    if (!timeStr) return d;
    const [h, m] = timeStr.split(':');
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    return d;
};

const StudentLeaveCard = ({ item, statusStyle }) => {
    const [liveStat, setLiveStat] = useState(item.status);
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (item.status !== 'Approved') return;
        const tick = () => {
            const now = new Date();
            const from = getExactDateTime(item.startDate || item.fromDate, item.startTime);
            const to = getExactDateTime(item.endDate || item.toDate, item.endTime);
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
    }, [item]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100"
        >
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{item.type}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {new Date(item.startDate).toLocaleDateString()} {item.startTime && `(${(() => {
                        const [h, m] = item.startTime.split(':');
                        const d = new Date(); d.setHours(h, m);
                        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    })()})`} 
                    {' → '} 
                    {new Date(item.endDate).toLocaleDateString()} {item.endTime && `(${(() => {
                        const [h, m] = item.endTime.split(':');
                        const d = new Date(); d.setHours(h, m);
                        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    })()})`}
                </p>
                <p className="text-xs text-slate-400 italic mt-1">"{item.reason}"</p>
                {item.facultyId && (
                    <p className="text-[10px] text-indigo-500 font-bold mt-1">
                        Assigned to: {item.facultyId.firstName} {item.facultyId.lastName}
                    </p>
                )}
            </div>
            
            <div className="flex flex-col items-end gap-1.5">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    liveStat === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    liveStat === 'Expired' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                    liveStat === 'Upcoming' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    statusStyle(liveStat)
                }`}>
                    {liveStat}
                </span>
                {countdown && (
                    <span className="text-[10px] font-black text-blue-600 tracking-widest border border-blue-200 bg-blue-50 px-2 rounded-md">
                        {countdown}
                    </span>
                )}
            </div>
        </motion.div>
    );
};
const LeaveManagementPage = () => {
    const { user } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        type: 'Sick Leave',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        reason: '',
        facultyId: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [formMsg, setFormMsg] = useState(null); // { type: 'success'|'error', text }

    const [yearFaculties, setYearFaculties] = useState([]);
    const [studentYear, setStudentYear] = useState(null);
    const [facLoading, setFacLoading] = useState(true);

    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchYearFaculties();
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/student/leaves');
            setHistory(data);
        } catch (err) {
            console.error('Could not fetch leave history', err);
        }
    };

    const fetchYearFaculties = async () => {
        setFacLoading(true);
        try {
            const { data } = await api.get('/student/year-faculties');
            setYearFaculties(data.faculties || []);
            setStudentYear(data.year || null);
        } catch (err) {
            console.error('Could not fetch year faculties', err);
        } finally {
            setFacLoading(false);
        }
    };

    const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormMsg(null);

        // ── 24-hour minimum gap validation ──────────────────────────────
        if (formData.startDate && formData.endDate) {
            const from = new Date(formData.startDate);
            const to   = new Date(formData.endDate);
            const diffHrs = (to - from) / (1000 * 60 * 60);
            if (diffHrs < 24) {
                setFormMsg({ type: 'error', text: 'End date must be at least 24 hours after the start date.' });
                return;
            }
        }
        // ────────────────────────────────────────────────────────────────

        if (!formData.facultyId) {
            setFormMsg({ type: 'error', text: 'Please select a faculty for your leave request.' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post('/student/leaves', {
                type: formData.type,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                reason: formData.reason,
                facultyId: formData.facultyId,
            });
            setFormMsg({ type: 'success', text: 'Leave request submitted successfully!' });
            setHistory(h => [res.data, ...h]);
            setFormData({ type: 'Sick Leave', startDate: '', endDate: '', startTime: '', endTime: '', reason: '', facultyId: '' });
        } catch (err) {
            setFormMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit request.' });
        } finally {
            setSubmitting(false);
        }
    };

    const statusStyle = (s) => ({
        Pending:  'bg-amber-50 text-amber-700 border-amber-200',
        Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Rejected: 'bg-red-50 text-red-600 border-red-200',
    }[s] || 'bg-slate-100 text-slate-500 border-slate-200');

    const [showHistory, setShowHistory] = useState(true);

    return (
        <div className="p-3 md:p-6 space-y-6 max-w-7xl mx-auto w-full relative z-10 hidden-scrollbar pb-24">
            {/* Page Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-[#5b3eb5] font-semibold tracking-wider text-[10px] md:text-xs uppercase">Management Console</p>
                    <h3 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Leave Approval</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowHistory(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${showHistory ? 'bg-[#1e1b4b] text-white shadow-lg shadow-indigo-900/20' : 'bg-white text-slate-500 border border-slate-100'}`}
                    >
                        History
                    </button>
                    <button 
                        onClick={() => setShowHistory(false)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!showHistory ? 'bg-[#1e1b4b] text-white shadow-lg shadow-indigo-900/20' : 'bg-white text-slate-500 border border-slate-100'}`}
                    >
                        Request
                    </button>
                </div>
            </section>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Application Form - Hidden if showing history on mobile */}
                <AnimatePresence mode="wait">
                    {!showHistory ? (
                        <div className="w-full lg:w-5/12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[1.5rem] p-5 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100"
                    >
                        <h4 className="text-lg font-bold text-indigo-900 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
                            Apply Leave
                        </h4>

                        <AnimatePresence>
                            {formMsg && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-[10px] md:text-xs font-bold ${
                                        formMsg.type === 'success'
                                            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                            : 'bg-red-50 border border-red-100 text-red-600'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {formMsg.type === 'success' ? 'check_circle' : 'warning'}
                                    </span>
                                    {formMsg.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Leave Type */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide ml-1">Type of Leave</label>
                                <select name="type" value={formData.type} onChange={handleChange}
                                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-xs outline-none font-medium text-slate-800">
                                    {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Faculty Selector */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide ml-1">Select Faculty</label>
                                {facLoading ? (
                                    <div className="w-full bg-slate-50 rounded-xl py-2.5 px-3 text-xs text-slate-300 font-medium animate-pulse">
                                        Loading year faculties...
                                    </div>
                                ) : yearFaculties.length === 0 ? (
                                    <div className="w-full bg-amber-50 border border-amber-100 rounded-xl py-2.5 px-3 text-[10px] text-amber-600 font-bold">
                                        ⚠ No faculties found for your year. Contact admin.
                                    </div>
                                ) : (
                                    <select name="facultyId" value={formData.facultyId} onChange={handleChange} required
                                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-xs outline-none font-medium text-slate-800">
                                        <option value="">— Select a Faculty —</option>
                                        {yearFaculties.map(f => (
                                            <option key={f._id} value={f._id}>
                                                {f.firstName} {f.lastName} ({f.email})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide ml-1">Start Date</label>
                                    <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} required
                                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-xs outline-none font-medium text-slate-800" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide ml-1">End Date</label>
                                    <input
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        required
                                        min={formData.startDate
                                            ? new Date(new Date(formData.startDate).getTime() + 24 * 60 * 60 * 1000)
                                                .toISOString().split('T')[0]
                                            : undefined}
                                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-xs outline-none font-medium text-slate-800" />
                                    {formData.startDate && formData.endDate && (() => {
                                        const gap = (new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60);
                                        return gap < 24 ? (
                                            <p className="text-[9px] text-red-500 font-bold mt-1">
                                                ⚠ Minimum 24hr gap required
                                            </p>
                                        ) : null;
                                    })()}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide ml-1">Start Time</label>
                                    <input name="startTime" type="time" value={formData.startTime} onChange={handleChange} required
                                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-xs outline-none font-medium text-slate-800" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide ml-1">End Time</label>
                                    <input name="endTime" type="time" value={formData.endTime} onChange={handleChange} required
                                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-xs outline-none font-medium text-slate-800" />
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide ml-1">Reason for Leave</label>
                                <textarea name="reason" value={formData.reason} onChange={handleChange} rows="3" required
                                    placeholder="Briefly describe your request..."
                                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-3 text-xs resize-none outline-none font-medium text-slate-800" />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || yearFaculties.length === 0}
                                className="w-full bg-[#5b3eb5] text-white py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm shadow-sm md:shadow-lg shadow-[#5b3eb5]/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                            >
                                {submitting
                                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                                    : 'Submit Request'}
                            </button>
                        </form>
                    )}

                    {/* Leave History - Always visible on desktop, or if showHistory is true on mobile */}
                    {(showHistory || window.innerWidth > 1024) && (
                        <div className="w-full lg:w-7/12">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-[1.5rem] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col h-full min-h-[400px]"
                            >
                                <div className="p-5 md:p-8 pb-3 md:pb-4 flex items-center justify-between border-b border-slate-50">
                                    <h4 className="text-lg md:text-xl font-bold text-indigo-900">Leave History</h4>
                                    <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">
                                        {history.length} Requests
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 space-y-3 hidden-scrollbar">
                                    {history.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">inbox</span>
                                            <p className="text-sm text-slate-400 font-medium">No leave requests submitted yet</p>
                                        </div>
                                    ) : (
                                        <AnimatePresence>
                                            {history.map((item, i) => (
                                                <StudentLeaveCard key={item._id || i} item={item} statusStyle={statusStyle} />
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LeaveManagementPage;
