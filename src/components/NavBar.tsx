import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Logout as LogoutIcon } from '@mui/icons-material';

interface NavBarProps {
  title: string;
  showBack?: boolean;
  backPath?: string;
  rightElement?: React.ReactNode;
  onLogout?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  title,
  showBack = true,
  backPath,
  rightElement,
  onLogout,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ width: 48 }}>
        {showBack && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Snaplog Logo"
            onClick={() => navigate('/home')}
            sx={{
              height: 40,
              width: 'auto',
              marginRight: 1,
              cursor: 'pointer',
            }}
          />

          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {rightElement}
          {onLogout && (
            <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 