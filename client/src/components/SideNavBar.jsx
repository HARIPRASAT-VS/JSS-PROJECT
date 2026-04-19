import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SideNavBar = () => {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const toggleMenu = () => setIsOpen(prev => !prev);
        window.addEventListener('toggle-mobile-nav', toggleMenu);
        return () => window.removeEventListener('toggle-mobile-nav', toggleMenu);
    }, []);

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
        { name: 'Unblock User', icon: 'lock_open', path: '/faculty/unblock' },
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
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-[45] md:hidden backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsOpen(false)} 
                />
            )}
            <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col p-4 space-y-2 bg-slate-50 border-r border-slate-200 z-50 transition-transform duration-300 md:translate-x-0 md:flex ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center gap-3 px-2 mb-8 mt-2 md:mt-0">
                    <div className="md:hidden p-1 mr-[-8px] text-slate-400 cursor-pointer" onClick={() => setIsOpen(false)}>
                        <span className="material-symbols-outlined">close</span>
                    </div>
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
                            onClick={() => setIsOpen(false)} /* Auto-close menu on nav */
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

                <div className="space-y-1 mt-auto pb-4">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm group"
                    >
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default SideNavBar;

