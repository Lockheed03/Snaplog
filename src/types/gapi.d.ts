/// <reference types="gapi" />
/// <reference types="gapi.auth2" />
/// <reference types="gapi.client.drive-v3" />

// Export all necessary types
export interface UploadProgress {
  onProgress?: (progress: number) => void;
  onComplete?: (fileId: string) => void;
  onError?: (error: Error) => void;
}

export interface DriveResponse<T> {
  result: T;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webContentLink?: string;
}

export interface DriveFileList {
  files: DriveFile[];
}

declare namespace gapi {
  function load(api: string, callback: () => void): void;
  function load(api: string, version: string, callback: () => void): void;

  namespace auth2 {
    interface AuthInstance {
      signIn(): Promise<GoogleUser>;
      signOut(): Promise<void>;
      isSignedIn: {
        get(): boolean;
        listen(listener: (isSignedIn: boolean) => void): void;
      };
      currentUser: {
        get(): GoogleUser;
        listen(listener: (user: GoogleUser) => void): void;
      };
    }

    interface GoogleUser {
      getId(): string;
      getAuthResponse(): {
        access_token: string;
        id_token: string;
        expires_in: number;
        token_type: string;
      };
      getBasicProfile(): {
        getName(): string;
        getEmail(): string;
        getImageUrl(): string;
      };
    }

    function getAuthInstance(): AuthInstance;
  }

  namespace client {
    interface InitParams {
      apiKey?: string;
      clientId?: string;
      discoveryDocs?: string[];
      scope?: string;
    }

    function init(params: InitParams): Promise<void>;
    function load(api: string, version: string): Promise<void>;
  }

  // Define DriveClient as a separate interface
  export interface DriveClient {
    init(params: client.InitParams): Promise<void>;
    load(api: string, version: string): Promise<void>;
    drive: {
      files: {
        list(params: {
          q?: string;
          fields?: string;
          pageSize?: number;
          pageToken?: string;
        }): Promise<DriveResponse<DriveFileList>>;
        create(params: {
          resource: {
            name: string;
            mimeType: string;
            parents?: string[];
          };
          fields?: string;
        }): Promise<DriveResponse<DriveFile>>;
        delete(params: { fileId: string }): Promise<void>;
        get(params: { fileId: string; fields?: string }): Promise<DriveResponse<DriveFile>>;
      };
    };
  }
}

// Extend the gapi-script module
declare module 'gapi-script' {
  interface GapiClient {
    init(params: gapi.client.InitParams): Promise<void>;
    load(api: string, version: string): Promise<void>;
    drive?: gapi.client.drive.Drive;
  }

  interface Gapi {
    load(api: string, callback: () => void): void;
    auth2: {
      getAuthInstance(): gapi.auth2.AuthInstance;
    };
    client: GapiClient;
  }

  const gapi: Gapi;
  export { gapi };
}

// Add type guard for Drive API
declare function hasDriveApi(client: typeof gapi.client): client is typeof gapi.client & { drive: gapi.client.Drive }; 