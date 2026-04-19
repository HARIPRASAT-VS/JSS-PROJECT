import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import TopAppBar from '../components/TopAppBar';
import SideNavBar from '../components/SideNavBar';
import BottomNavBar from '../components/BottomNavBar';

const ParentLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [childName, setChildName] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const [leavesRes, dashRes] = await Promise.all([
                API.get('/parent/leave'),
                API.get('/parent/dashboard')
            ]);
            setLeaves(leavesRes.data);
            setChildName(dashRes.data.child?.name || '');
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
            // Optimistic update
            setLeaves(prev => prev.map(l => {
                if (l._id !== id) return l;
                return {
                    ...l,
                    parentStatus: action === 'approve' ? 'Approved' : 'Rejected',
                    status: action === 'reject' ? 'Rejected' : l.status
                };
            }));
            await API.patch(`/parent/leave/${id}/${action}`);
            // Let the optimistic update carry on, or we can fetch. Fetching makes it double-sure.
            fetchLeaves();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating leave status');
            fetchLeaves(); // Revert on error
        }
    };

    const pendingLeaves = leaves.filter(l => l.parentStatus === 'Pending');

    const LeaveCard = ({ leave }) => (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 animate-in slide-in-from-right-4 duration-500">
            {/* Leave Type Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-500">
                <span className="material-symbols-outlined text-3xl">
                    {leave.type === 'Sick Leave' ? 'medical_services' : 'event_busy'}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{leave.type}</h3>
                        <p className="text-slate-500 mt-1">{leave.reason}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                            Parent Action Required
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-50">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Duration</p>
                        <p className="font-bold text-slate-700 text-sm">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Timings</p>
                        <p className="font-bold text-slate-700 text-sm">{leave.startTime} to {leave.endTime}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Live Attendance</p>
                        <p className={`font-black text-sm ${
                             leave.liveAttendance === null ? 'text-slate-500' :
                             parseFloat(leave.liveAttendance) < 75 ? 'text-red-600' :
                             parseFloat(leave.liveAttendance) < 85 ? 'text-amber-600' :
                             'text-emerald-600'
                        }`}>
                            {leave.liveAttendance ? `${leave.liveAttendance}%` : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Assignee</p>
                        <p className="font-bold text-slate-700 text-sm">Faculty: {leave.facultyId?.firstName}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => handleAction(leave._id, 'approve')}
                        className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20"
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
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <SideNavBar />
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                <TopAppBar title={`Leave Authorization - ${childName}`} />
                
                <main className="p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pending Approval</h2>
                                    <p className="text-slate-500 font-medium">Review and authorize your child's leave requests.</p>
                                </div>

                                {pendingLeaves.length === 0 ? (
                                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">No Pending Requests</h3>
                                        <p className="text-slate-400">Everything is caught up.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingLeaves.map(leave => <LeaveCard key={leave._id} leave={leave} />)}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </main>
            </div>
            <BottomNavBar />
        </div>
    );
};

export default ParentLeave;
