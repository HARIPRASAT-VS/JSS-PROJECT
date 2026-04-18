import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaculty, getTeamsByYear } from '../../context/FacultyContext';
import TeamCard from './TeamCard';

const YearDashboard = ({ year, onBack, onCreate, onSelectTeam }) => {
    const { state, fetchTeamsByYear, deleteTeam } = useFaculty();
    const teams = getTeamsByYear(state, year);
    const isLoading = state.loadingActions[`fetch-${year}`];

    useEffect(() => {
        fetchTeamsByYear(year);
    }, [year, fetchTeamsByYear]);

    const handleDelete = (id) => {
        if (window.confirm('Archive this team registry?')) {
            deleteTeam(id, year);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-indigo-950 tracking-tight">{year}</h2>
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                Dashboard
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-1 tracking-wide">Manage faculty assignments and team personnel</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => fetchTeamsByYear(year, true)}
                        className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"
                        title="Refresh Registry"
                    >
                        <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                    <button 
                        onClick={onCreate}
                        className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                    >
                        <span className="material-symbols-outlined font-black">add</span>
                        CREATE NEW TEAM
                    </button>
                </div>
            </div>

            {/* Content Group */}
            <div className="relative flex-1">
                <AnimatePresence mode="popLayout">
                    {isLoading && teams.length === 0 ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                        >
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-white rounded-[2.5rem] p-8 border border-slate-50 animate-pulse">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-3 w-2/3">
                                            <div className="h-6 bg-slate-100 rounded-lg w-full"></div>
                                            <div className="h-4 bg-slate-50 rounded-lg w-1/2"></div>
                                        </div>
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl"></div>
                                    </div>
                                    <div className="space-y-4 mt-8">
                                        <div className="h-2 bg-slate-50 rounded-full w-1/3"></div>
                                        <div className="flex gap-2">
                                            {[1, 2, 3].map(j => <div key={j} className="w-8 h-8 rounded-full bg-slate-50"></div>)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : teams.length === 0 ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8">
                                <span className="material-symbols-outlined text-5xl">group_off</span>
                            </div>
                            <h4 className="text-xl font-black text-indigo-950 mb-2">Registry Empty</h4>
                            <p className="text-sm text-slate-400 font-medium mb-10">No faculty teams have been synchronized for {year} yet.</p>
                            <button 
                                onClick={onCreate}
                                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-xs hover:bg-indigo-600 transition-colors"
                            >
                                START FIRST REGISTRY
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="list"
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                        >
                            {teams.map(team => (
                                <TeamCard 
                                    key={team._id || team.id} 
                                    team={team} 
                                    onClick={onSelectTeam}
                                    onDelete={handleDelete}
                                    loading={state.loadingActions[`delete-${team._id}`]}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default YearDashboard;
