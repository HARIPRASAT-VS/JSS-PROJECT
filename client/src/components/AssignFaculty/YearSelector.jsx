import React from 'react';
import { motion } from 'framer-motion';

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

const YearSelector = ({ onSelectYear }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 p-10">
            {YEARS.map((year, index) => (
                <motion.div
                    key={year}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectYear(year)}
                    className="group relative cursor-pointer"
                >
                    <div className="absolute inset-0 bg-indigo-600 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-50/50 transition-colors"></div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                <span className="material-symbols-outlined text-3xl">school</span>
                            </div>
                            <h3 className="text-xl font-black text-indigo-950 mb-1">{year}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Management</p>
                            
                            <div className="mt-8 pt-6 border-t border-slate-50 w-full flex items-center justify-center gap-2 text-indigo-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-all">
                                VIEW DASHBOARD
                                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default YearSelector;
