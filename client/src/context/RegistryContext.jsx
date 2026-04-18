import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

const RegistryContext = createContext();

// ─── Normalized State ─────────────────────────────────────────────────────────
// years: { "1st Year": { members: [], faculties: [] }, "2nd Year": { ... } }
const initialState = {
    years: {},            // year name → { members: [], faculties: [] }
    loadedYears: {},      // year name → timestamp (cache control)
    loading: {},          // "fetch-1st Year", "add-members-1st Year", etc.
    errors: {},
};

const CACHE_TTL = 5 * 60 * 1000; // 5 min

function reducer(state, action) {
    switch (action.type) {
        case 'SET_YEAR_DATA': {
            const { year, data } = action.payload;
            return {
                ...state,
                years: {
                    ...state.years,
                    [year]: {
                        members:  data.members  || [],
                        faculties: data.faculties || [],
                    }
                },
                loadedYears: { ...state.loadedYears, [year]: Date.now() }
            };
        }
        case 'SET_LOADING':
            return { ...state, loading: { ...state.loading, [action.payload.id]: action.payload.value } };
        case 'SET_ERROR':
            return { ...state, errors: { ...state.errors, [action.payload.id]: action.payload.msg } };
        case 'CLEAR_ERROR':
            return { ...state, errors: { ...state.errors, [action.payload.id]: null } };
        case 'UPDATE_USER_IN_YEAR': {
            const { year, user } = action.payload;
            const yearData = state.years[year];
            if (!yearData) return state;
            return {
                ...state,
                years: {
                    ...state.years,
                    [year]: {
                        members: yearData.members.map(m => m._id === user._id ? { ...m, ...user } : m),
                        faculties: yearData.faculties.map(f => f._id === user._id ? { ...f, ...user } : f),
                    }
                }
            };
        }
        default:
            return state;
    }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const RegistryProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const isFresh = useCallback((year) => {
        const ts = state.loadedYears[year];
        return ts && (Date.now() - ts < CACHE_TTL);
    }, [state.loadedYears]);

    // Fetch one year
    const fetchYear = useCallback(async (year, force = false) => {
        if (!force && isFresh(year)) return;
        const id = `fetch-${year}`;
        dispatch({ type: 'SET_LOADING', payload: { id, value: true } });
        try {
            const { data } = await api.get(`/registry/${encodeURIComponent(year)}`);
            if (data.success) dispatch({ type: 'SET_YEAR_DATA', payload: { year, data: data.data } });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: { id, msg: err.response?.data?.message || err.message } });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { id, value: false } });
        }
    }, [isFresh]);

    // Add members to a year
    const addPeople = useCallback(async (year, type, people) => {
        const id = `add-${type}-${year}`;
        dispatch({ type: 'SET_LOADING', payload: { id, value: true } });
        dispatch({ type: 'CLEAR_ERROR', payload: { id } });
        try {
            const { data } = await api.post(`/registry/${encodeURIComponent(year)}/${type}`, { people });
            if (data.success) dispatch({ type: 'SET_YEAR_DATA', payload: { year, data: data.data } });
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            dispatch({ type: 'SET_ERROR', payload: { id, msg } });
            return { success: false, error: msg };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { id, value: false } });
        }
    }, []);

    // Remove a person from a year list
    const removePerson = useCallback(async (year, type, userId) => {
        const id = `remove-${type}-${userId}`;
        dispatch({ type: 'SET_LOADING', payload: { id, value: true } });
        try {
            const { data } = await api.delete(
                `/registry/${encodeURIComponent(year)}/${type}/${userId}`
            );
            if (data.success) dispatch({ type: 'SET_YEAR_DATA', payload: { year, data: data.data } });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: { id, msg: err.response?.data?.message || err.message } });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { id, value: false } });
        }
    }, []);

    // Edit user name/email
    const editUser = useCallback(async (year, userId, updates) => {
        const id = `edit-${userId}`;
        dispatch({ type: 'SET_LOADING', payload: { id, value: true } });
        try {
            const { data } = await api.put(`/registry/users/${userId}`, updates);
            if (data.success) {
                dispatch({ type: 'UPDATE_USER_IN_YEAR', payload: { year, user: data.user } });
                return { success: true };
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            dispatch({ type: 'SET_ERROR', payload: { id, msg } });
            return { success: false, error: msg };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { id, value: false } });
        }
    }, []);

    return (
        <RegistryContext.Provider value={{ state, fetchYear, addPeople, removePerson, editUser }}>
            {children}
        </RegistryContext.Provider>
    );
};

export const useRegistry = () => useContext(RegistryContext);
