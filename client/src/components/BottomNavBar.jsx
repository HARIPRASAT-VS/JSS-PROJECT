import React, { useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
        { label: 'Leave Approval', icon: 'rule', path: '/leave' }, // Replaced Calendar with Leave Approval
        { label: 'Profile', icon: 'person', path: '#', inactive: true }, // Added Profile (inactive)
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

    const navigate = useNavigate();

    const handleFabClick = () => {
        navigate('/dashboard');
        // Small delay to ensure route change before dispatching event
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-otp-entry'));
        }, 100);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-safe z-[60] shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-around px-2 min-h-[64px] relative">
                {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');

                    // If it's student, we insert the FAB in the middle (index 2)
                    if (user?.role === 'student' && idx === 2) {
                        return (
                            <React.Fragment key="fab-wrapper">
                                {/* FAB Button */}
                                <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                                    <button 
                                        onClick={handleFabClick}
                                        className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-900/40 active:scale-95 transition-all border-4 border-white"
                                    >
                                        <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
                                    </button>
                                </div>
                                
                                {/* Padding for the empty middle slot in the flex-row if needed, but justify-around handles it if we have 4 items? 
                                    Actually, we have 4 items in studentItems now: Home, Classes, Leave Approval, Profile.
                                    The FAB is absolute.
                                */}
                                <div className="w-14 h-full pointer-events-none" />

                                <div 
                                    key={idx} 
                                    className={`flex flex-col items-center justify-center p-2 min-w-[64px] min-h-[48px] rounded-xl transition-all duration-200 ${
                                        item.inactive ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                                    } ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                                >
                                    <span className={`material-symbols-outlined text-[24px] mb-1 transition-all duration-200 ${isActive ? 'fill-1 scale-110 drop-shadow-sm' : ''}`}>
                                        {item.icon}
                                    </span>
                                    <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            </React.Fragment>
                        );
                    }

                    return (
                        <div 
                            key={idx} 
                            onClick={() => !item.inactive && navigate(item.path)}
                            className={`flex flex-col items-center justify-center p-2 min-w-[64px] min-h-[48px] rounded-xl transition-all duration-200 ${
                                item.inactive ? 'opacity-50 cursor-default' : 'active:scale-95 cursor-pointer'
                            } ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] mb-1 transition-all duration-200 ${isActive ? 'fill-1 scale-110 drop-shadow-sm' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavBar;
