import { gapi } from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

class AuthService {
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;

    try {
      await new Promise((resolve, reject) => {
        gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject,
        });
      });

      await gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      throw error;
    }
  }

  async login(): Promise<void> {
    try {
      await this.init();
      await gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await gapi.auth2.getAuthInstance().signOut();
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return gapi.auth2?.getAuthInstance()?.isSignedIn?.get() || false;
  }

  getAccessToken(): string | null {
    return gapi.auth2?.getAuthInstance()?.currentUser?.get()?.getAuthResponse()?.access_token || null;
  }

  onAuthStateChanged(callback: (isAuthenticated: boolean) => void): void {
    gapi.auth2?.getAuthInstance()?.isSignedIn?.listen(callback);
  }
}

export const authService = new AuthService(); 