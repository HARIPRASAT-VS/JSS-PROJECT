import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNavBar from './SideNavBar';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';

import { AuthContext } from '../context/AuthContext';

const AppLayout = () => {
    const { user } = React.useContext(AuthContext);
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 selection:bg-indigo-100 font-sans">
            {user?.role !== 'student' && <SideNavBar />}
            
            {/* Global Connectivity & Deployment Verification Banner */}
            <div className="fixed top-0 left-0 right-0 z-[100] lg:hidden">
                <div className="bg-indigo-600 text-white px-4 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest shadow-lg">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span>Mobile UI v3.0</span>
                    </div>
                    <div className="opacity-70 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        <span>LIVE: {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className={`flex-1 flex flex-col ${user?.role !== 'student' ? 'lg:ml-64' : ''} w-full relative transition-all duration-300`}>
                <TopAppBar />
                
                {/* Scrollable container for page content */}
                <main className="flex-1 overflow-y-auto w-full pb-20 lg:pb-0 relative scroll-smooth scrollbar-hide">
                    {/* Render child routes here */}
                    <Outlet />
                </main>
                
                <BottomNavBar />
            </div>
        </div>
    );
};

export default AppLayout;
