import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateMixtapePage from './pages/CreateMixtapePage';
import MixtapeDetailPage from './pages/MixtapeDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingSpinner from './components/UI/LoadingSpinner';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication status
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        <Route 
          path="create" 
          element={user ? <CreateMixtapePage /> : <Navigate to="/login" />} 
        />
        <Route path="mixtapes/:id" element={<MixtapeDetailPage />} />
        <Route 
          path="profile" 
          element={user ? <ProfilePage /> : <Navigate to="/login" />} 
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;