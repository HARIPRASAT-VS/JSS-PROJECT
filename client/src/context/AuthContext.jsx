import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Sync live profile from DB ──────────────────────────────────────────────
    // Called once on mount AND can be called manually after a profile update.
    const syncProfile = useCallback(async (baseUser) => {
        const target = baseUser || user;
        if (!target?.token) return;

        try {
            // api interceptor automatically attaches the Bearer token
            const { data } = await api.get('/auth/me');

            // Merge fresh DB fields into the stored user (keep token etc.)
            const refreshed = { ...target, ...data };
            setUser(refreshed);
            localStorage.setItem('user', JSON.stringify(refreshed));
        } catch (err) {
            // If token is expired/invalid, log out
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
            }
            // Otherwise silently keep the existing local data
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // On app start: hydrate from localStorage then immediately verify + refresh from DB
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);          // show immediately (no flash)
            syncProfile(parsed);      // then refresh from DB in background
        }
        setLoading(false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = (userData) => {
        if (!userData) return;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.email) {
            localStorage.setItem('rememberedEmail', userData.email);
        }
        // Immediately sync fresh DB data after login too
        syncProfile(userData);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, syncProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
