import { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize Google API client
        await new Promise((resolve, reject) => {
          gapi.load('client:auth2', {
            callback: resolve,
            onerror: reject,
          });
        });

        await gapi.client.init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
          clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          scope: 'https://www.googleapis.com/auth/drive.file',
        });

        // Listen for auth state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

        // Initialize cache service
        await cacheService.init();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const updateSigninStatus = (isSignedIn: boolean) => {
    setIsAuthenticated(isSignedIn);
  };

  const login = async () => {
    try {
      await gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const logout = async () => {
    try {
      await gapi.auth2.getAuthInstance().signOut();
      await cacheService.clearCache();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}; 