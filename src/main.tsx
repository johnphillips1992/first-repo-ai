import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { PlaylistProvider } from './contexts/PlaylistContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlaylistProvider>
          <App />
        </PlaylistProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);