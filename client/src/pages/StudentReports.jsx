import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const REPORT_TYPES = [
    { id: 'TESTMARK', label: 'Test Mark', icon: 'description', color: 'indigo' },
    { id: 'SEM RESULT', label: 'Sem Result', icon: 'school', color: 'emerald' },
    { id: 'INTERNAL MARK', label: 'Internal Mark', icon: 'assignment', color: 'amber' },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

const RenderSelection = ({ navigate }) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {REPORT_TYPES.map(rt => (
            <motion.button
                key={rt.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/student/reports/${rt.id}`)}
                className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2 group hover:border-indigo-200 transition-all select-none"
            >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white pointer-events-none">
                    <span className="material-symbols-outlined text-2xl md:text-3xl select-none" aria-hidden="true">{rt.icon}</span>
                </div>
                <h3 className="text-[10px] md:text-lg font-black text-indigo-950 uppercase tracking-tight select-none pointer-events-none">{rt.label}</h3>
            </motion.button>
        ))}
    </div>
);

const RenderList = ({ type, loading, error, tests, fetchTests, navigate }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate('/student/reports')} className="flex items-center gap-2 text-indigo-100 font-black text-xs uppercase tracking-widest bg-indigo-600 px-4 py-2 rounded-full shadow-sm select-none">
                <span className="material-symbols-outlined text-sm select-none pointer-events-none" aria-hidden="true">arrow_back</span> Choose Type
            </button>
            <div className="text-right pointer-events-none select-none">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{type}</p>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">Your Assessments</h2>
            </div>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState error={error} retry={fetchTests} /> : tests.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 select-none pointer-events-none" aria-hidden="true">inbox</span>
                <p className="text-sm text-slate-400 font-medium select-none pointer-events-none">No {type.toLowerCase()} records found yet</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {tests.map(test => (
                    <motion.div
                        key={test._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => navigate(`/student/reports/${type}/${test._id}`)}
                        className="p-5 md:p-6 rounded-3xl bg-white border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group select-none"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors pointer-events-none select-none">
                                    <span className="material-symbols-outlined select-none pointer-events-none" aria-hidden="true">analytics</span>
                                </div>
                                <div className="min-w-0 pointer-events-none select-none">
                                    <h4 className="text-sm md:text-base font-black text-slate-900 truncate">{test.testName}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(test.testDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <span className="shrink-0 material-symbols-outlined text-slate-300 group-hover:text-indigo-600 transition-colors select-none pointer-events-none">chevron_right</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
    </div>
);

const RenderDetails = ({ details, testId, type, loading, error, fetchDetails, navigate }) => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} retry={fetchDetails} />;
    if (!details) return null;

    const scorePercent = details.myScore?.isAbsent ? 0 : Math.round((details.myScore?.value / details.totalMarks) * 100);
    const avgPercent = Math.round((details.classAverage / details.totalMarks) * 100);

    return (
        <div className="space-y-6 md:space-y-8">
            <button onClick={() => navigate(`/student/reports/${type}`)} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm select-none">
                <span className="material-symbols-outlined text-sm select-none pointer-events-none" aria-hidden="true">arrow_back</span> Full List
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl -tranne-x-10 -translate-y-10" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2 pointer-events-none select-none">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">{details.testType}</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight leading-none uppercase">{details.testName}</h2>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                             <span className="material-symbols-outlined text-sm select-none pointer-events-none" aria-hidden="true">person</span> Verified by {details.facultyName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Result Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-900/10 pointer-events-none select-none">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Your Performance</p>
                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-6xl font-black leading-none">{details.myScore?.isAbsent ? 'AB' : details.myScore?.value}</span>
                        <span className="text-xl font-bold text-indigo-400 mb-2">/ {details.totalMarks}</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span>Efficiency</span>
                            <span>{scorePercent}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${scorePercent}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full ${scorePercent >= 75 ? 'bg-emerald-400' : scorePercent >= 40 ? 'bg-indigo-400' : 'bg-rose-400'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Class Benchmark */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm pointer-events-none select-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Class Benchmark</p>
                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-6xl font-black text-slate-900 leading-none">{details.classAverage}</span>
                        <span className="text-xl font-bold text-slate-300 mb-2">avg</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span>Global Performance</span>
                            <span>{avgPercent}%</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${avgPercent}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                className="h-full bg-slate-300"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic mt-4 text-center">
                            Your performance was {scorePercent >= avgPercent ? 'above' : 'below'} the class average.
                        </p>
                    </div>
                </div>
            </div>

            {/* Assessment Details */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-6 pointer-events-none select-none">
                <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-xs font-black uppercase tracking-tighter ${details.myScore?.isAbsent ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {details.myScore?.isAbsent ? 'Absent' : 'Present'}
                    </p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Test Date</p>
                    <p className="text-xs font-black text-slate-900 uppercase">{new Date(details.testDate).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Assessment Code</p>
                    <p className="text-xs font-black text-slate-900 uppercase">#{testId.slice(-6)}</p>
                </div>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20 pointer-events-none select-none">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Compiling Analytics...</p>
    </div>
);

const ErrorState = ({ error, retry }) => (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center select-none">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 pointer-events-none"><span className="material-symbols-outlined text-3xl select-none" aria-hidden="true">error</span></div>
        <h3 className="text-xl font-black text-slate-900 mb-2 pointer-events-none">Operation Interrupted</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm pointer-events-none">{error}</p>
        <button onClick={retry} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest select-none">Retry Connection</button>
    </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const StudentReports = () => {
    const { type, testId } = useParams();
    const navigate = useNavigate();

    const [tests, setTests] = useState([]);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchTests = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get(`/student/tests?type=${type}`);
            if (res.data.success) setTests(res.data.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed to fetch assessment records.'); }
        finally { setLoading(false); }
    }, [type]);

    const fetchDetails = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get(`/student/tests/${testId}`);
            if (res.data.success) setDetails(res.data.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed to fetch detailed results.'); }
        finally { setLoading(false); }
    }, [testId]);

    useEffect(() => {
        if (type && !testId) fetchTests();
        if (testId) fetchDetails();
    }, [type, testId, fetchTests, fetchDetails]);

    return (
        <div className="p-3 md:p-6 space-y-6 max-w-7xl mx-auto w-full relative z-10 hidden-scrollbar pb-24">
            {!type && (
                <div className="mb-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1 select-none pointer-events-none">Student Portal</p>
                    <h1 className="text-2xl md:text-5xl font-black text-indigo-950 tracking-tight select-none pointer-events-none">Academic Insights</h1>
                </div>
            )}
            <AnimatePresence mode="wait">
                <motion.div key={testId || type || 'root'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    {!type ? <RenderSelection navigate={navigate} /> : 
                     !testId ? <RenderList type={type} loading={loading} error={error} tests={tests} fetchTests={fetchTests} navigate={navigate} /> : 
                     <RenderDetails details={details} testId={testId} type={type} loading={loading} error={error} fetchDetails={fetchDetails} navigate={navigate} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default StudentReports;
