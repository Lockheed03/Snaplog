import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { driveService } from '../services/driveService';

export const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [showSyncMessage, setShowSyncMessage] = useState(false);

  useEffect(() => {
    const handleOnlineStatus = () => {
      const wasOffline = !isOnline;
      setIsOnline(navigator.onLine);
      if (wasOffline && navigator.onLine) {
        setShowSyncMessage(true);
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [isOnline]);

  useEffect(() => {
    const checkSyncStatus = () => {
      const syncTime = driveService.getLastSyncTime();
      if (syncTime !== lastSyncTime) {
        setLastSyncTime(syncTime);
        if (syncTime > 0) {
          setShowSyncMessage(true);
        }
      }
    };

    const interval = setInterval(checkSyncStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  const formatLastSyncTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <>
      {!isOnline && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="warning" variant="filled">
            You are offline. Changes will be synced when you're back online.
          </Alert>
        </Snackbar>
      )}

      {showSyncMessage && lastSyncTime && (
        <Snackbar
          open={true}
          autoHideDuration={3000}
          onClose={() => setShowSyncMessage(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" variant="filled">
            Last synced at {formatLastSyncTime(lastSyncTime)}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}; 