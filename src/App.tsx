import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box, ThemeProvider, CssBaseline } from '@mui/material';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { AddEntry } from './pages/AddEntry';
import { History } from './pages/History';
import { Inventory } from './pages/Inventory';
import { EntryDetail } from './pages/EntryDetail';
import { authService } from './services/authService';
import { theme } from './theme';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setAuthenticated(isAuth);
      setLoading(false);
    };

    checkAuth();
    authService.onAuthStateChanged(checkAuth);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return authenticated ? <>{children}</> : <Navigate to="/login" />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-entry"
            element={
              <PrivateRoute>
                <AddEntry />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <History />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <Inventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/entry/:entryId"
            element={
              <PrivateRoute>
                <EntryDetail />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}; 