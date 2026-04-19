import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const REPORT_TYPES = [
    { id: 'TESTMARK', label: 'Test Mark', icon: 'description', color: 'indigo' },
    { id: 'SEM RESULT', label: 'Sem Result', icon: 'school', color: 'emerald' },
    { id: 'INTERNAL MARK', label: 'Internal Mark', icon: 'assignment', color: 'amber' },
];

// ─── Sub-Components (Defined OUTSIDE to prevent focus loss) ───────────────────

const RenderSelection = ({ navigate }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REPORT_TYPES.map(rt => (
            <motion.button
                key={rt.id}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => navigate(`/faculty/reports/${rt.id}`)}
                className="p-10 rounded-[2.5rem] bg-white border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-left relative overflow-hidden group"
            >
                <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white`}>
                        <span className="material-symbols-outlined text-4xl">{rt.icon}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-950 mb-2">{rt.label}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historical Performance</p>
                </div>
            </motion.button>
        ))}
    </div>
);

const RenderList = ({ type, loading, error, tests, testSearchQuery, setTestSearchQuery, fetchTests, navigate }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate('/faculty/reports')} className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Choose Type
            </button>
            <div className="text-right">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{type}</p>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">Active Assessments</h2>
            </div>
        </div>

        <div className="mb-10 relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within:text-indigo-600 transition-colors text-xl">search</span>
            <input 
                type="text"
                value={testSearchQuery}
                onChange={e => setTestSearchQuery(e.target.value)}
                placeholder="Search assessments by name..."
                className="w-full bg-white border border-slate-100 rounded-[2rem] py-6 pl-16 pr-14 text-sm font-bold outline-none transition-all shadow-sm shadow-indigo-900/5 focus:shadow-xl focus:shadow-indigo-900/10 focus:border-indigo-200"
            />
            {testSearchQuery && (
                <button onClick={() => setTestSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">close</span>
                </button>
            )}
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState error={error} retry={fetchTests} /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.filter(t => t.testName?.toLowerCase().includes(testSearchQuery.toLowerCase())).map(test => (
                    <motion.div
                        key={test._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => navigate(`/faculty/reports/${type}/${test._id}`)}
                        className="p-6 rounded-3xl bg-white border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <span className="material-symbols-outlined">analytics</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(test.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-1 truncate">{test.testName}</h4>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">Max {test.totalMarks}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
    </div>
);

const RenderDetails = ({ details, type, loading, error, searchQuery, setSearchQuery, attendanceFilter, setAttendanceFilter, sortOrder, setSortOrder, filteredScores, fetchDetails, navigate }) => (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <button onClick={() => navigate(`/faculty/reports/${type}`)} className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-4">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> List View
                </button>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">{details?.testType || 'Report Detail'}</p>
                <h2 className="text-4xl font-black text-slate-950 tracking-tight">{details?.testName}</h2>
            </div>
            <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-8">
                <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total</p>
                    <p className="text-xl font-black text-slate-900">{details?.totalMarks}<span className="text-[10px] text-slate-300 ml-1">pts</span></p>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Enrolled</p>
                    <p className="text-xl font-black text-slate-900">{details?.scores?.length || 0}</p>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-6">
            <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-2 mb-6">
                <div className="flex-1 relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within:text-indigo-600 transition-colors">search</span>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by student name or email..."
                        className="w-full bg-white border-0 rounded-3xl py-5 pl-14 pr-12 text-sm font-bold outline-none transition-all placeholder:text-slate-200"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    )}
                </div>
                <div className="h-10 w-px bg-slate-100 hidden md:block mx-2" />
                <div className="flex items-center gap-2 pr-2">
                    <select value={attendanceFilter} onChange={e => setAttendanceFilter(e.target.value)} className="bg-slate-50/50 border-0 rounded-2xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none hover:bg-slate-100 transition-all cursor-pointer">
                        <option value="All">All Attendance</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                    <button onClick={() => setSortOrder(prev => prev === 'High' ? 'Low' : 'High')} className="bg-indigo-50 text-indigo-600 rounded-2xl p-3.5 hover:bg-indigo-600 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-sm">{sortOrder === 'High' ? 'arrow_downward' : 'arrow_upward'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-x-auto hidden-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-4 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                            <th className="hidden sm:table-cell px-4 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-4 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Marks</th>
                            <th className="px-4 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredScores.map(s => (
                            <tr key={s.student.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 md:px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-50 text-indigo-600 flex shrink-0 items-center justify-center font-black text-xs">{s.student.name?.[0]?.toUpperCase()}</div>
                                        <div className="min-w-0">
                                            <p className="text-xs md:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{s.student.name}</p>
                                            <p className="text-[10px] font-medium text-slate-400 truncate">{s.student.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden sm:table-cell px-4 md:px-8 py-5"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${s.marks.isAbsent ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>{s.marks.isAbsent ? 'Absent' : 'Present'}</span></td>
                                <td className="px-4 md:px-8 py-5 text-center"><p className={`text-xs md:text-sm font-black ${s.marks.isAbsent ? 'text-red-400' : 'text-slate-900'}`}>{s.marks.isAbsent ? 'AB' : s.marks.value}</p></td>
                                <td className="px-4 md:px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${s.parentViewed?.viewed ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.parentViewed?.viewed ? 'Seen' : 'Waiting'}</p>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Compiling Analytics...</p>
    </div>
);

const ErrorState = ({ error, retry }) => (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><span className="material-symbols-outlined text-3xl">error</span></div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Operation Interrupted</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">{error}</p>
        <button onClick={retry} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest">Retry Connection</button>
    </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const FacultyReports = () => {
    const { type, testId } = useParams();
    const navigate = useNavigate();

    const [tests, setTests] = useState([]);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [testSearchQuery, setTestSearchQuery] = useState('');
    const [attendanceFilter, setAttendanceFilter] = useState('All');
    const [parentViewFilter, setParentViewFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('High');

    const fetchTests = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get(`/faculty/tests?type=${type}`);
            if (res.data.success) setTests(res.data.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed to fetch test records.'); }
        finally { setLoading(false); }
    };

    const fetchDetails = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get(`/faculty/tests/${testId}`);
            if (res.data.success) setDetails(res.data.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed to fetch detailed records.'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (type && !testId) fetchTests();
        if (testId) fetchDetails();
    }, [type, testId]);

    const filteredScores = useMemo(() => {
        if (!details || !details.scores) return [];
        const q = searchQuery.toLowerCase().trim();
        return [...details.scores]
            .filter(s => {
                const name = s.student?.name || '';
                const email = s.student?.email || '';
                return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
            })
            .filter(s => attendanceFilter === 'All' ? true : (attendanceFilter === 'Present' ? !s.marks.isAbsent : s.marks.isAbsent))
            .filter(s => parentViewFilter === 'All' ? true : (parentViewFilter === 'Viewed' ? s.parentViewed?.viewed : !s.parentViewed?.viewed))
            .sort((a, b) => {
                const valA = a.marks.isAbsent ? -1 : (a.marks.value || 0);
                const valB = b.marks.isAbsent ? -1 : (b.marks.value || 0);
                if (valA === valB) return a.student.name.localeCompare(b.student.name);
                return sortOrder === 'High' ? valB - valA : valA - valB;
            });
    }, [details, searchQuery, attendanceFilter, parentViewFilter, sortOrder]);

    return (
        <div className="p-3 md:p-6 space-y-6 max-w-7xl mx-auto w-full relative z-10 hidden-scrollbar pb-24">
            {!type && (
                <div className="mb-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Faculty Reports</p>
                    <h1 className="text-2xl md:text-5xl font-black text-indigo-950 tracking-tight">Academic Insights</h1>
                </div>
            )}
            <AnimatePresence mode="wait">
                <motion.div key={testId || type || 'root'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    {!type ? <RenderSelection navigate={navigate} /> : 
                     !testId ? <RenderList type={type} loading={loading} error={error} tests={tests} testSearchQuery={testSearchQuery} setTestSearchQuery={setTestSearchQuery} fetchTests={fetchTests} navigate={navigate} /> : 
                     <RenderDetails details={details} type={type} loading={loading} error={error} searchQuery={searchQuery} setSearchQuery={setSearchQuery} attendanceFilter={attendanceFilter} setAttendanceFilter={setAttendanceFilter} sortOrder={sortOrder} setSortOrder={setSortOrder} filteredScores={filteredScores} fetchDetails={fetchDetails} navigate={navigate} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default FacultyReports;
