import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_LABELS = {
    admin:   'Admin Portal',
    faculty: 'Faculty Portal',
    student: 'Student Portal',
};

const TopAppBar = ({ title }) => {
    const { user, logout } = useContext(AuthContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const roleLabel = ROLE_LABELS[user?.role] || 'Portal';
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';
    const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;

    // Smart title logic
    const displayTitle = title || (user?.role === 'parent' && user?.child?.name ? `Parent of ${user.child.name}` : roleLabel);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 w-full h-[56px] bg-white/90 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 z-40 shadow-sm border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-4 flex-1">
                {/* Page Title - NEWLY ADDED VISIBILITY */}
                <div className="hidden lg:block">
                    <h1 className="text-lg font-black text-indigo-950 truncate max-w-[300px]">
                        {displayTitle}
                    </h1>
                </div>

                <div className="relative w-full max-w-sm hidden lg:block ml-4">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input 
                        className="w-full bg-slate-50/50 border-0 rounded-full pl-10 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 placeholder-slate-400 outline-none" 
                        placeholder="Search academics..." 
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-5">
                <div className="flex items-center gap-3 relative" ref={dropdownRef}>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-indigo-900">{displayName}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter italic">{roleLabel}</p>
                    </div>
                    <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)} 
                        className="w-9 h-9 flex-shrink-0 rounded-full bg-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-primary font-bold hover:ring-2 hover:ring-primary/40 focus:outline-none transition-all"
                    >
                        {initials}
                    </button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl shadow-indigo-900/10 border border-slate-100 py-2 z-50 overflow-hidden"
                            >
                                <div className="px-4 py-2 border-b border-slate-50 mb-2 sm:hidden">
                                    <p className="text-sm font-bold text-indigo-900">{displayName}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter italic">{roleLabel}</p>
                                </div>
                                <button className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                    <span className="material-symbols-outlined text-lg">person</span> Profile
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                    <span className="material-symbols-outlined text-lg">settings</span> Settings
                                </button>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button 
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm font-bold text-error hover:bg-error-container/20 flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span> Logout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default TopAppBar;
