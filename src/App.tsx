import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateMixtapePage from './pages/CreateMixtapePage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import './App.css';

const App: React.FC = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/create" 
            element={
              <ProtectedRoute>
                <CreateMixtapePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;