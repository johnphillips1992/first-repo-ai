import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // If we're still checking the auth state, render nothing
  if (loading) {
    return <div>Loading...</div>;
  }

  // If the user is not logged in, redirect to the login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Otherwise, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;