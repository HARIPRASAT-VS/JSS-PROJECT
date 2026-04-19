import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import TopAppBar from '../components/TopAppBar';
import SideNavBar from '../components/SideNavBar';
import BottomNavBar from '../components/BottomNavBar';

const ParentMarks = () => {
    const [tests, setTests] = useState([]);
    const [childName, setChildName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTest, setSelectedTest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                // Fetch dashboard too to get student name for header
                const [marksRes, dashRes] = await Promise.all([
                    API.get('/parent/marks'),
                    API.get('/parent/dashboard')
                ]);
                setTests(marksRes.data);
                setChildName(dashRes.data.child?.name || '');
            } catch (err) {
                console.error('Error fetching marks:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    const categories = [
        { id: 'TESTMARK', name: 'TESTMARK', icon: 'quiz', color: 'bg-blue-500' },
        { id: 'SEM RESULT', name: 'SEM RESULT', icon: 'school', color: 'bg-indigo-600' },
        { id: 'INTERNAL MARK', name: 'INTERNAL MARK', icon: 'edit_document', color: 'bg-violet-500' }
    ];

    const filteredTests = tests.filter(t => t.testType === selectedCategory);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <SideNavBar />
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                <TopAppBar title={selectedCategory ? `${selectedCategory} - ${childName}` : `Marks - ${childName}`} />
                
                <main className="p-4 md:p-8">
                    {!selectedCategory ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center gap-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group"
                                >
                                    <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                        <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{cat.name}</h3>
                                        <p className="text-slate-400 text-xs font-medium uppercase mt-1 tracking-widest">Academic Records</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button 
                                onClick={() => { setSelectedCategory(null); setSelectedTest(null); }}
                                className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:gap-3 transition-all"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                Back to Categories
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTests.map((test) => (
                                    <div 
                                        key={test._id}
                                        onClick={() => setSelectedTest(test)}
                                        className={`p-6 rounded-3xl cursor-pointer transition-all duration-300 border ${
                                            selectedTest?._id === test._id 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20' 
                                            : 'bg-white text-slate-800 border-slate-100 hover:border-indigo-300 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-lg leading-tight">{test.testName}</h4>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${selectedTest?._id === test._id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                                {test.subject || 'GENERAL'}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 opacity-80 text-sm">
                                                <span className="material-symbols-outlined text-sm">calendar_month</span>
                                                <span>{new Date(test.testDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-80 text-sm">
                                                <span className="material-symbols-outlined text-sm">analytics</span>
                                                <span>Total: {test.totalMarks} Marks</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredTests.length === 0 && (
                                    <div className="col-span-full py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                                            <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                        </div>
                                        <p className="text-slate-400 font-medium">No tests found in this category.</p>
                                    </div>
                                )}
                            </div>

                            {selectedTest && (
                                <div className="mt-8 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-in zoom-in-95 duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest">{selectedTest.testType}</span>
                                            <h3 className="text-2xl font-black text-slate-800 mt-1">{selectedTest.testName}</h3>
                                        </div>
                                        
                                        <div className="flex gap-4">
                                          <div className="text-center bg-indigo-50 px-6 py-4 rounded-2xl">
                                              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Marks Obtained</p>
                                              <p className={`text-4xl font-black mt-1 ${selectedTest.scores[0]?.marks?.isAbsent ? 'text-rose-500' : 'text-indigo-600'}`}>
                                                  {selectedTest.scores[0]?.marks?.isAbsent ? 'AB' : selectedTest.scores[0]?.marks?.value}
                                              </p>
                                          </div>
                                          <div className="text-center bg-slate-50 px-6 py-4 rounded-2xl">
                                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                                              <p className="text-4xl font-black mt-1 text-slate-700">{selectedTest.totalMarks}</p>
                                          </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-4 text-slate-500">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined">person</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student</p>
                                            <p className="font-bold text-slate-700">{user?.child?.name || 'Your Child'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
            <BottomNavBar />
        </div>
    );
};

export default ParentMarks;
