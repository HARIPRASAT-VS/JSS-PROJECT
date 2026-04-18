import React, { useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgot, setIsForgot] = useState(false);
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', otp: '', newPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberedEmail, setRememberedEmail] = useState('');

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const email = localStorage.getItem('rememberedEmail');
        if (email) {
            setRememberedEmail(email);
            setFormData(prev => ({ ...prev, email }));
        }
    }, [isLogin]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const { data } = await api.post('/auth/login', { email: formData.email, password: formData.password });
                login(data);
                navigate('/dashboard');
            } else {
                const { data } = await api.post('/auth/signup', { firstName: formData.firstName, lastName: formData.lastName, email: formData.email, password: formData.password });
                login(data);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (response) => {
        setError('');
        try {
            const { data } = await api.post('/auth/google', { tokenId: response.credential });
            login(data);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.details || err.response?.data?.message || 'Google Login Failed';
            setError(`Error: ${msg}`);
            console.error('Google Sign-In Detail:', err.response?.data);
        }
    };

    const handleGoogleError = () => {
        setError('Google Login Failed. Check your browser console (F12) for origin/domain errors.');
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (step === 1) {
                await api.post('/auth/forgot-password', { email: formData.email });
                setStep(2);
            } else if (step === 2) {
                await api.post('/auth/verify-otp', { email: formData.email, otp: formData.otp });
                setStep(3);
            } else {
                if (formData.newPassword !== formData.confirmPassword) return setError('Passwords do not match');
                await api.post('/auth/reset-password', { email: formData.email, otp: formData.otp, newPassword: formData.newPassword });
                setIsForgot(false);
                setIsLogin(true);
                setStep(1);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Process failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-mesh min-h-screen flex items-center justify-center p-4">
            {/* Background Decorations for 'atmost care' */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"></div>
            </div>

            <main className="w-full max-w-md relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="glass-card p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-white/40">
                        {/* Header/Logo section moved inside the card for standalone look */}
                        <div className="flex flex-col items-center mb-10 space-y-4">
                            <div className="p-4 rounded-3xl bg-primary shadow-xl shadow-primary/20">
                                <span className="material-symbols-outlined text-white text-4xl fill-1">school</span>
                            </div>
                            <div className="text-center">
                                <h1 className="text-3xl font-black text-on-surface tracking-tight">Academic Curator</h1>
                                <p className="text-on-surface-variant font-medium text-sm mt-1">Smart Attendance Management</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={isForgot ? 'forgot' : isLogin ? 'login' : 'signup'}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isForgot ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2 text-center">
                                            <h2 className="text-2xl font-black text-on-surface tracking-tight">Password Recovery</h2>
                                            <p className="text-on-surface-variant text-sm font-medium">
                                                {step === 1 ? 'Enter your email to receive OTP' : step === 2 ? 'Enter the 6-digit OTP sent' : 'Set your new secure password'}
                                            </p>
                                        </div>
                                        <form onSubmit={handleForgotSubmit} className="space-y-4">
                                            {step === 1 && (
                                                <div className="relative group">
                                                    <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-wider">Email Address</label>
                                                    <div className="flex items-center bg-surface-container-low rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                                        <span className="material-symbols-outlined ml-4 text-outline text-xl">mail</span>
                                                        <input name="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent border-none py-4 px-3 text-on-surface font-medium focus:outline-none" placeholder="alex@university.edu" required />
                                                    </div>
                                                </div>
                                            )}
                                            {step === 2 && (
                                                <div className="relative group">
                                                    <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-wider">One-Time Password</label>
                                                    <div className="flex items-center bg-surface-container-low rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                                        <span className="material-symbols-outlined ml-4 text-outline text-xl">lock_open</span>
                                                        <input name="otp" value={formData.otp} onChange={handleChange} maxLength="6" className="w-full bg-transparent border-none py-4 px-3 text-on-surface font-bold tracking-[0.5em] text-center" placeholder="000000" required />
                                                    </div>
                                                </div>
                                            )}
                                            {step === 3 && (
                                                <div className="space-y-4">
                                                    <div className="relative group">
                                                        <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-wider">New Password</label>
                                                        <div className="flex items-center bg-surface-container-low rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                                            <span className="material-symbols-outlined ml-4 text-outline text-xl">lock_reset</span>
                                                            <input name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} className="w-full bg-transparent border-none py-4 px-3 text-on-surface font-medium focus:outline-none" required />
                                                        </div>
                                                    </div>
                                                    <div className="relative group">
                                                        <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-wider">Confirm Password</label>
                                                        <div className="flex items-center bg-surface-container-low rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                                            <span className="material-symbols-outlined ml-4 text-outline text-xl">verified</span>
                                                            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-transparent border-none py-4 px-3 text-on-surface font-medium focus:outline-none" required />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {error && <p className="text-error text-[11px] font-bold ml-1">{error}</p>}
                                            <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all">
                                                {loading ? 'Processing...' : step === 3 ? 'Update Password' : step === 2 ? 'Verify OTP' : 'Send OTP'}
                                            </button>
                                            <button type="button" onClick={() => { setIsForgot(false); setStep(1); }} className="w-full font-bold text-primary text-sm hover:underline py-2">Back to Login</button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-2 text-center">
                                            <h2 className="text-2xl font-black text-on-surface tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                                            <p className="text-on-surface-variant text-sm font-medium">{isLogin ? 'Enter credentials to access portal' : 'Join our academic community'}</p>
                                        </div>
                                        
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            {!isLogin && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="relative group">
                                                        <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-wider">First Name</label>
                                                        <div className="flex items-center bg-surface-container-low rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                                            <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-transparent border-none py-4 px-4 text-on-surface font-medium focus:outline-none" placeholder="Alex" required />
                                                        </div>
                                                    </div>
                                                    <div className="relative group">
                                                        <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-wider">Last Name</label>
                                                        <div className="flex items-center bg-surface-container-low rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                                            <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-transparent border-none py-4 px-4 text-on-surface font-medium focus:outline-none" placeholder="Rivers" required />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="relative group">
                                                <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-wider">Email Address</label>
                                                <div className="flex items-center bg-surface-container-low rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                                    <span className="material-symbols-outlined ml-4 text-outline text-xl">mail</span>
                                                    <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent border-none py-4 px-3 text-on-surface font-medium focus:outline-none" placeholder="stu2023001@university.edu" required />
                                                </div>
                                                {isLogin && rememberedEmail && formData.email === rememberedEmail && (
                                                    <span className="text-[10px] text-primary font-bold ml-1 mt-1 block uppercase tracking-tighter italic">Last used account</span>
                                                )}
                                            </div>

                                            <div className="relative group">
                                                <div className="flex justify-between items-center mb-2 ml-1">
                                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Password</label>
                                                    {isLogin && (
                                                        <button type="button" onClick={() => setIsForgot(true)} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide">Forgot?</button>
                                                    )}
                                                </div>
                                                <div className="flex items-center bg-surface-container-low rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                                    <span className="material-symbols-outlined ml-4 text-outline text-xl">lock</span>
                                                    <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full bg-transparent border-none py-4 px-3 text-on-surface font-medium focus:outline-none" placeholder="••••••••" required />
                                                </div>
                                            </div>

                                            {error && <p className="text-error text-[11px] font-bold ml-1">{error}</p>}

                                            <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
                                                <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Join Now'}</span>
                                                {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                                            </button>
                                        </form>

                                        <div className="relative py-2">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20"></div></div>
                                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]"><span className="bg-[#f8f9fa] px-4 text-outline">Continue with</span></div>
                                        </div>

                                        <div className="flex justify-center scale-95 origin-center">
                                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} useOneTap />
                                        </div>

                                        <footer className="pt-6 flex flex-col items-center space-y-4">
                                            <p className="text-on-surface-variant text-sm font-medium">
                                                {isLogin ? "New to Curator?" : "Already a member?"} 
                                                <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold ml-2 hover:underline">
                                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                                </button>
                                            </p>
                                        </footer>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default AuthPage;
