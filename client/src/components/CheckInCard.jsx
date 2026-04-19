import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

const CheckInCard = () => {
    const { user } = useContext(AuthContext);
    const [status, setStatus] = useState({ isActive: false, session: null });
    const [loading, setLoading] = useState(true);
    const [showOtpScreen, setShowOtpScreen] = useState(false);
    const [otp, setOtp] = useState('');
    const [activeOtpCode, setActiveOtpCode] = useState(null);
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [timeLeft, setTimeLeft] = useState('00:00');
    const [errorMsg, setErrorMsg] = useState('');
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const { socket } = useContext(SocketContext);

    useEffect(() => {
        fetchStatus();
        fetchActiveOtp();

        const handleGlobalOtpAction = () => {
            setShowOtpScreen(true);
        };

        window.addEventListener('open-otp-entry', handleGlobalOtpAction);
        return () => window.removeEventListener('open-otp-entry', handleGlobalOtpAction);
    }, []);

    useEffect(() => {
        if (!socket) return;
        
        const handleOtpGenerated = (data) => {
            setActiveOtpCode(data.otpCode);
            setOtpExpiry(data.expiresAt);
        };

        const handleOtpRevoked = () => {
            setActiveOtpCode(null);
            setOtpExpiry(null);
        };

        socket.on('otpGenerated', handleOtpGenerated);
        socket.on('otpRevoked', handleOtpRevoked);

        return () => {
            socket.off('otpGenerated', handleOtpGenerated);
            socket.off('otpRevoked', handleOtpRevoked);
        };
    }, [socket]);

    useEffect(() => {
        let interval;
        if (activeOtpCode && otpExpiry) {
            const diff = new Date(otpExpiry) - new Date();
            if (diff > 0) {
                const m = Math.floor(diff / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setTimeLeft(`${m}:${s}`);
            }

            interval = setInterval(() => {
                const currentDiff = new Date(otpExpiry) - new Date();
                if (currentDiff <= 0) {
                    setActiveOtpCode(null);
                    setOtpExpiry(null);
                    setTimeLeft('00:00');
                } else {
                    const m = Math.floor(currentDiff / 60000).toString().padStart(2, '0');
                    const s = Math.floor((currentDiff % 60000) / 1000).toString().padStart(2, '0');
                    setTimeLeft(`${m}:${s}`);
                }
            }, 1000);
        } else {
            setTimeLeft('00:00');
        }
        return () => clearInterval(interval);
    }, [activeOtpCode, otpExpiry]);


    const fetchStatus = async () => {
        try {
            const { data } = await api.get('/attendance/status');
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch status');
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveOtp = async () => {
        try {
            const { data } = await api.get('/attendance/active-otp');
            if (data) {
                setActiveOtpCode(data.otpCode);
                setOtpExpiry(data.expiresAt);
            }
        } catch (err) {
            console.error('Failed to fetch active OTP');
        }
    };

    const handleKeypadPress = (val) => {
        if (errorMsg) setErrorMsg('');
        if (otp.length < 6) setOtp(prev => prev + val);
    };

    const handleDeletePress = () => {
        setOtp(prev => prev.slice(0, -1));
    };

    const handleCheckIn = async () => {
        if (otp.length !== 6) return;
        
        setErrorMsg('');

        if (!navigator.geolocation) {
            setErrorMsg('Geolocation is not supported by your browser.');
            setOtp('');
            return;
        }

        setIsCheckingIn(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                try {
                    const { data } = await api.post('/attendance/check-in', { 
                        subject: 'Hostel Attendance',
                        otp,
                        lat,
                        lng
                    });
                    setStatus({ isActive: true, session: data });
                    setShowOtpScreen(false);
                    setOtp('');
                } catch (err) {
                    setErrorMsg(err.response?.data?.message || 'Check-in failed');
                    setOtp('');
                } finally {
                    setIsCheckingIn(false);
                }
            },
            (error) => {
                console.error(error);
                setErrorMsg('Please allow location access to mark attendance.');
                setOtp('');
                setIsCheckingIn(false);
            },
            { enableHighAccuracy: true }
        );
    };


    if (loading && !status.session) return <div className="animate-pulse bg-white/50 h-48 rounded-[2rem]"></div>;

    return (
        <>
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[2rem] p-6 relative overflow-hidden shadow-sm transition-all duration-500 w-full ${status.isActive ? 'bg-indigo-900 text-white shadow-xl shadow-indigo-900/20' : 'bg-white text-on-surface border border-slate-100 shadow-indigo-900/5'}`}
            >
                <div className="relative z-10 flex flex-col justify-between items-center sm:flex-row sm:items-center gap-6">
                    <div className="flex-1 text-center sm:text-left">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase block mx-auto sm:mx-0 w-fit ${status.isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
                            {status.isActive ? 'Completed' : 'Off Duty'}
                        </span>
                        <h3 className="text-xl md:text-2xl font-black tracking-tight mt-3">
                            {status.isActive ? 'Attendance Marked' : 'Ready to Start?'}
                        </h3>
                        <p className={`text-sm mt-1 font-medium ${status.isActive ? 'text-indigo-200' : 'text-on-surface-variant'}`}>
                            {status.isActive ? `Subject: ${status.session.subject}` : 'Mark your presence for today.'}
                        </p>
                    </div>

                    {status.isActive ? (
                        <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/10 cursor-default select-none">
                                <span className="material-symbols-outlined">check_circle</span>
                                Verified Today
                            </div>
                        </div>
                    ) : (
                        <div className="w-full sm:w-auto">
                            {activeOtpCode && (
                                <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Active Session Ends In <span className="font-mono text-indigo-600 bg-indigo-100 px-1 rounded">{timeLeft}</span>
                                    </p>
                                    <p className="text-2xl font-black text-indigo-700 tracking-widest">{activeOtpCode}</p>
                                </div>
                            )}
                            <button 
                                onClick={() => setShowOtpScreen(true)}
                                className="w-full px-8 py-4 bg-[#1e1b4b] text-white font-bold rounded-2xl shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">qr_code_scanner</span>
                                <span>Proceed to Check-In</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Background elements */}
                <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full blur-3xl transition-colors duration-1000 ${status.isActive ? 'bg-emerald-500/20' : 'bg-indigo-500/5'}`}></div>
            </motion.div>

            {/* OTP Full Screen Modal */}
            <AnimatePresence>
                {showOtpScreen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 z-[100] flex flex-col bg-slate-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-[#1e1b4b] text-white p-4 flex items-center shadow-md pb-6 relative">
                            <button onClick={() => setShowOtpScreen(false)} className="p-2 absolute left-2 hover:bg-white/10 rounded-full transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h2 className="flex-1 text-center font-bold text-lg tracking-wide">OTP Entry</h2>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col items-center pt-8 px-6 pb-6 bg-[#fcfcfc] rounded-t-[2rem] -mt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                            <h3 className="text-xl font-bold text-slate-800 text-center">Enter Verification Code</h3>
                            
                            {errorMsg ? (
                                <p className="text-red-500 font-bold text-sm mt-2 text-center max-w-[240px] px-2 py-1 bg-red-50 rounded-lg border border-red-100">{errorMsg}</p>
                            ) : (
                                <p className="text-slate-500 text-sm mt-2 text-center max-w-[240px]">We've sent a 6-digit code to verify your identity</p>
                            )}
                            
                            {activeOtpCode && (
                                <div className="mt-4 bg-[#1e1b4b]/10 border border-[#1e1b4b]/20 px-4 py-1.5 rounded-full flex flex-col items-center justify-center">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e1b4b] animate-pulse"></span>
                                        <span className="text-xs font-bold text-[#1e1b4b]">Code: {activeOtpCode}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Ends in: <span className="font-mono">{timeLeft}</span></span>
                                </div>
                            )}
                            
                            {/* OTP Display Boxes */}
                            <div className="flex gap-2 justify-center mt-8 mb-6">
                                {[...Array(6)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-[45px] h-[55px] rounded-xl flex items-center justify-center text-2xl font-bold mx-0.5 border-2 transition-all ${otp.length === i ? 'border-[#1e1b4b] bg-white ring-4 ring-[#1e1b4b]/10' : otp[i] ? 'border-transparent bg-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-300'}`}
                                    >
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: otp[i] ? 1 : 0 }} className="text-slate-800">
                                            {otp[i] || ''}
                                        </motion.span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Counter */}
                            <div className="flex flex-col items-center mt-2">
                                <p className="text-xs text-slate-400 font-medium">{otp.length}/6 digits entered</p>
                                <div className="w-24 h-1 bg-slate-200 mt-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#1e1b4b] transition-all" style={{ width: `${(otp.length / 6) * 100}%` }}></div>
                                </div>
                            </div>

                            <div className="flex-1"></div>

                            {/* Custom Keypad */}
                            <div className="w-full max-w-[320px] mx-auto mt-6">
                                <div className="grid grid-cols-3 gap-6 gap-y-8 place-items-center mb-8">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => handleKeypadPress(num.toString())}
                                            className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-50 flex items-center justify-center text-2xl font-semibold text-slate-800 active:bg-slate-100 transition-colors"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    
                                    <button 
                                        onClick={handleDeletePress}
                                        className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-50 flex items-center justify-center active:bg-slate-100 transition-colors text-slate-600"
                                    >
                                        <span className="material-symbols-outlined text-3xl">backspace</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleKeypadPress('0')}
                                        className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-50 flex items-center justify-center text-2xl font-semibold text-slate-800 active:bg-slate-100 transition-colors"
                                    >
                                        0
                                    </button>

                                    <button 
                                        onClick={handleCheckIn}
                                        disabled={otp.length !== 6 || isCheckingIn}
                                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${otp.length === 6 && !isCheckingIn ? 'bg-[#1e1b4b] text-white hover:bg-[#1e1b4b]/90' : 'bg-slate-200 text-slate-400'}`}
                                    >
                                        {isCheckingIn ? (
                                            <span className="material-symbols-outlined animate-spin">refresh</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-3xl">arrow_forward</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CheckInCard;
