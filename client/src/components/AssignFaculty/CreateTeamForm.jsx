import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateTeamForm = ({ year, onSubmit, onCancel, loading }) => {
    const [facultyName, setFacultyName] = useState('');
    const [facultyEmail, setFacultyEmail] = useState('');
    const [members, setMembers] = useState([{ name: '', email: '' }]);
    const [error, setError] = useState('');

    const addMember = () => setMembers([...members, { name: '', email: '' }]);
    const removeMember = (idx) => setMembers(members.filter((_, i) => i !== idx));
    
    const handleMemberChange = (idx, field, val) => {
        const newMembers = [...members];
        newMembers[idx][field] = val;
        setMembers(newMembers);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Validation: No duplicates
        const emails = [facultyEmail, ...members.map(m => m.email.trim().toLowerCase())];
        if (new Set(emails).size !== emails.length) {
            setError('Duplicate Email Detected: Every member and faculty must have a unique email ID.');
            return;
        }

        onSubmit({
            year,
            facultyName,
            facultyEmail,
            members: members.filter(m => m.name && m.email)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-[90vh]">
            <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-black text-indigo-950 tracking-tight">Sync New Team</h2>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Registering for {year}</p>
                    </div>
                    <button type="button" onClick={onCancel} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ height:0, opacity:0 }}
                            animate={{ height:'auto', opacity:1 }}
                            exit={{ height:0, opacity:0 }}
                            className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
                        >
                            <span className="material-symbols-outlined text-sm">warning</span>
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Faculty Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faculty Lead Name</label>
                        <input 
                            required 
                            value={facultyName} 
                            onChange={(e) => setFacultyName(e.target.value)} 
                            placeholder="Full Name" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 font-bold text-sm" 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email ID</label>
                        <input 
                            required 
                            type="email"
                            value={facultyEmail} 
                            onChange={(e) => setFacultyEmail(e.target.value)} 
                            placeholder="faculty@college.edu" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 font-bold text-sm" 
                        />
                    </div>
                </div>

                {/* Personnel Registry */}
                <div className="space-y-8">
                    <div className="flex justify-between items-center pb-4 border-b border-indigo-50">
                        <div>
                            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Personnel Registry</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 italic">{members.length} Members Prepared</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={addMember}
                            className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 px-6 py-3 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm font-black">add</span>
                            ADD PERSONNEL
                        </button>
                    </div>

                    <div className="space-y-4">
                        {members.map((m, i) => (
                            <motion.div 
                                key={i}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-50 relative group"
                            >
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Member {i+1} Name</label>
                                    <input required value={m.name} onChange={(e) => handleMemberChange(i, 'name', e.target.value)} placeholder="Full Name" className="w-full bg-white border border-slate-100 rounded-xl p-4 text-xs font-bold focus:border-indigo-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Member {i+1} Email</label>
                                    <div className="flex gap-4">
                                        <input required type="email" value={m.email} onChange={(e) => handleMemberChange(i, 'email', e.target.value)} placeholder="id@college.edu" className="flex-1 bg-white border border-slate-100 rounded-xl p-4 text-xs font-bold focus:border-indigo-500 outline-none transition-all" />
                                        {members.length > 1 && (
                                            <button type="button" onClick={() => removeMember(i)} className="p-3 text-slate-200 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-6">
                <button type="button" onClick={onCancel} className="px-8 py-3 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-colors">DISCARD</button>
                <button 
                    disabled={loading}
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-3"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined font-black">sync_alt</span>}
                    VERIFY & SYNC REGISTRY
                </button>
            </div>
        </form>
    );
};

export default CreateTeamForm;
