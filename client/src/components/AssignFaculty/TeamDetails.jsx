import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConflictResolver from './ConflictResolver';

const TeamDetails = ({ team, onUpdate, onCancel, loading }) => {
    const [facultyName, setFacultyName] = useState(team.facultyId?.firstName || team.facultyName || '');
    const [facultyEmail, setFacultyEmail] = useState(team.facultyId?.email || team.facultyEmail || '');
    const [members, setMembers] = useState(
        (team.students || []).map(s => ({ name: s.firstName || s.name, email: s.email, _id: s._id }))
    );
    const [conflict, setConflict] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const hasMemberChanges = JSON.stringify(members) !== JSON.stringify((team.students || []).map(s => ({ name: s.firstName || s.name, email: s.email, _id: s._id })));
        setIsDirty(hasMemberChanges || facultyName !== (team.facultyId?.firstName || team.facultyName) || facultyEmail !== (team.facultyId?.email || team.facultyEmail));
    }, [facultyName, facultyEmail, members, team]);

    const addMember = () => setMembers([...members, { name: '', email: '' }]);
    const removeMember = (idx) => setMembers(members.filter((_, i) => i !== idx));
    const handleMemberChange = (idx, field, val) => {
        const newMembers = [...members];
        newMembers[idx][field] = val;
        setMembers(newMembers);
    };

    const handleSync = async () => {
        const result = await onUpdate(team._id || team.id, {
            year: team.year,
            facultyName,
            facultyEmail,
            members: members.filter(m => m.name && m.email)
        });

        if (result?.conflict) {
            setConflict(result.serverData);
        } else if (result?.success) {
            setIsDirty(false);
        }
    };

    if (conflict) {
        return (
            <ConflictResolver 
                localData={{ facultyName, facultyEmail, members }}
                serverData={conflict}
                onResolve={(resolved) => {
                    // Logic to re-apply or accept server
                    setConflict(null);
                    if (resolved._id) {
                        // Accepted Server: Refresh local state
                        setFacultyName(resolved.facultyId.firstName);
                        setFacultyEmail(resolved.facultyId.email);
                        setMembers(resolved.students.map(s => ({ name: s.firstName, email: s.email, _id: s._id })));
                    }
                    // If they picked local, they just retry the sync
                }}
                onCancel={() => setConflict(null)}
            />
        );
    }

    return (
        <div className="flex flex-col h-[90vh]">
            <div className="p-10 border-b border-slate-50 bg-slate-50/10">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <span className="material-symbols-outlined text-3xl">badge</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-indigo-950 tracking-tight">Team Registry Details</h2>
                                {isDirty && <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Registry ID: {team._id || team.id}</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Faculty Name</label>
                        <input value={facultyName} onChange={e => setFacultyName(e.target.value)} className="w-full bg-slate-50 border border-slate-50 rounded-2xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm" />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Faculty Email</label>
                        <input value={facultyEmail} onChange={e => setFacultyEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-50 rounded-2xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm" />
                    </div>
                </div>

                <div className="space-y-8 pb-10">
                    <div className="flex justify-between items-center bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-50/50">
                        <div>
                            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest">Active Personnel</h3>
                            <p className="text-[10px] text-indigo-600/60 font-bold mt-1 uppercase tracking-tighter">Database verified members</p>
                        </div>
                        <button onClick={addMember} className="bg-white border border-indigo-100 text-indigo-600 px-6 py-3 rounded-2xl text-[10px] font-black flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <span className="material-symbols-outlined text-sm font-black">join_full</span>
                            ENROLL NEW MEMBER
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {members.map((m, i) => (
                            <div key={i} className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl group hover:border-indigo-200 transition-colors">
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all font-black text-xs">
                                    {i + 1}
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <input value={m.name} onChange={e => handleMemberChange(i, 'name', e.target.value)} placeholder="Name" className="bg-transparent border-0 focus:ring-0 text-sm font-bold p-0 text-slate-700" />
                                    <input value={m.email} onChange={e => handleMemberChange(i, 'email', e.target.value)} placeholder="Email" className="bg-transparent border-0 focus:ring-0 text-xs font-medium p-0 text-slate-400" />
                                </div>
                                <button onClick={() => removeMember(i)} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <span className="material-symbols-outlined text-sm">remove_circle_outline</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black tracking-widest border border-amber-100 animate-pulse">
                            <span className="material-symbols-outlined text-sm">edit_notifications</span>
                            UNSAVED CHANGES
                        </div>
                    )}
                </div>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="px-8 py-3 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest">DISCARD</button>
                    <button 
                        disabled={loading || !isDirty}
                        onClick={handleSync}
                        className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-950/20 disabled:opacity-30 flex items-center gap-3 text-xs"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-lg font-black">verified_user</span>}
                        PUSH CHANGES TO REGISTRY
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamDetails;
