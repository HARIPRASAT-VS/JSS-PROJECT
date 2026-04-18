import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

const FacultyContext = createContext();

const initialState = {
    years: {}, // { "1st Year": [id1, id2] }
    teams: {}, // { id: { ... } }
    loadingActions: {}, // { "action-id": true }
    errors: {}, // { "action-id": "message" }
    snapshots: {}, // { entityId: previousData }
    lastFetched: {}, // { year: timestamp }
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function facultyReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return {
                ...state,
                loadingActions: { ...state.loadingActions, [action.payload.id]: action.payload.loading }
            };
        case 'SET_ERROR':
            return {
                ...state,
                errors: { ...state.errors, [action.payload.id]: action.payload.error },
                loadingActions: { ...state.loadingActions, [action.payload.id]: false }
            };
        case 'SET_TEAMS_FOR_YEAR': {
            const { year, teams } = action.payload;
            const newTeams = { ...state.teams };
            const teamIds = [];
            
            teams.forEach(team => {
                newTeams[team._id] = team;
                teamIds.push(team._id);
            });

            return {
                ...state,
                years: { ...state.years, [year]: teamIds },
                teams: newTeams,
                lastFetched: { ...state.lastFetched, [year]: Date.now() }
            };
        }
        case 'OPTIMISTIC_CREATE': {
            const { team } = action.payload;
            return {
                ...state,
                teams: { ...state.teams, [team.id]: team },
                years: { 
                    ...state.years, 
                    [team.year]: [team.id, ...(state.years[team.year] || [])] 
                }
            };
        }
        case 'OPTIMISTIC_UPDATE': {
            const { team } = action.payload;
            return {
                ...state,
                snapshots: { ...state.snapshots, [team._id]: state.teams[team._id] },
                teams: { ...state.teams, [team._id]: { ...state.teams[team._id], ...team } }
            };
        }
        case 'REPLACE_TEAM_ID': {
            const { tempId, realTeam } = action.payload;
            const newTeams = { ...state.teams };
            delete newTeams[tempId];
            newTeams[realTeam._id] = realTeam;

            const yearIds = (state.years[realTeam.year] || []).map(id => id === tempId ? realTeam._id : id);

            return {
                ...state,
                teams: newTeams,
                years: { ...state.years, [realTeam.year]: yearIds }
            };
        }
        case 'ROLLBACK_ENTITY': {
            const { id } = action.payload;
            const previous = state.snapshots[id];
            if (!previous) return state;

            const newSnapshots = { ...state.snapshots };
            delete newSnapshots[id];

            return {
                ...state,
                teams: { ...state.teams, [id]: previous },
                snapshots: newSnapshots
            };
        }
        case 'SOFT_DELETE_TEAM': {
            const { id, year } = action.payload;
            return {
                ...state,
                years: { ...state.years, [year]: state.years[year].filter(tid => tid !== id) },
                // We keep it in state.teams but remove from the visible year list
            };
        }
        case 'HYDRATE_STORE':
            return { ...state, ...action.payload };
        default:
            return state;
    }
}

export const FacultyProvider = ({ children }) => {
    const [state, dispatch] = useReducer(facultyReducer, initialState);

    // Hybrid Cache: Load from localStorage on init
    useEffect(() => {
        const saved = localStorage.getItem('FACULTY_MGMT_STORE');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Basic TTL validation could go here
                dispatch({ type: 'HYDRATE_STORE', payload: parsed });
            } catch (e) {
                console.error('Failed to parse cache', e);
            }
        }
    }, []);

    // Persist to localStorage
    useEffect(() => {
        const { snapshots, loadingActions, errors, ...persistable } = state;
        localStorage.setItem('FACULTY_MGMT_STORE', JSON.stringify(persistable));
    }, [state]);

    const fetchTeamsByYear = useCallback(async (year, force = false) => {
        const isFresh = state.lastFetched[year] && (Date.now() - state.lastFetched[year] < CACHE_TTL);
        if (isFresh && !force) return;

        const actionId = `fetch-${year}`;
        dispatch({ type: 'SET_LOADING', payload: { id: actionId, loading: true } });

        try {
            const { data } = await api.get(`/admin/groups?year=${year}`);
            if (data.success) {
                dispatch({ type: 'SET_TEAMS_FOR_YEAR', payload: { year, teams: data.data } });
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: { id: actionId, error: error.message } });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { id: actionId, loading: false } });
        }
    }, [state.lastFetched]);

    const createTeam = async (teamData) => {
        const tempId = uuidv4();
        const actionId = 'create-team';
        
        const optimisticTeam = {
            id: tempId,
            ...teamData,
            students: teamData.members.map(m => ({ ...m, _id: uuidv4() })), 
            status: 'saving'
        };

        dispatch({ type: 'OPTIMISTIC_CREATE', payload: { team: optimisticTeam } });
        dispatch({ type: 'SET_LOADING', payload: { id: actionId, loading: true } });

        try {
            const { data } = await api.post('/admin/groups', teamData);
            console.log('Sync Result:', data); // Debugging
            if (data.success) {
                dispatch({ type: 'REPLACE_TEAM_ID', payload: { tempId, realTeam: data.data } });
                return { success: true };
            }
            return { success: false, error: data.message || 'Verification failed' };
        } catch (error) {
            console.error('Sync Error:', error);
            dispatch({ type: 'SET_ERROR', payload: { id: actionId, error: error.message } });
            // For creation, we just remove the optimistic temp team
            dispatch({ type: 'SOFT_DELETE_TEAM', payload: { id: tempId, year: teamData.year } });
            return { success: false, error: error.response?.data?.message || error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { id: actionId, loading: false } });
        }
    };

    const updateTeam = async (id, teamData) => {
        const actionId = `update-${id}`;
        const lastUpdatedAt = state.teams[id].updatedAt;

        dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { team: { _id: id, ...teamData, status: 'saving' } } });
        dispatch({ type: 'SET_LOADING', payload: { id: actionId, loading: true } });

        try {
            const { data } = await api.put(`/admin/groups/${id}`, { ...teamData, lastUpdatedAt });
            if (data.success) {
                dispatch({ type: 'SET_TEAMS_FOR_YEAR', payload: { year: teamData.year, teams: [data.data] } });
                return { success: true };
            }
            return { success: false, error: data.message || 'Update failed' };
        } catch (error) {
            if (error.response?.status === 409) {
                // Conflict!
                return { success: false, conflict: true, serverData: error.response.data.serverData };
            }
            dispatch({ type: 'SET_ERROR', payload: { id: actionId, error: error.message } });
            dispatch({ type: 'ROLLBACK_ENTITY', payload: { id } });
            return { success: false, error: error.response?.data?.message || error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { id: actionId, loading: false } });
        }
    };

    const deleteTeam = async (id, year) => {
        const actionId = `delete-${id}`;
        dispatch({ type: 'SET_LOADING', payload: { id: actionId, loading: true } });

        try {
            const { data } = await api.delete(`/admin/groups/${id}`);
            if (data.success) {
                dispatch({ type: 'SOFT_DELETE_TEAM', payload: { id, year } });
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: { id: actionId, error: error.message } });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { id: actionId, loading: false } });
        }
    };

    return (
        <FacultyContext.Provider value={{ 
            state, 
            dispatch, 
            fetchTeamsByYear, 
            createTeam, 
            updateTeam, 
            deleteTeam 
        }}>
            {children}
        </FacultyContext.Provider>
    );
};

export const useFaculty = () => useContext(FacultyContext);

// Selectors
export const getTeamsByYear = (state, year) => {
    const ids = state.years[year] || [];
    return ids.map(id => state.teams[id]).filter(Boolean);
};
