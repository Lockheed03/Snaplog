import { useState, useEffect, useCallback } from 'react';
import { gapi } from 'gapi-script';
import { AuthContextType } from '../types';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

export const useGoogleAuth = (): AuthContextType => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initClient = async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: SCOPES.join(' '),
        });

        // Listen for sign-in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => {
          setIsAuthenticated(isSignedIn);
          if (isSignedIn) {
            setAccessToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
          } else {
            setAccessToken(null);
          }
        });

        // Set initial state
        setIsAuthenticated(gapi.auth2.getAuthInstance().isSignedIn.get());
        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
          setAccessToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
        }
      } catch (error) {
        console.error('Error initializing Google API client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    gapi.load('client:auth2', initClient);
  }, []);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      await gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await gapi.auth2.getAuthInstance().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAuthenticated,
    accessToken,
    isLoading,
    login,
    logout,
  };
}; 