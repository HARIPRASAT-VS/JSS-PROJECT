import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const BottomNavBar = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    const commonItems = [
        { label: 'Home', icon: 'home', path: '/dashboard' },
    ];

    const studentItems = [
        ...commonItems,
        { label: 'Classes', icon: 'grid_view', path: '/attendance' },
        { label: 'Attendance', icon: 'calendar_today', path: '/attendance/detail' },
        { label: 'Leaves', icon: 'event_note', path: '/leave' },
    ];

    const facultyItems = [
        ...commonItems,
        { label: 'Leaves', icon: 'rule', path: '/leave' },
        { label: 'Marks', icon: 'grade', path: '/faculty/marks' },
        { label: 'Users', icon: 'person_search', path: '/faculty/unblock' },
    ];

    const adminItems = [
        ...commonItems,
        { label: 'Assign', icon: 'group_add', path: '/admin/assign' },
        { label: 'Blocked', icon: 'block', path: '/admin/blocked' },
    ];

    const parentItems = [
        ...commonItems,
        { label: 'Marks', icon: 'grade', path: '/parent/marks' },
        { label: 'Leaves', icon: 'rule', path: '/parent/leave' },
    ];

    const navItems = user?.role === 'admin' ? adminItems : 
                   user?.role === 'parent' ? parentItems :
                   user?.role === 'faculty' ? facultyItems : 
                   studentItems;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-safe z-[60] shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-around px-2 min-h-[64px]">
                {navItems.map((item, idx) => {
                    // Match exact paths, except for home which acts as a catch-all for nested dashboard paths if needed
                    const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');

                    return (
                        <NavLink 
                            key={idx} 
                            to={item.path}
                            className={`flex flex-col items-center justify-center p-2 min-w-[64px] min-h-[48px] rounded-xl transition-all duration-200 active:scale-95 ${
                                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[24px] mb-1 transition-all duration-200 ${isActive ? 'fill-1 scale-110 drop-shadow-sm' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavBar;
