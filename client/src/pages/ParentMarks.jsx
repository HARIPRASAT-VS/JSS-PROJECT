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
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const [marksRes, dashRes] = await Promise.all([
                    API.get('/parent/marks'),
                    API.get('/parent/dashboard')
                ]);
                const marksData = Array.isArray(marksRes.data) ? marksRes.data : [];
                setTests(marksData);
                setChildName(dashRes.data?.child?.name || 'Student');
            } catch (err) {
                console.error('Error fetching marks:', err);
                setError('Failed to load marks. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    const categories = [
        { id: 'TESTMARK', name: 'Test Marks', icon: 'quiz', color: 'bg-blue-500' },
        { id: 'SEM RESULT', name: 'Sem Result', icon: 'school', color: 'bg-indigo-600' },
        { id: 'INTERNAL MARK', name: 'Internal Mark', icon: 'edit_document', color: 'bg-violet-500' }
    ];

    const filteredTests = tests.filter(t => t.testType === selectedCategory);

    // Safely extract this child's score from a test
    const getScore = (test) => {
        if (!test.scores || test.scores.length === 0) return null;
        return test.scores[0]?.marks || null;
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <SideNavBar />
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                <TopAppBar title={selectedCategory
                    ? `${categories.find(c => c.id === selectedCategory)?.name || selectedCategory} — ${childName}`
                    : `Academic Marks — ${childName}`}
                />

                <main className="p-4 md:p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                            <span className="material-symbols-outlined">error</span>
                            {error}
                        </div>
                    )}

                    {!selectedCategory ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {categories.map((cat) => {
                                const count = tests.filter(t => t.testType === cat.id).length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center gap-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group w-full"
                                    >
                                        <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{cat.name}</h3>
                                            <p className="text-slate-400 text-xs font-medium uppercase mt-1 tracking-widest">
                                                {count} record{count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <button
                                onClick={() => { setSelectedCategory(null); setSelectedTest(null); }}
                                className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:gap-3 transition-all"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                Back to Categories
                            </button>

                            {filteredTests.length === 0 ? (
                                <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100">
                                    <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                    </div>
                                    <p className="text-slate-400 font-medium">No tests found in this category.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredTests.map((test) => {
                                        const score = getScore(test);
                                        const isSelected = selectedTest?._id === test._id;
                                        return (
                                            <div
                                                key={test._id}
                                                onClick={() => setSelectedTest(isSelected ? null : test)}
                                                className={`p-6 rounded-3xl cursor-pointer transition-all duration-300 border ${
                                                    isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20'
                                                    : 'bg-white text-slate-800 border-slate-100 hover:border-indigo-300 shadow-sm hover:shadow-md'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-bold text-lg leading-tight">{test.testName}</h4>
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {test.testType}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className={`flex items-center gap-2 text-sm ${isSelected ? 'opacity-80' : 'text-slate-500'}`}>
                                                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                                                        <span>{test.testDate ? new Date(test.testDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-sm ${isSelected ? 'opacity-80' : 'text-slate-500'}`}>
                                                        <span className="material-symbols-outlined text-sm">analytics</span>
                                                        <span>
                                                            {score
                                                                ? score.isAbsent
                                                                    ? 'Absent'
                                                                    : `${score.value} / ${test.totalMarks}`
                                                                : `Out of ${test.totalMarks}`
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedTest && (() => {
                                const score = getScore(selectedTest);
                                const percentage = score && !score.isAbsent && selectedTest.totalMarks > 0
                                    ? ((score.value / selectedTest.totalMarks) * 100).toFixed(1)
                                    : null;
                                const scoreColor = (!score || score.isAbsent)
                                    ? 'text-rose-500'
                                    : percentage >= 75
                                    ? 'text-emerald-600'
                                    : percentage >= 50
                                    ? 'text-amber-500'
                                    : 'text-rose-500';

                                return (
                                    <div className="mt-4 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm animate-in zoom-in-95 duration-300">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div>
                                                <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest">{selectedTest.testType}</span>
                                                <h3 className="text-2xl font-black text-slate-800 mt-1">{selectedTest.testName}</h3>
                                                {selectedTest.testDate && (
                                                    <p className="text-slate-400 text-sm mt-2 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                                                        {new Date(selectedTest.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex gap-4 flex-wrap">
                                                <div className="text-center bg-indigo-50 px-6 py-4 rounded-2xl min-w-[100px]">
                                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Scored</p>
                                                    <p className={`text-4xl font-black ${scoreColor}`}>
                                                        {!score ? '—' : score.isAbsent ? 'AB' : score.value}
                                                    </p>
                                                </div>
                                                <div className="text-center bg-slate-50 px-6 py-4 rounded-2xl min-w-[100px]">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                                    <p className="text-4xl font-black text-slate-700">{selectedTest.totalMarks}</p>
                                                </div>
                                                {percentage !== null && (
                                                    <div className="text-center bg-slate-50 px-6 py-4 rounded-2xl min-w-[100px]">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Percent</p>
                                                        <p className={`text-4xl font-black ${scoreColor}`}>{percentage}%</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-4 flex-wrap">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-indigo-500">person</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student</p>
                                                <p className="font-bold text-slate-700">{childName || 'Your Child'}</p>
                                            </div>
                                            {score && !score.isAbsent && percentage !== null && (
                                                <div className="ml-auto">
                                                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                                                        percentage >= 75 ? 'bg-emerald-50 text-emerald-600' :
                                                        percentage >= 50 ? 'bg-amber-50 text-amber-600' :
                                                        'bg-red-50 text-red-600'
                                                    }`}>
                                                        {percentage >= 75 ? 'Good Standing' : percentage >= 50 ? 'Average' : 'Needs Improvement'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </main>
            </div>
            <BottomNavBar />
        </div>
    );
};

export default ParentMarks;
