import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const token = localStorage.getItem('token');
    
    // If there is no token in the vault, kick them back to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If they have a token, render the page they requested
    return children;
}