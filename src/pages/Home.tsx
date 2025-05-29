import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { NavBar } from '../components/NavBar';
import { driveService } from '../services/driveService';
import { useAuth } from '../hooks/useAuth';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeDrive();
  }, []);

  const initializeDrive = async () => {
    try {
      setLoading(true);
      await driveService.init();
    } catch (error) {
      console.error('Failed to initialize drive:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar
        title="Snaplog"
        showBack={false}
        onLogout={logout}
      />
      
      <Container sx={{ flex: 1, py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/add-entry')}
              fullWidth
            >
              Add New Entry
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<HistoryIcon />}
              onClick={() => navigate('/history')}
              fullWidth
            >
              View History
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<InventoryIcon />}
              onClick={() => navigate('/inventory')}
              fullWidth
            >
              Manage Inventory
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}; 