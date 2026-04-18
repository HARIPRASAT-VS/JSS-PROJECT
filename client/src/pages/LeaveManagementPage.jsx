import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const LEAVE_TYPES = ['Sick Leave', 'Emergency Leave', 'On Duty', 'Leave'];

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

    return (
        <div className="flex min-h-screen bg-surface-container-lowest pb-20 md:pb-0">
            <SideNavBar />
            <main className="flex-1 md:ml-64 flex flex-col relative min-h-screen">
                <TopAppBar />

                <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full relative z-10">
                    {/* Page Header */}
                    <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-primary font-semibold tracking-wider text-xs uppercase">Management Console</p>
                            <h3 className="text-4xl font-extrabold text-on-surface tracking-tight">Leave Requests</h3>
                        </div>
                        {studentYear && (
                            <div className="bg-indigo-50 border border-indigo-100 px-5 py-3 rounded-2xl flex items-center gap-3">
                                <span className="material-symbols-outlined text-indigo-400">school</span>
                                <div>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Your Year</p>
                                    <p className="text-sm font-black text-indigo-900">{studentYear}</p>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Application Form */}
                        <div className="lg:col-span-5">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-[2rem] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100"
                            >
                                <h4 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">add_circle</span>
                                    Apply Leave
                                </h4>

                                <AnimatePresence>
                                    {formMsg && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className={`mb-5 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
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

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Leave Type */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide ml-1">Type of Leave</label>
                                        <select name="type" value={formData.type} onChange={handleChange}
                                            className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm outline-none font-medium">
                                            {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    {/* Faculty Selector */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide ml-1">Select Faculty</label>
                                        {facLoading ? (
                                            <div className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm text-slate-300 font-medium animate-pulse">
                                                Loading year faculties...
                                            </div>
                                        ) : yearFaculties.length === 0 ? (
                                            <div className="w-full bg-amber-50 border border-amber-100 rounded-xl py-3 px-4 text-xs text-amber-600 font-bold">
                                                ⚠ No faculties found for your year. Contact admin.
                                            </div>
                                        ) : (
                                            <select name="facultyId" value={formData.facultyId} onChange={handleChange} required
                                                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm outline-none font-medium">
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide ml-1">Start Date</label>
                                            <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} required
                                                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm outline-none font-medium" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide ml-1">End Date</label>
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
                                                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm outline-none font-medium" />
                                            {formData.startDate && formData.endDate && (() => {
                                                const gap = (new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60);
                                                return gap < 24 ? (
                                                    <p className="text-[10px] text-red-500 font-bold mt-1">
                                                        ⚠ Minimum 24-hour gap required
                                                    </p>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide ml-1">Start Time</label>
                                                <input name="startTime" type="time" value={formData.startTime} onChange={handleChange} required
                                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm outline-none font-medium" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide ml-1">End Time</label>
                                                <input name="endTime" type="time" value={formData.endTime} onChange={handleChange} required
                                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm outline-none font-medium" />
                                            </div>
                                        </div>

                                        {/* Reason */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide ml-1">Reason for Leave</label>
                                        <textarea name="reason" value={formData.reason} onChange={handleChange} rows="4" required
                                            placeholder="Briefly describe your request..."
                                            className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm resize-none outline-none font-medium" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || yearFaculties.length === 0}
                                        className="w-full bg-[#5b3eb5] text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-[#5b3eb5]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting
                                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                                            : 'Submit Request'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>

                        {/* Leave History */}
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-[2rem] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col h-full"
                            >
                                <div className="p-8 pb-4 flex items-center justify-between">
                                    <h4 className="text-xl font-bold text-indigo-900">Leave History</h4>
                                    <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
                                        {history.length} Requests
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-3">
                                    {history.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">inbox</span>
                                            <p className="text-sm text-slate-400 font-medium">No leave requests submitted yet</p>
                                        </div>
                                    ) : (
                                        <AnimatePresence>
                                            {history.map((item, i) => (
                                                <motion.div
                                                    key={item._id || i}
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
                                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusStyle(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <BottomNavBar />
            </main>
        </div>
    );
};

export default LeaveManagementPage;
