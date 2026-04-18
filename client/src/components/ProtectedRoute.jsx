import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/auth" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to a default dashboard if role doesn't match
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default ProtectedRoute;
