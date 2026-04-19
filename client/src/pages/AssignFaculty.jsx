import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RegistryProvider, useRegistry } from '../context/RegistryContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

// ─── Add People Form (shared for Members + Faculties) ─────────────────────────
const AddPeopleForm = ({ type, year, onClose }) => {
    const { addPeople, state } = useRegistry();
    const [rows, setRows] = useState([{ name: '', email: '' }]);
    const [error, setError] = useState('');
    const actionId = `add-${type}-${year}`;
    const isLoading = state.loading[actionId];

    const addRow = () => setRows(r => [...r, { name: '', email: '' }]);
    const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));
    const changeRow = (i, field, val) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const filled = rows.filter(r => r.name.trim() && r.email.trim());
        if (filled.length === 0) { setError('Fill in at least one entry.'); return; }

        // Duplicate email check
        const emails = filled.map(r => r.email.toLowerCase());
        if (new Set(emails).size !== emails.length) { setError('Duplicate email detected.'); return; }

        const res = await addPeople(year, type, filled);
        if (res.success) onClose();
        else setError(res.error || 'Failed to add. Try again.');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6"
        >
            <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-indigo-950 uppercase tracking-widest">
                    Add {type === 'members' ? 'Members' : 'Faculties'}
                </h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-xs font-bold text-red-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {rows.map((row, i) => (
                    <motion.div key={i} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-2 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-50 relative"
                    >
                        <div>
                            <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">Name</label>
                            <input required value={row.name} onChange={e => changeRow(i, 'name', e.target.value)}
                                placeholder="Full Name"
                                className="w-full bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold focus:border-indigo-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">Email</label>
                            <div className="flex gap-2">
                                <input required type="email" value={row.email} onChange={e => changeRow(i, 'email', e.target.value)}
                                    placeholder="email@college.edu"
                                    className="flex-1 bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold focus:border-indigo-500 outline-none transition-all" />
                                {rows.length > 1 && (
                                    <button type="button" onClick={() => removeRow(i)}
                                        className="p-3 text-slate-200 hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-sm">remove_circle</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                <button type="button" onClick={addRow}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-indigo-100 text-indigo-500 text-xs font-black hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    ADD ANOTHER ENTRY
                </button>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                        className="flex-1 py-3 rounded-2xl font-black text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        CANCEL
                    </button>
                    <button disabled={isLoading} type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-black text-xs transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isLoading
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <span className="material-symbols-outlined text-sm">sync_alt</span>}
                        SYNC TO REGISTRY
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

// ─── Person Row (Handles Expandable Parents for Members) ──────────────────────
const PersonRow = ({ person, isMember, year, removePerson, editUser, state }) => {
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' });
    const [expanded, setExpanded] = useState(false);
    
    // Parents State
    const [parents, setParents] = useState(person.parents || []);
    const [parentsLoading, setParentsLoading] = useState(false);
    const [parentsError, setParentsError] = useState('');

    const startEdit = (e) => {
        e.stopPropagation();
        setEditId(person._id);
        setEditForm({ firstName: person.firstName || '', lastName: person.lastName || '', email: person.email || '' });
    };

    const saveEdit = async (e) => {
        e.stopPropagation();
        const res = await editUser(year, person._id, editForm);
        if (res.success) setEditId(null);
        else alert(res.error || 'Failed to update user');
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        if (window.confirm('Remove this person from the registry?')) {
            removePerson(year, isMember ? 'members' : 'faculties', person._id);
        }
    };

    const handleParentChange = (index, field, value) => {
        const newParents = [...parents];
        newParents[index][field] = value;
        setParents(newParents);
    };

    const addParent = () => {
        if (parents.length >= 2) return;
        setParents([...parents, { name: '', email: '' }]);
    };

    const removeParent = (index) => {
        if (parents.length <= 1) {
            setParentsError('Minimum 1 parent is required.');
            setTimeout(() => setParentsError(''), 3000);
            return;
        }
        setParents(parents.filter((_, i) => i !== index));
    };

    const saveParents = async () => {
        setParentsError('');
        const filled = parents.filter(p => p.name.trim() && p.email.trim());
        if (filled.length < 1) {
            setParentsError('Minimum 1 parent required with name and email.');
            return;
        }
        setParentsLoading(true);
        const res = await editUser(year, person._id, { parents: filled });
        if (!res.success) setParentsError(res.error || 'Failed to save parents');
        else {
            setParents(filled);
            // Flash success optionally
        }
        setParentsLoading(false);
    };

    const isRemoving = state.loading[`remove-${isMember ? 'members' : 'faculties'}-${person._id}`];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`bg-white border rounded-2xl group transition-all overflow-hidden ${expanded ? 'border-indigo-300 shadow-md' : 'border-slate-100 hover:border-indigo-100 hover:shadow-sm'}`}
        >
            {/* Header / Basic Row */}
            <div 
                onClick={() => isMember && !editId && setExpanded(!expanded)}
                className={`flex items-center gap-4 p-5 ${isMember && !editId ? 'cursor-pointer' : ''}`}
            >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${isMember ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-900 text-white'}`}>
                    {person.firstName?.[0]?.toUpperCase() || '?'}
                </div>
                {editId === person._id ? (
                    <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-3 items-center ml-2" onClick={e => e.stopPropagation()}>
                        <input
                            value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                            placeholder="First Name"
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none w-full"
                        />
                        <input
                            value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                            placeholder="Last Name"
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none w-full"
                        />
                        <input
                            value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="Email" type="email"
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none w-full md:col-span-2"
                        />
                    </div>
                ) : (
                    <div className="flex-1 min-w-0 ml-2">
                        <p className="text-sm font-black text-slate-900 truncate flex items-center gap-2">
                            {person.firstName} {person.lastName}
                            {isMember && (
                                <span className="material-symbols-outlined text-[14px] text-slate-300">
                                    {expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-slate-400 font-medium truncate">{person.email}</p>
                    </div>
                )}

                {!isMember && editId !== person._id && (
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        Faculty
                    </span>
                )}

                {editId === person._id ? (
                    <div className="flex items-center gap-1">
                        <button onClick={saveEdit} disabled={state.loading[`edit-${person._id}`]}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all">
                            {state.loading[`edit-${person._id}`]
                                ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                                : <span className="material-symbols-outlined text-sm">check</span>}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditId(null); }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={startEdit}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                            disabled={isRemoving}
                            onClick={handleRemove}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30"
                        >
                            {isRemoving
                                ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                : <span className="material-symbols-outlined text-sm">person_remove</span>}
                        </button>
                    </div>
                )}
            </div>

            {/* Parents Dropdown */}
            {isMember && expanded && !editId && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5 p-top-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Parent Mapping</h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">{parents.length}/2 Parents</span>
                    </div>

                    {parentsError && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-xs font-bold text-red-600 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {parentsError}
                        </div>
                    )}

                    <div className="space-y-3">
                        {parents.map((parent, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex-1 w-full relative">
                                    <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">Parent {idx + 1} Name</span>
                                    <input 
                                        type="text" value={parent.name} onChange={e => handleParentChange(idx, 'name', e.target.value)}
                                        className="w-full text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none p-1 mt-1" placeholder="Parent Name" 
                                    />
                                </div>
                                <div className="w-full sm:w-px sm:h-8 bg-slate-100" />
                                <div className="flex-1 w-full relative">
                                    <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">Parent {idx + 1} Email</span>
                                    <input 
                                        type="email" value={parent.email} onChange={e => handleParentChange(idx, 'email', e.target.value)}
                                        className="w-full text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none p-1 mt-1" placeholder="Parent Email Address" 
                                    />
                                </div>
                                <button onClick={() => removeParent(idx)} className="self-end sm:self-auto p-2 text-slate-300 hover:text-red-500 transition-colors ml-auto">
                                    <span className="material-symbols-outlined text-sm">remove_circle</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                        {parents.length < 2 && (
                            <button onClick={addParent} className="flex-1 py-2 rounded-xl text-[10px] font-black text-indigo-500 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[14px]">add</span> Add Parent
                            </button>
                        )}
                        <button onClick={saveParents} disabled={parentsLoading} className="flex-1 py-2 rounded-xl text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 uppercase tracking-widest shadow-sm">
                            {parentsLoading ? <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[14px]">save</span>}
                            Save Parents
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// ─── People List (shared for Members + Faculties) ─────────────────────────────
const PeopleList = ({ people, type, year, onBack }) => {
    const { removePerson, editUser, state } = useRegistry();
    const [showForm, setShowForm] = useState(false);
    const isMember = type === 'members';

    return (
        <div className="space-y-6">
            {/* Sub-header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack}
                        className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </button>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{year}</p>
                        <h3 className="text-xl font-black text-indigo-950">{isMember ? 'Members' : 'Faculties'}</h3>
                    </div>
                </div>
                <button onClick={() => setShowForm(s => !s)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'}`}>
                    <span className="material-symbols-outlined text-sm font-black">{showForm ? 'close' : 'person_add'}</span>
                    {showForm ? 'CANCEL' : `ADD ${isMember ? 'MEMBER' : 'FACULTY'}`}
                </button>
            </div>

            {/* Add Form */}
            <AnimatePresence>
                {showForm && (
                    <AddPeopleForm type={type} year={year} onClose={() => setShowForm(false)} />
                )}
            </AnimatePresence>

            {/* List */}
            <div className="space-y-3">
                {people.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
                            {isMember ? 'group_off' : 'person_off'}
                        </span>
                        <p className="text-sm font-bold text-slate-400">
                            No {isMember ? 'members' : 'faculties'} registered for {year}
                        </p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {people.map((person) => (
                            <PersonRow 
                                key={person._id} 
                                person={person} 
                                isMember={isMember} 
                                year={year} 
                                removePerson={removePerson} 
                                editUser={editUser}
                                state={state} 
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

// ─── Year View (Members + Faculties boxes) ────────────────────────────────────
const YearView = ({ year, onBack }) => {
    const { state, fetchYear } = useRegistry();
    const [activeList, setActiveList] = useState(null); // null | 'members' | 'faculties'
    const isLoading = state.loading[`fetch-${year}`];
    const yearData = state.years[year] || { members: [], faculties: [] };

    useEffect(() => {
        fetchYear(year);
    }, [year, fetchYear]);

    if (activeList) {
        const people = yearData[activeList] || [];
        return (
            <motion.div
                key="list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
            >
                <PeopleList people={people} type={activeList} year={year} onBack={() => setActiveList(null)} />
            </motion.div>
        );
    }

    return (
        <motion.div
            key="yearview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex items-center gap-5">
                <button onClick={onBack}
                    className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h2 className="text-3xl font-black text-indigo-950 tracking-tight">{year}</h2>
                    <p className="text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-[0.2em]">Registry Management</p>
                </div>
                <button onClick={() => fetchYear(year, true)}
                    className="ml-auto p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                    <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                </button>
            </div>

            {/* Two Big Boxes */}
            {isLoading && !state.years[year] ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2].map(i => (
                        <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-slate-50 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Members Box */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        onClick={() => setActiveList('members')}
                        className="group relative cursor-pointer bg-white rounded-[2.5rem] p-10 border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                        <div className="relative">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                <span className="material-symbols-outlined text-3xl">group</span>
                            </div>
                            <h3 className="text-2xl font-black text-indigo-950 mb-2">Members</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Student Personnel</p>

                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {yearData.members.length} Enrolled
                                    </span>
                                </div>
                                <span className="material-symbols-outlined text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                                    arrow_forward
                                </span>
                            </div>

                            {/* Avatar stack */}
                            {yearData.members.length > 0 && (
                                <div className="flex -space-x-2 mt-6">
                                    {yearData.members.slice(0, 5).map((m, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                                            {m.firstName?.[0] || '?'}
                                        </div>
                                    ))}
                                    {yearData.members.length > 5 && (
                                        <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                            +{yearData.members.length - 5}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Faculties Box */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        onClick={() => setActiveList('faculties')}
                        className="group relative cursor-pointer bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 hover:border-slate-600 hover:shadow-2xl hover:shadow-slate-900/30 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                        <div className="relative">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:bg-indigo-600 transition-all shadow-inner">
                                <span className="material-symbols-outlined text-3xl">school</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Faculties</h3>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Academic Staff</p>

                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]" />
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                        {yearData.faculties.length} Assigned
                                    </span>
                                </div>
                                <span className="material-symbols-outlined text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                                    arrow_forward
                                </span>
                            </div>

                            {/* Avatar stack */}
                            {yearData.faculties.length > 0 && (
                                <div className="flex -space-x-2 mt-6">
                                    {yearData.faculties.slice(0, 5).map((f, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-indigo-900 border-2 border-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-300 uppercase">
                                            {f.firstName?.[0] || '?'}
                                        </div>
                                    ))}
                                    {yearData.faculties.length > 5 && (
                                        <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-slate-800 flex items-center justify-center text-[8px] font-black text-white/50">
                                            +{yearData.faculties.length - 5}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

// ─── Year Selector ─────────────────────────────────────────────────────────────
const YearSelector = ({ onSelect }) => (
    <div className="space-y-8">
        <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Admin Portal</p>
            <h1 className="text-4xl font-black text-indigo-950 tracking-tight">Faculty Management</h1>
            <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">Select an academic year to manage</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {YEARS.map((year, i) => (
                <motion.div
                    key={year}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -5 }}
                    onClick={() => onSelect(year)}
                    className="group cursor-pointer bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-indigo-100 transition-colors" />
                    <div className="relative text-center">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mx-auto mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-2xl">school</span>
                        </div>
                        <h3 className="text-base font-black text-indigo-950">{year}</h3>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Manage</p>
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const AssignFacultyContent = () => {
    const [selectedYear, setSelectedYear] = useState(null);

    return (
        <div className="p-3 md:p-6 space-y-6 max-w-6xl mx-auto w-full relative z-10 hidden-scrollbar pb-24">
            <AnimatePresence mode="wait">
                {!selectedYear ? (
                    <motion.div
                        key="selector"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <YearSelector onSelect={setSelectedYear} />
                    </motion.div>
                ) : (
                    <motion.div
                        key={selectedYear}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <YearView year={selectedYear} onBack={() => setSelectedYear(null)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AssignFaculty = () => (
    <RegistryProvider>
        <AssignFacultyContent />
    </RegistryProvider>
);

export default AssignFaculty;
