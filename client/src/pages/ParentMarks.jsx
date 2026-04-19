import React, { useState, useEffect } from 'react';
import API from '../utils/api';

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
        <div className="p-3 md:p-6 space-y-4 max-w-7xl mx-auto w-full relative z-10 hidden-scrollbar pb-24">
            {/* Header section (replaces TopAppBar context) */}
            <div className="mb-4">
                <button 
                    onClick={() => {
                        if (selectedCategory) {
                            setSelectedCategory(null);
                            setSelectedTest(null);
                        } else {
                            window.history.back();
                        }
                    }}
                    className="flex md:hidden items-center text-indigo-600 font-bold text-xs mb-2 bg-indigo-50 px-3 py-1.5 w-fit rounded-full"
                >
                    <span className="material-symbols-outlined text-[14px] mr-1">arrow_back</span>
                    {selectedCategory ? 'Back to Categories' : 'Back'}
                </button>

                <h1 className="text-2xl md:text-3xl font-black text-indigo-900 tracking-tighter">
                    {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Academic Marks'}
                </h1>
                <p className="text-on-surface-variant font-medium mt-1 text-xs md:text-sm">
                    {childName}'s {selectedCategory ? 'Performance' : 'Report'}
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                </div>
            )}

            {!selectedCategory ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {categories.map((cat) => {
                        const count = tests.filter(t => t.testType === cat.id).length;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all duration-300 w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-100 active:scale-[0.98]"
                            >
                                <div className={`w-14 h-14 rounded-[1rem] ${cat.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
                                    <span className="material-symbols-outlined text-[28px]">{cat.icon}</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 tracking-tight">{cat.name}</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase mt-0.5 tracking-widest">
                                        {count} record{count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 ml-auto">chevron_right</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <button
                        onClick={() => { setSelectedCategory(null); setSelectedTest(null); }}
                        className="hidden md:flex items-center gap-2 text-indigo-600 font-bold text-sm hover:gap-3 transition-all"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Categories
                    </button>

                    {filteredTests.length === 0 ? (
                        <div className="py-16 text-center space-y-3 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm">
                            <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                            </div>
                            <p className="text-slate-400 font-medium text-xs">No records available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {filteredTests.map((test) => {
                                const score = getScore(test);
                                const isSelected = selectedTest?._id === test._id;
                                
                                const percentage = score && !score.isAbsent && test.totalMarks > 0
                                    ? ((score.value / test.totalMarks) * 100).toFixed(1)
                                    : null;
                                    
                                const scoreColor = (!score || score.isAbsent)
                                    ? 'text-rose-500'
                                    : percentage >= 75
                                    ? 'text-emerald-600'
                                    : percentage >= 50
                                    ? 'text-amber-500'
                                    : 'text-rose-500';

                                return (
                                    <div
                                        key={test._id}
                                        className={`rounded-[1.5rem] overflow-hidden transition-all duration-300 border ${
                                            isSelected
                                            ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-500/10'
                                            : 'bg-white border-slate-100 shadow-sm hover:border-indigo-100 cursor-pointer'
                                        }`}
                                    >
                                        <div 
                                            onClick={() => setSelectedTest(isSelected ? null : test)}
                                            className={`p-4 md:p-5 flex justify-between items-center ${isSelected ? 'bg-indigo-50/50' : 'active:bg-slate-50'}`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="material-symbols-outlined text-[14px] text-slate-400">calendar_today</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {test.testDate ? new Date(test.testDate).toLocaleDateString('en-IN') : 'N/A'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm md:text-base text-slate-800 leading-tight pr-2">{test.testName}</h4>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-1 select-none">
                                                <div className="px-2 py-1 bg-slate-50 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                    {score ? (score.isAbsent ? 'AB' : `${score.value}/${test.totalMarks}`) : `Max ${test.totalMarks}`}
                                                </div>
                                                <span className="material-symbols-outlined text-slate-300 text-[18px] transition-transform duration-300">
                                                    {isSelected ? 'expand_less' : 'expand_more'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Inline Accordion Content */}
                                        {isSelected && (
                                            <div className="p-4 md:p-5 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="bg-indigo-50 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Scored</p>
                                                        <p className={`text-2xl md:text-3xl font-black ${scoreColor}`}>
                                                            {!score ? '—' : score.isAbsent ? 'AB' : score.value}
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Limit</p>
                                                        <p className="text-2xl md:text-3xl font-black text-slate-700">{test.totalMarks}</p>
                                                    </div>
                                                </div>
                                                
                                                {percentage !== null && score && !score.isAbsent && (
                                                    <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                                percentage >= 75 ? 'bg-emerald-100 text-emerald-600' :
                                                                percentage >= 50 ? 'bg-amber-100 text-amber-600' :
                                                                'bg-rose-100 text-rose-600'
                                                            }`}>
                                                                <span className="material-symbols-outlined text-[16px]">
                                                                    {percentage >= 75 ? 'trending_up' : percentage >= 50 ? 'trending_flat' : 'trending_down'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Standing</p>
                                                                <p className={`text-xs font-bold ${
                                                                    percentage >= 75 ? 'text-emerald-700' :
                                                                    percentage >= 50 ? 'text-amber-700' :
                                                                    'text-rose-700'
                                                                }`}>
                                                                    {percentage >= 75 ? 'Good Standing' : percentage >= 50 ? 'Average' : 'Needs Improvement'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-xl font-black ${scoreColor}`}>{percentage}%</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ParentMarks;
