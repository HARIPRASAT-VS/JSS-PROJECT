import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../utils/api';

const FacultyUnblockPage = () => {
    const [blockedStudents, setBlockedStudents] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [reason, setReason] = useState('');
    const [verified, setVerified] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [blockedRes, historyRes] = await Promise.all([
                API.get('/faculty/blocked-students'),
                API.get('/faculty/unblock-history')
            ]);
            
            const blockedData = blockedRes.data.success ? blockedRes.data.data : blockedRes.data;
            const historyData = historyRes.data.success ? historyRes.data.data : historyRes.data;

            setBlockedStudents(Array.isArray(blockedData) ? blockedData : []);
            setHistory(Array.isArray(historyData) ? historyData : []);
        } catch (err) {
            console.error('Fetch error:', err);
            setBlockedStudents([]);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredStudents = blockedStudents.filter(s => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !verified) {
            setMessage({ type: 'error', text: 'Please ensure photo is uploaded and box is checked.' });
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('studentId', selectedStudent._id);
        formData.append('proofImage', file);
        formData.append('reason', reason);
        formData.append('facultyVerified', verified);

        try {
            await API.post('/faculty/unblock-submission', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Request submitted to admin for verification.' });
            setFile(null);
            setPreviewUrl(null);
            setReason('');
            setVerified(false);
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Submission failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    const studentHistory = history.filter(h => h.studentId?._id === selectedStudent?._id);
    const latestRequest = studentHistory[0]; // History is sorted by newest

    return (
        <div className="p-3 md:p-6 max-w-7xl mx-auto w-full relative z-10 hidden-scrollbar pb-24 h-[calc(100vh-64px)] flex flex-col gap-4 md:gap-6">
            <div className="flex-none">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Faculty Portal</p>
                <h2 className="text-2xl md:text-3xl font-black text-indigo-950 tracking-tight">Unblock Management</h2>
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm shadow-indigo-900/5">
                {/* LEFT PANEL: SEARCH & LIST */}
                <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50 flex flex-col overflow-hidden max-h-[40vh] lg:max-h-full">
                    <div className="p-4 md:p-6 border-b border-slate-100 space-y-4 shrink-0 bg-white">
                        <div className="flex justify-between items-center">
                            <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-400">Blocked Students</h2>
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">{blockedStudents.length}</span>
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input 
                                type="text"
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-[10px] md:text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none placeholder-slate-400 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="py-10 md:py-20 flex flex-col items-center justify-center gap-3">
                                <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Personnel...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="py-10 md:py-20 text-center opacity-40">
                                <span className="material-symbols-outlined text-3xl md:text-4xl mb-2">person_off</span>
                                <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest">No blocked students found</p>
                            </div>
                        ) : (
                            filteredStudents.map(student => (
                                <button 
                                    key={student._id}
                                    onClick={() => { setSelectedStudent(student); setMessage({type:'', text:''}); }}
                                    className={`w-full text-left p-3 md:p-4 rounded-[1rem] md:rounded-[1.5rem] border transition-all ${
                                        selectedStudent?._id === student._id 
                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                        : 'bg-white border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex shrink-0 items-center justify-center text-slate-400 font-black text-sm shadow-sm">
                                            {student.firstName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] md:text-xs font-black text-slate-900 truncate">{student.firstName} {student.lastName}</p>
                                            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold truncate tracking-tight mt-0.5">{student.email}</p>
                                        </div>
                                        <div className="text-right flex shrink-0 flex-col items-end">
                                            <span className="text-[7px] md:text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase tracking-widest">Blocked</span>
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-300 mt-1.5 uppercase">Total: {student.totalBlockCount || 0}</span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: DETAILS & SUBMISSION */}
                <div className="flex-1 bg-white overflow-y-auto custom-scrollbar relative">
                    <AnimatePresence mode="wait">
                        {!selectedStudent ? (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="h-full flex flex-col items-center justify-center text-slate-300 p-6 md:p-10"
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 md:mb-6 shadow-sm shadow-indigo-900/5">
                                    <span className="material-symbols-outlined text-2xl md:text-3xl text-slate-300">ads_click</span>
                                </div>
                                <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-slate-400 text-center">Select a student from the list to manage unblocking</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={selectedStudent._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-4 md:p-8 lg:p-10 max-w-4xl mx-auto w-full space-y-6 md:space-y-8"
                            >
                                {/* Header Info */}
                                <div className="bg-slate-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
                                    <div className="flex items-center gap-4 md:gap-5">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-3xl bg-indigo-600 text-white flex shrink-0 items-center justify-center text-xl md:text-2xl font-black shadow-lg shadow-indigo-600/20">
                                            {selectedStudent.firstName[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-indigo-950 tracking-tight leading-none mb-1 md:mb-2">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                                            <p className="text-[10px] md:text-sm text-slate-500 font-bold">{selectedStudent.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 md:gap-6 shrink-0 bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="text-center">
                                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">Warnings</p>
                                            <p className="text-sm md:text-lg font-black text-orange-600 bg-orange-50 px-3 md:px-4 py-0.5 md:py-1 rounded-xl border border-orange-100">{selectedStudent.warningCount}</p>
                                        </div>
                                        <div className="w-px h-8 md:h-10 bg-slate-100" />
                                        <div className="text-center">
                                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">Total Blocks</p>
                                            <p className="text-sm md:text-lg font-black text-red-600 bg-red-50 px-3 md:px-4 py-0.5 md:py-1 rounded-xl border border-red-100">{selectedStudent.totalBlockCount || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Latest Status Message/Reason */}
                                {latestRequest && latestRequest.status === 'Rejected' && (
                                    <div className="bg-red-50 border border-red-100 rounded-[1.5rem] p-4 md:p-6 flex items-start gap-3 md:gap-4 shadow-sm">
                                        <span className="material-symbols-outlined text-red-600 font-black shrink-0">warning_amber</span>
                                        <div>
                                            <p className="text-[10px] md:text-xs font-black text-red-700 uppercase tracking-widest mb-1 shadow-sm">Admin Rejection Reason</p>
                                            <p className="text-xs md:text-sm font-bold text-red-600 leading-relaxed italic">"{latestRequest.adminComment || 'No reason provided by admin.'}"</p>
                                            <p className="text-[8px] md:text-[10px] font-black text-red-400/80 uppercase tracking-widest mt-2 md:mt-3">You can submit a new proof letter below to appeal again.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Submission Form OR Status */}
                                {latestRequest && latestRequest.status === 'Pending' ? (
                                    <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-dashed border-indigo-200 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 animate-pulse shadow-sm">
                                            <span className="material-symbols-outlined text-3xl md:text-4xl">hourglass_empty</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg md:text-xl font-black text-indigo-950 uppercase tracking-tight">Request Pending Admin Verification</h3>
                                            <p className="text-[10px] md:text-sm text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">Wait for the administrator to approve or reject the request letter submission.</p>
                                        </div>
                                        <div className="w-full max-w-md bg-white p-4 md:p-5 rounded-[1.5rem] border border-slate-100 text-left space-y-2 md:space-y-3 shadow-sm mt-4">
                                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason Given:</p>
                                            <p className="text-[10px] md:text-xs font-bold text-slate-600 italic">"{latestRequest.reason}"</p>
                                            <img src={latestRequest.proofImageUrl} alt="Submitted Proof" className="w-full h-24 md:h-32 object-cover rounded-xl border border-slate-200 mt-3 opacity-60" />
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-md space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex shrink-0 items-center justify-center text-indigo-600 shadow-inner">
                                                <span className="material-symbols-outlined text-[16px] md:text-sm font-black">upload_file</span>
                                            </div>
                                            <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-indigo-950">Draft Unblock Appeal</h3>
                                        </div>

                                        {message.text && (
                                            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black flex items-center gap-2 md:gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                <span className="material-symbols-outlined text-[16px] md:text-lg shrink-0">{message.type === 'error' ? 'error' : 'check_circle'}</span>
                                                {message.text}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                            {/* Upload */}
                                            <div className="space-y-2 md:space-y-3">
                                                <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Request Letter (Photo Proof)</label>
                                                <div 
                                                    onClick={() => document.getElementById('file-upload').click()}
                                                    className={`relative h-40 md:h-56 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group ${previewUrl ? 'border-indigo-600 shadow-inner' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'}`}
                                                >
                                                    {previewUrl ? (
                                                        <>
                                                            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview"/>
                                                            <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <span className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-indigo-600 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg">Change Photo</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-3xl md:text-4xl text-slate-300 group-hover:text-indigo-400 transition-colors mb-2">add_photo_alternate</span>
                                                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload letter</p>
                                                        </>
                                                    )}
                                                    <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                </div>
                                            </div>

                                            {/* Reason & Verification */}
                                            <div className="space-y-4 md:space-y-6 flex flex-col">
                                                <div className="space-y-2 md:space-y-3 flex-1">
                                                    <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Optional Reason/Comment</label>
                                                    <textarea 
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        placeholder="Any additional details for the administrator..."
                                                        className="w-full h-24 md:h-32 bg-slate-50 border border-slate-100 rounded-[1.5rem] p-3 md:p-4 text-[10px] md:text-xs font-bold focus:bg-white focus:border-indigo-300 outline-none resize-none transition-all placeholder-slate-300"
                                                    />
                                                </div>

                                                <div className="p-4 md:p-5 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100/50">
                                                    <label className="flex items-start gap-2.5 md:gap-3 cursor-pointer select-none">
                                                        <div className="relative mt-0.5">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={verified}
                                                                onChange={(e) => setVerified(e.target.checked)}
                                                                className="peer sr-only" 
                                                            />
                                                            <div className="w-4 h-4 md:w-5 md:h-5 bg-white border-2 border-slate-200 rounded md:rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-white text-[12px] md:text-sm font-black opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all">check</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] md:text-[11px] font-bold text-slate-600 leading-tight">
                                                            I confirm that the student has physically submitted their request letter to the faculty.
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            disabled={submitting || !file || !verified}
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 md:gap-3 relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            <span className="relative z-10">{submitting ? 'PROCESSING...' : 'Submit Unblock Request'}</span>
                                            {!submitting && <span className="material-symbols-outlined relative z-10 text-[16px] md:text-xl">send</span>}
                                            {submitting && <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
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

export default FacultyUnblockPage;
