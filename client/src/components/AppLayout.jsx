import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNavBar from './SideNavBar';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';

const AppLayout = () => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 selection:bg-indigo-100 font-sans">
            <SideNavBar />
            
            {/* Main content area */}
            <div className="flex-1 flex flex-col md:ml-64 w-full relative">
                <TopAppBar />
                
                {/* Scrollable container for page content */}
                <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0 relative scroll-smooth scrollbar-hide">
                    {/* Render child routes here */}
                    <Outlet />
                </main>
                
                <BottomNavBar />
            </div>
        </div>
    );
};

export default AppLayout;
