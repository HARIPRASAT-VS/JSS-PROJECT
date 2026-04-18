import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SideNavBar = () => {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const commonItems = [
        { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    ];

    const studentItems = [
        ...commonItems,
        { name: 'Attendance', icon: 'calendar_today', path: '/attendance' },
        { name: 'Leave Requests', icon: 'event_note', path: '/leave' },
    ];

    const facultyItems = [
        ...commonItems,
        { name: 'Leave Approval', icon: 'rule', path: '/leave' },
        { name: 'Marks', icon: 'grade', path: '/faculty/marks' },
        { name: 'View Report', icon: 'assessment', path: '/faculty/reports' },
    ];

    const adminItems = [
        ...commonItems,
        { name: 'Assign Faculty', icon: 'group_add', path: '/admin/assign' },
        { name: 'Blocked Users', icon: 'block', path: '/admin/blocked' },
    ];

    const parentItems = [
        ...commonItems,
        { name: 'Marks', icon: 'grade', path: '/parent/marks' },
        { name: 'Leave', icon: 'rule', path: '/parent/leave' },
    ];

    const navItems = user?.role === 'admin' ? adminItems : 
                   user?.role === 'parent' ? parentItems :
                   user?.role === 'faculty' ? facultyItems : 
                   studentItems;

    return (
        <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col p-4 space-y-2 bg-slate-50 border-r border-slate-200 hidden md:flex z-50">
            <div className="flex items-center gap-3 px-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <span className="material-symbols-outlined fill-1">school</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-indigo-900 tracking-tight">Curator Pro</h2>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{user?.role || 'Portal'}</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                                isActive 
                                ? 'bg-indigo-100/50 text-indigo-700' 
                                : 'text-slate-600 hover:bg-slate-200/50'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="space-y-1 mt-auto">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm group"
                >
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default SideNavBar;

