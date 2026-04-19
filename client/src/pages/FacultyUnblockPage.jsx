import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';
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
            setBlockedStudents(blockedRes.data);
            setHistory(historyRes.data);
        } catch (err) {
            console.error('Fetch error:', err);
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
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            <SideNavBar />
            <main className="flex-1 md:ml-64 flex flex-col">
                <TopAppBar title="Unblock Management" />
                
                <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
                    {/* LEFT PANEL: SEARCH & LIST */}
                    <div className="w-full lg:w-96 border-r border-slate-200 bg-white flex flex-col">
                        <div className="p-6 border-b border-slate-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Blocked Students</h2>
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">{blockedStudents.length}</span>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input 
                                    type="text"
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border-0 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Personnel...</p>
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="py-20 text-center opacity-40">
                                    <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                                    <p className="text-xs font-bold uppercase tracking-widest">No blocked students found</p>
                                </div>
                            ) : (
                                filteredStudents.map(student => (
                                    <button 
                                        key={student._id}
                                        onClick={() => { setSelectedStudent(student); setMessage({type:'', text:''}); }}
                                        className={`w-full text-left p-4 rounded-3xl border transition-all ${
                                            selectedStudent?._id === student._id 
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                            : 'bg-white border-transparent hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-black text-sm shadow-sm">
                                                {student.firstName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-900 truncate">{student.firstName} {student.lastName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold truncate tracking-tight">{student.email}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase tracking-widest">Blocked</span>
                                                <span className="text-[9px] font-black text-slate-300 mt-1 uppercase">Total: {student.totalBlockCount || 0}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: DETAILS & SUBMISSION */}
                    <div className="flex-1 bg-slate-50/50 overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {!selectedStudent ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    className="h-full flex flex-col items-center justify-center text-slate-300 p-10"
                                >
                                    <div className="w-20 h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm shadow-indigo-900/5">
                                        <span className="material-symbols-outlined text-3xl">ads_click</span>
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Select a student from the list to manage unblocking</p>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key={selectedStudent._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8"
                                >
                                    {/* Header Info */}
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-600/20">
                                                {selectedStudent.firstName[0]}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-indigo-950 tracking-tight">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                                                <p className="text-sm text-slate-400 font-bold">{selectedStudent.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Warnings</p>
                                                <p className="text-lg font-black text-orange-600 bg-orange-50 px-4 py-1 rounded-xl border border-orange-100">{selectedStudent.warningCount}</p>
                                            </div>
                                            <div className="w-px h-10 bg-slate-100" />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Blocks</p>
                                                <p className="text-lg font-black text-red-600 bg-red-50 px-4 py-1 rounded-xl border border-red-100">{selectedStudent.totalBlockCount || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Latest Status Message/Reason */}
                                    {latestRequest && latestRequest.status === 'Rejected' && (
                                        <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 flex items-start gap-4">
                                            <span className="material-symbols-outlined text-red-600 font-black">warning_amber</span>
                                            <div>
                                                <p className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">Admin Rejection Reason</p>
                                                <p className="text-sm font-bold text-red-600 leading-relaxed italic">"{latestRequest.adminComment || 'No reason provided by admin.'}"</p>
                                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-3">You can submit a new proof letter below to appeal again.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submission Form OR Status */}
                                    {latestRequest && latestRequest.status === 'Pending' ? (
                                        <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-indigo-100 flex flex-col items-center justify-center text-center space-y-6">
                                            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 animate-pulse">
                                                <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight">Request Pending Admin Verification</h3>
                                                <p className="text-sm text-slate-400 font-bold max-w-sm">Wait for the administrator to approve or reject the request letter submission.</p>
                                            </div>
                                            <div className="w-full max-w-md bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason Given:</p>
                                                <p className="text-xs font-bold text-slate-600 italic">"{latestRequest.reason}"</p>
                                                <img src={latestRequest.proofImageUrl} alt="Submitted Proof" className="w-full h-32 object-cover rounded-xl border border-slate-200 mt-4 opacity-50" />
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <span className="material-symbols-outlined text-sm font-black">upload_file</span>
                                                </div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-950">Draft Unblock Appeal</h3>
                                            </div>

                                            {message.text && (
                                                <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                    <span className="material-symbols-outlined text-lg">{message.type === 'error' ? 'error' : 'check_circle'}</span>
                                                    {message.text}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Upload */}
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Request Letter (Photo Proof)</label>
                                                    <div 
                                                        onClick={() => document.getElementById('file-upload').click()}
                                                        className={`relative h-56 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group ${previewUrl ? 'border-indigo-600 shadow-inner' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'}`}
                                                    >
                                                        {previewUrl ? (
                                                            <>
                                                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview"/>
                                                                <div className="absolute inset-0 bg-indigo-900/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="text-white text-[10px] font-black uppercase tracking-widest bg-indigo-600 px-4 py-2 rounded-full">Change Photo</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:text-indigo-400 transition-colors mb-2">add_photo_alternate</span>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload letter</p>
                                                            </>
                                                        )}
                                                        <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                    </div>
                                                </div>

                                                {/* Reason & Verification */}
                                                <div className="space-y-6 flex flex-col">
                                                    <div className="space-y-3 flex-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Optional Reason/Comment</label>
                                                        <textarea 
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                            placeholder="Any additional details for the administrator..."
                                                            className="w-full h-32 bg-slate-50 border-0 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-300 outline-none resize-none"
                                                        />
                                                    </div>

                                                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-4">
                                                        <label className="flex items-start gap-3 cursor-pointer select-none">
                                                            <div className="relative mt-0.5">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={verified}
                                                                    onChange={(e) => setVerified(e.target.checked)}
                                                                    className="peer sr-only" 
                                                                />
                                                                <div className="w-5 h-5 bg-white border-2 border-slate-200 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-white text-sm font-black opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all">check</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[11px] font-bold text-slate-600 leading-tight">
                                                                I confirm that the student has physically submitted their request letter to the faculty.
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                disabled={submitting || !file || !verified}
                                                type="submit"
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group"
                                            >
                                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                                <span className="relative z-10">{submitting ? 'PROCESS SING SUBMISSION...' : 'Submit Unblock Request'}</span>
                                                {!submitting && <span className="material-symbols-outlined relative z-10 text-xl">send</span>}
                                                {submitting && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />}
                                            </button>
                                        </form>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}} />
        </div>
    );
};

export default FacultyUnblockPage;
