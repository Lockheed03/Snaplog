import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { authService } from '../services/authService';
import { driveService } from '../services/driveService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (authService.isAuthenticated()) {
      try {
        setLoading(true);
        await driveService.init();
        navigate('/home');
      } catch (error) {
        console.error('Failed to initialize drive:', error);
        setLoading(false);
      }
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await authService.login();
      await driveService.init();
      navigate('/home');
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Container sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Snaplog
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Welcome to Snaplog!
          </Typography>
          <Button
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            fullWidth
            sx={{ height: 48 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign in with Google'
            )}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}; 