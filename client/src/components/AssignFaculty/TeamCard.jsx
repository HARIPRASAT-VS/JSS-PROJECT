import React from 'react';
import { motion } from 'framer-motion';

const TeamCard = ({ team, onClick, onDelete, loading }) => {
    return (
        <motion.div
            layoutId={team._id || team.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-indigo-200 transition-all group relative shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer overflow-hidden"
            onClick={() => onClick(team)}
        >
            {team.status === 'saving' && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors opacity-50"></div>
            
            <div className="flex justify-between items-start mb-6 relative">
                <div>
                    <h3 className="text-lg font-black text-indigo-950">{team.facultyId?.firstName || team.facultyName} {team.facultyId?.lastName || ''}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5 tracking-tight">{team.facultyId?.email || team.facultyEmail}</p>
                </div>
                <button 
                    disabled={loading}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(team._id || team.id);
                    }}
                    className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <span className="material-symbols-outlined text-base">delete</span>
                </button>
            </div>

            <div className="space-y-4 relative">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        {team.students?.length || 0} Personnel Linked
                    </span>
                </div>
                
                <div className="flex -space-x-2 overflow-hidden">
                    {(team.students || []).slice(0, 4).map((student, i) => (
                        <div key={student._id || i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                            {student.firstName?.[0] || 'S'}
                        </div>
                    ))}
                    {(team.students?.length > 4) && (
                        <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                            +{team.students.length - 4}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-black text-indigo-600/40 uppercase tracking-widest">Team Sync ID: {String(team._id || team.id).slice(-6)}</span>
                    <span className="material-symbols-outlined text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">arrow_forward</span>
                </div>
            </div>
        </motion.div>
    );
};

export default TeamCard;
