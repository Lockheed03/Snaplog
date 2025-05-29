import React, { createContext, useContext, useState, useEffect } from 'react';
import { gapi } from 'gapi-script';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  accessToken: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await gapi.load('client:auth2', async () => {
          await gapi.client.init({
            apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });

          const authInstance = gapi.auth2.getAuthInstance();
          authInstance.isSignedIn.listen(updateSigninStatus);
          updateSigninStatus(authInstance.isSignedIn.get());
        });
      } catch (error) {
        console.error('Error initializing GAPI:', error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const updateSigninStatus = (isSignedIn: boolean) => {
    setIsAuthenticated(isSignedIn);
    if (isSignedIn) {
      const authInstance = gapi.auth2.getAuthInstance();
      const currentUser = authInstance.currentUser.get();
      const authResponse = currentUser.getAuthResponse();
      setAccessToken(authResponse.access_token);
    } else {
      setAccessToken(null);
    }
    setIsLoading(false);
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
    } catch (error) {
      console.error('Error during login:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 