import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const BottomNavBar = () => {
    const location = useLocation();

    // Map routes to bottom nav items. We route "Explore" to /dashboard for now as per plan, 
    // "Scan" could just open the CheckInCard on dashboard.
    const navItems = [
        { path: '/dashboard', icon: 'home', label: 'Home' },
        { path: '/attendance', icon: 'grid_view', label: 'Explore' },
        { path: '/scan', icon: 'barcode_scanner', label: 'Scan', isCenter: true },
        { path: '/attendance/detail', icon: 'calendar_today', label: 'Attendance' },
        { path: '/profile', icon: 'person', label: 'Profile' },
    ];

    // For missing paths, map them back to dashboard to avoid broken links
    const getTarget = (path) => {
        if (path === '/profile') return '/dashboard';
        if (path === '/scan') return '/dashboard'; 
        return path;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-around px-2 py-2">
                {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
                    
                    if (item.isCenter) {
                        return (
                            <NavLink 
                                key={idx} 
                                to={getTarget(item.path)}
                                className="relative -top-5 flex flex-col items-center"
                            >
                                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 transform transition-transform hover:scale-105 active:scale-95 border-4 border-slate-50">
                                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                </div>
                            </NavLink>
                        );
                    }

                    return (
                        <NavLink 
                            key={idx} 
                            to={getTarget(item.path)}
                            className={`flex flex-col items-center p-2 pt-3 min-w-[60px] transition-colors ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span className={`material-symbols-outlined text-[26px] ${isActive ? 'fill-1' : ''}`}>{item.icon}</span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavBar;
