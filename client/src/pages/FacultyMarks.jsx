import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const TEST_TYPES = [
    { id: 'TESTMARK', label: 'Test Mark', icon: 'description', inputLabel: 'Test Name', inputPlaceholder: 'e.g., Theory Test 1' },
    { id: 'SEM RESULT', label: 'Sem Result', icon: 'school', inputLabel: 'Semester Name', inputPlaceholder: 'e.g., Semester 1' },
    { id: 'INTERNAL MARK', label: 'Internal Mark', icon: 'assignment', inputLabel: 'Assessment Number', inputPlaceholder: 'e.g., IA 1' },
];

const FacultyMarks = () => {
    const [activeTab, setActiveTab] = useState(null); // 'TESTMARK' | 'SEM RESULT' | 'INTERNAL MARK'
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Config Form State
    const [testName, setTestName] = useState('');
    const [totalMarks, setTotalMarks] = useState('');
    const [testDate, setTestDate] = useState('');
    const [configLocked, setConfigLocked] = useState(false);

    // Scores State
    const [scores, setScores] = useState({}); // { studentId: { value: '', isAbsent: false } }
    const [submitLoading, setSubmitLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

    // Fetch Assigned Students on Mount
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/faculty/students');
                // Standardizing: extract .data from the success wrapper
                const studentsArray = res.data.success ? res.data.data : res.data;
                setStudents(Array.isArray(studentsArray) ? studentsArray : []);
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const handleFormSubmit = (e) => {
        if (e) e.preventDefault();
        
        if (!testName.trim() || !totalMarks || !testDate) {
            setAlertMsg({ type: 'error', text: 'Please enter a name, date, and total marks for this assessment.' });
            return;
        }

        if (!students.length) {
            setAlertMsg({ type: 'error', text: 'No students assigned. Please contact the Admin to map students to your profile.' });
            return;
        }
        
        // Initialize scores mapping for all assigned students
        const initialScores = {};
        students.forEach(student => {
            initialScores[student._id] = { value: '', isAbsent: false, rawInput: '' };
        });
        
        setScores(initialScores);
        setConfigLocked(true);
        setAlertMsg({ type: '', text: '' });
    };

    const handleInputChange = (studentId, rawValue) => {
        const val = rawValue.trim().toUpperCase();
        if (val === 'AB') {
            setScores(prev => ({
                ...prev,
                [studentId]: { value: null, isAbsent: true, rawInput: rawValue }
            }));
        } else {
            // Check if it's a number
            const numVal = Number(rawValue);
            if (!isNaN(numVal) && rawValue.trim() !== '') {
                setScores(prev => ({
                    ...prev,
                    [studentId]: { value: numVal, isAbsent: false, rawInput: rawValue }
                }));
            } else {
                // Allows user to clear input or type intermediate invalid values
                setScores(prev => ({
                    ...prev,
                    [studentId]: { value: null, isAbsent: false, rawInput: rawValue }
                }));
            }
        }
    };
    const submitMarks = async () => {
        if (!activeTab) {
            setAlertMsg({ type: 'error', text: 'Please select an assessment category first.' });
            return;
        }

        setAlertMsg({ type: '', text: '' });
        
        // Validation pass
        const mappedScores = [];
        for (const student of students) {
            const s = scores[student._id];
            if (!s || (s.rawInput === '' && !s.isAbsent)) {
                setAlertMsg({ type: 'error', text: `Missing marks for ${student.firstName} ${student.lastName}` });
                return;
            }
            if (s.value !== null && s.value > Number(totalMarks)) {
                setAlertMsg({ type: 'error', text: `Score exceeds limit for ${student.firstName}` });
                return;
            }
            mappedScores.push({
                studentId: student._id,
                marks: { value: s.value, isAbsent: s.isAbsent }
            });
        }

        setSubmitLoading(true);
        try {
            const res = await api.post('/faculty/academic-tests', {
                assignedTo: 'All',
                testType: activeTab,
                testName,
                totalMarks: Number(totalMarks),
                testDate,
                scores: mappedScores
            });
            
            if (res.data.success) {
                setAlertMsg({ type: 'success', text: 'Records updated successfully!' });
                setTimeout(() => {
                    setConfigLocked(false);
                    setTestName('');
                    setTotalMarks('');
                    setTestDate('');
                    setAlertMsg({ type: '', text: '' });
                }, 2500);
            }
        } catch (err) {
            setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Sync failed. Please restart server.' });
        } finally {
            setSubmitLoading(false);
        }
    };

    const currentTabConf = TEST_TYPES.find(t => t.id === activeTab);

    return (
        <div className="p-3 md:p-6 space-y-6 max-w-6xl mx-auto w-full relative z-10 hidden-scrollbar pb-24">
            {/* Header */}
            <div className="mb-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Faculty Portal</p>
                <h1 className="text-2xl md:text-4xl font-black text-indigo-950 tracking-tight">Academic Marks</h1>
                <p className="text-[10px] md:text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">Grade assignments securely</p>
            </div>

            {/* Global Alerts */}
            <AnimatePresence>
                {alertMsg.text && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-3 md:p-4 mb-6 rounded-2xl text-[10px] md:text-sm font-bold flex items-center gap-2 md:gap-3 overflow-hidden ${
                            alertMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[16px] md:text-lg">
                            {alertMsg.type === 'error' ? 'error' : 'check_circle'}
                        </span>
                        {alertMsg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step 1: Assessment Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
                {TEST_TYPES.map(type => (
                    <motion.button
                        key={type.id}
                        whileHover={{ y: -4 }}
                        onClick={() => { setActiveTab(type.id); setConfigLocked(false); setAlertMsg({ type: '', text: '' }); }}
                        className={`p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border transition-all text-left relative overflow-hidden group ${
                            activeTab === type.id 
                            ? 'bg-indigo-600 border-indigo-700 shadow-xl shadow-indigo-600/30' 
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10'
                        }`}
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-colors ${
                            activeTab === type.id ? 'bg-white/20' : 'bg-indigo-50 group-hover:bg-indigo-100'
                        }`} />
                        <div className="relative z-10 flex flex-col gap-3 md:gap-4">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[1rem] md:rounded-2xl flex items-center justify-center shadow-inner transition-colors ${
                                activeTab === type.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                                <span className="material-symbols-outlined text-[24px] md:text-3xl">{type.icon}</span>
                            </div>
                            <h3 className={`text-base md:text-xl font-black ${activeTab === type.id ? 'text-white' : 'text-indigo-950'}`}>
                                {type.label}
                            </h3>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Step 2: Configuration Panel */}
            <AnimatePresence mode="wait">
                {activeTab && (
                    <motion.div
                        key={`config-${activeTab}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm mb-8 md:mb-10"
                    >
                        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 md:mb-2">{currentTabConf.inputLabel}</label>
                                <input 
                                    required
                                    disabled={configLocked}
                                    value={testName}
                                    onChange={e => setTestName(e.target.value)}
                                    placeholder={currentTabConf.inputPlaceholder}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm font-bold focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 md:mb-2">Test Date</label>
                                <input 
                                    required
                                    disabled={configLocked}
                                    type="date"
                                    value={testDate}
                                    onChange={e => setTestDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm font-bold focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 md:mb-2">Total Marks</label>
                                <input 
                                    required
                                    disabled={configLocked}
                                    type="number"
                                    min="1"
                                    value={totalMarks}
                                    onChange={e => setTotalMarks(e.target.value)}
                                    placeholder="Max Score"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm font-bold focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                                />
                            </div>
                            <div className="md:col-span-1">
                                {configLocked ? (
                                    <button type="button" onClick={() => setConfigLocked(false)}
                                        className="w-full bg-slate-100 text-slate-600 p-3 md:p-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-[14px] md:text-sm">edit</span> Unlock Focus
                                    </button>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={() => handleFormSubmit()}
                                        disabled={!testName.trim() || !totalMarks || !testDate}
                                        className="w-full bg-indigo-600 text-white p-3 md:p-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[14px] md:text-sm">play_arrow</span> Start Grading
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step 3: Student Grading Table */}
            <AnimatePresence>
                {configLocked && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-4 md:p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                            <div>
                                <h3 className="font-black text-base md:text-lg text-indigo-950">Student Mark Entry</h3>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Assigned Personnel</p>
                            </div>
                            <div className="bg-indigo-100 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-indigo-200 self-start md:self-auto">
                                <span className="text-[8px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Format Key</span>
                                <span className="text-[10px] md:text-xs font-bold text-slate-600 uppercase">Input `AB` for Absences</span>
                            </div>
                        </div>

                        <div className="p-3 md:p-8 flex flex-col gap-3 md:gap-4">
                            {students.length === 0 ? (
                                <p className="text-center font-bold text-slate-400 py-10 text-xs md:text-sm">No students are currently enrolled.</p>
                            ) : (
                                students.map((student) => {
                                    const studentScore = scores[student._id] || { rawInput: '' };
                                    return (
                                        <div key={student._id} className="flex items-center justify-between gap-3 md:gap-4 bg-slate-50/80 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-[10px] md:rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shrink-0 text-xs md:text-sm">
                                                    {student.firstName?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="truncate">
                                                    <h4 className="font-black text-xs md:text-sm text-slate-800 truncate">{student.firstName} {student.lastName}</h4>
                                                    <p className="text-[9px] md:text-xs font-medium text-slate-400 truncate">{student.email}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="w-24 md:w-48 relative shrink-0">
                                                <span className="hidden md:block absolute -top-2 left-3 bg-slate-50 px-1 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Marks [Max {totalMarks}]</span>
                                                <input 
                                                    type="text"
                                                    value={studentScore.rawInput}
                                                    onChange={(e) => handleInputChange(student._id, e.target.value)}
                                                    className={`w-full relative z-0 bg-white border-2 rounded-lg md:rounded-xl p-2 md:p-3 text-xs md:text-sm font-black focus:outline-none transition-all text-center uppercase ${
                                                        studentScore.isAbsent ? 'border-red-300 text-red-600 bg-red-50' :
                                                        studentScore.value !== null && studentScore.value > Number(totalMarks) ? 'border-red-400 text-red-600' :
                                                        studentScore.value !== null ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 
                                                        'border-slate-200 text-slate-800 focus:border-indigo-400'
                                                    }`}
                                                    placeholder={`AB or <${totalMarks}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-4 md:p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 md:gap-4 fixed bottom-[72px] md:static left-0 right-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:shadow-none bg-white/80 md:bg-slate-50 backdrop-blur-md md:backdrop-blur-none">
                            <button 
                                disabled={submitLoading}
                                onClick={submitMarks}
                                className="w-full md:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-indigo-600 text-white rounded-[1rem] md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50"
                            >
                                {submitLoading ? <span className="material-symbols-outlined text-[16px] md:text-lg animate-spin">refresh</span> : null}
                                {submitLoading ? 'Syncing...' : 'Update Records'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FacultyMarks;
