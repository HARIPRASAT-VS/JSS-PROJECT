import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import TopAppBar from '../components/TopAppBar';
import SideNavBar from '../components/SideNavBar';
import BottomNavBar from '../components/BottomNavBar';

const ParentLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const res = await API.get('/parent/leave');
            setLeaves(res.data);
        } catch (err) {
            console.error('Error fetching leaves:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleAction = async (id, action) => {
        try {
            await API.patch(`/parent/leave/${id}/${action}`);
            fetchLeaves(); // Refresh the list
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating leave status');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <SideNavBar />
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                <TopAppBar title="Leave Authorizations" />
                
                <main className="p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <section className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pending Approval</h2>
                            <p className="text-slate-500 font-medium">Review and authorize your child's leave requests.</p>
                        </section>

                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : leaves.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No Pending Requests</h3>
                                <p className="text-slate-400">Everything is caught up.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {leaves.map((leave) => (
                                    <div key={leave._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 animate-in slide-in-from-right-4 duration-500">
                                        {/* Leave Type Icon */}
                                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-3xl">event_busy</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800">{leave.type}</h3>
                                                    <p className="text-slate-500 mt-1">{leave.reason}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    Parent Approval Required
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-y border-slate-50">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Duration</p>
                                                    <p className="font-bold text-slate-700 text-sm">
                                                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Timings</p>
                                                    <p className="font-bold text-slate-700 text-sm">{leave.startTime} to {leave.endTime}</p>
                                                </div>
                                                <div className="col-span-2 md:col-span-1">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Assignee</p>
                                                    <p className="font-bold text-slate-700 text-sm">Faculty: {leave.facultyId?.firstName}</p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => handleAction(leave._id, 'approve')}
                                                    className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined">check</span>
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(leave._id, 'reject')}
                                                    className="flex-1 bg-white border border-rose-200 text-rose-500 font-bold py-3 rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined">close</span>
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <BottomNavBar />
        </div>
    );
};

export default ParentLeave;
