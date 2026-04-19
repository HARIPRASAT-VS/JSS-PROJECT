import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import TopAppBar from '../components/TopAppBar';
import SideNavBar from '../components/SideNavBar';
import BottomNavBar from '../components/BottomNavBar';

const ParentFees = () => {
    const [fees, setFees] = useState(null);
    const [childName, setChildName] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [feesRes, dashRes] = await Promise.all([
                    API.get('/parent/fees'),
                    API.get('/parent/dashboard')
                ]);
                setFees(feesRes.data);
                setChildName(dashRes.data.child?.name || '');
            } catch (err) {
                console.error('Error fetching fees:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const FeeBlock = ({ title, icon, color, total, paid, balance }) => (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col h-full transform transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white mb-6 shadow-lg shadow-current/20`}>
                <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight uppercase">{title}</h3>
            
            <div className="space-y-6 flex-1">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fee</p>
                        <p className="text-2xl font-black text-slate-700">₹{total?.toLocaleString()}</p>
                    </div>
                </div>
                
                <div className="h-px bg-slate-50 w-full"></div>
                
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                        <p className="text-3xl font-black text-rose-500">₹{balance?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid</p>
                        <p className="text-sm font-bold text-emerald-500">₹{paid?.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${color} transition-all duration-1000`} 
                        style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <SideNavBar />
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                <TopAppBar title={`Fees - ${childName}`} />
                
                <main className="p-4 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-4 mb-2">
                             <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                             </button>
                             <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Structured Breakdown</h2>
                                <p className="text-slate-500 font-medium italic text-sm">Review child's campus financial standing</p>
                             </div>
                        </div>

                        {/* Top Section: Side-by-Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FeeBlock 
                                title="College Fees" 
                                icon="account_balance" 
                                color="bg-indigo-600"
                                total={fees?.college?.total}
                                paid={fees?.college?.paid}
                                balance={fees?.collegeBalance}
                            />
                            <FeeBlock 
                                title="Hostel Fees" 
                                icon="bed" 
                                color="bg-violet-600"
                                total={fees?.hostel?.total}
                                paid={fees?.hostel?.paid}
                                balance={fees?.hostelBalance}
                            />
                        </div>

                        {/* Middle Section: Mess Fees */}
                        <div className="w-full">
                            <FeeBlock 
                                title="Mess Fees" 
                                icon="restaurant" 
                                color="bg-amber-500"
                                total={fees?.mess?.total}
                                paid={fees?.mess?.paid}
                                balance={fees?.messBalance}
                            />
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
                            <span className="material-symbols-outlined text-indigo-600">info</span>
                            <p className="text-sm text-indigo-900 font-medium">
                                Values are updated in real-time by the campus administrative office. For payment receipts, please visit the cash counter or download the official campus app.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
            <BottomNavBar />
        </div>
    );
};

export default ParentFees;
