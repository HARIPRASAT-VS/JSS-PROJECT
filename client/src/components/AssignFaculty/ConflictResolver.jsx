import React from 'react';
import { motion } from 'framer-motion';

const ConflictResolver = ({ localData, serverData, onResolve, onCancel }) => {
    return (
        <div className="flex flex-col h-[90vh]">
            <div className="p-10 border-b border-orange-50 bg-orange-50/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                        <span className="material-symbols-outlined text-3xl">sync_problem</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Concurrency Conflict Detected</h2>
                        <p className="text-xs text-slate-500 font-bold mt-1">This registry was updated on the server while you were editing.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-10 flex gap-8">
                {/* Local Version */}
                <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-indigo-600 uppercase tracking-widest text-[10px]">Your Changes</h3>
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black tracking-widest">LOCAL</span>
                    </div>
                    
                    <div className="space-y-6 flex-1 overflow-y-auto pr-4">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 font-black">Faculty Lead</p>
                            <p className="text-sm font-black text-slate-800">{localData.facultyName}</p>
                            <p className="text-xs text-slate-400 font-medium">{localData.facultyEmail}</p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">Personnel ({localData.members.length})</p>
                            {localData.members.map((m, i) => (
                                <div key={i} className="flex justify-between items-center py-2 px-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600">{m.name}</span>
                                    <span className="text-[10px] text-slate-300 font-medium">{m.email}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => onResolve(localData)}
                        className="mt-8 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        KEEP MY CHANGES
                    </button>
                </div>

                <div className="flex items-center text-slate-300">
                    <span className="material-symbols-outlined text-4xl">compare_arrows</span>
                </div>

                {/* Server Version */}
                <div className="flex-1 flex flex-col bg-slate-50/50 border border-slate-200 rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Latest Server Data</h3>
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase">Latest</span>
                    </div>

                    <div className="space-y-6 flex-1 overflow-y-auto pr-4">
                        <div className="p-5 bg-white rounded-2xl border border-slate-200">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">Faculty Lead</p>
                            <p className="text-sm font-black text-slate-800">{serverData.facultyId?.firstName} {serverData.facultyId?.lastName}</p>
                            <p className="text-xs text-slate-400 font-medium">{serverData.facultyId?.email}</p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">Personnel ({serverData.students.length})</p>
                            {serverData.students.map((m, i) => (
                                <div key={i} className="flex justify-between items-center py-2 px-4 bg-white rounded-xl border border-slate-200">
                                    <span className="text-xs font-bold text-slate-600">{m.firstName} {m.lastName}</span>
                                    <span className="text-[10px] text-slate-300 font-medium">{m.email}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => onResolve(serverData)}
                        className="mt-8 w-full bg-slate-200 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-300 transition-all border border-slate-300"
                    >
                        USE SERVER VERSION
                    </button>
                </div>
            </div>

            <div className="p-10 border-t border-slate-50 flex justify-center gap-4">
                <button 
                    onClick={onCancel}
                    className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                    CANCEL & RE-EVALUATE
                </button>
            </div>
        </div>
    );
};

export default ConflictResolver;
