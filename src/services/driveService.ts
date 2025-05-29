/// <reference types="gapi.auth2" />
/// <reference path="../types/gapi.d.ts" />

import { gapi } from 'gapi-script';
import {
  DriveService,
  Entry,
  InventoryItem,
  FolderIds,
  DriveFile
} from '../types/index';
import { cacheService } from './cacheService';

// Define types locally since they're specific to this service
interface UploadProgress {
  onProgress?: (progress: number) => void;
  onComplete?: (fileId: string) => void;
  onError?: (error: Error) => void;
}

interface DriveResponse<T> {
  result: T;
}

// Extend Entry type to include webContentLink for cache (optional)
interface EntryWithWebContentLink extends Entry {
  webContentLink?: string;
  // name?: string; // Removed, not part of Entry
}

class DriveServiceImpl implements DriveService {
  private rootFolderId: string | null = null;
  private inventoryFolderId: string | null = null;
  private entriesFolderId: string | null = null;
  private isOnline: boolean = navigator.onLine;
  private lastSyncTime: number = 0;
  private isInitialized: boolean = false;
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor() {
    window.addEventListener('online', () => this.handleOnlineStatus(true));
    window.addEventListener('offline', () => this.handleOnlineStatus(false));
  }

  async init(): Promise<void> {
    await this.ensureInitialized();
  }

  private handleOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.syncWithDrive();
    }
  }

  private async ensureDriveLoaded(): Promise<void> {
    if (!gapi.client.drive) {
      await gapi.client.load('drive', 'v3');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await new Promise<void>((resolve, reject) => {
        gapi.load('client:auth2', async () => {
          try {
            await gapi.client.init({
              apiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
              clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
              discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
              ],
              scope: 'https://www.googleapis.com/auth/drive.file',
            });

            await this.ensureDriveLoaded();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      // First try to get folder IDs from cache
      const cachedFolderIds = await cacheService.getFolderIds();
      if (cachedFolderIds) {
        this.rootFolderId = (cachedFolderIds as any).rootFolderId || (cachedFolderIds as any).snaplogFolderId;
        this.inventoryFolderId = cachedFolderIds.inventoryFolderId;
        this.entriesFolderId = cachedFolderIds.entriesFolderId;
      }

      // If we don't have all folder IDs, ensure they exist
      if (!this.rootFolderId || !this.inventoryFolderId || !this.entriesFolderId) {
        await this.ensureFoldersExist();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing drive service:', error);
      throw error;
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<DriveResponse<T>>,
    errorMessage: string
  ): Promise<DriveResponse<T>> {
    try {
      await this.ensureDriveLoaded();
      const response = await operation();
      if (!response || !response.result) {
        throw new Error('Invalid response from Drive API');
      }
      return response;
    } catch (error) {
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.retryOperation(operation, errorMessage);
      }
      this.retryCount = 0;
      throw new Error(`${errorMessage}: ${error}`);
    }
  }

  private async syncWithDrive() {
    try {
      await this.ensureInitialized();

      if (this.entriesFolderId) {
        const files = await this.listFiles(this.entriesFolderId);
        const cachedEntries = await cacheService.getAllEntries();
        // Compare by id only, since Entry does not have 'name'
        const changedEntries = files.filter(file => {
          const cached = cachedEntries.find(e => e.id === file.id);
          // Optionally compare by label or other property if needed
          return !cached;
        });
        await Promise.all(
          changedEntries.map(file => {
            // Only cache id, date, imageIds, label, webContentLink (if needed)
            const entry: EntryWithWebContentLink = {
              id: file.id,
              date: '', // You may want to parse from file.name if needed
              imageIds: [], // You may want to parse from file.name or content
              label: file.name, // Use file.name as label for now
              webContentLink: file.webContentLink,
            };
            return cacheService.cacheEntry(entry);
          })
        );
      }

      if (this.inventoryFolderId) {
        const files = await this.listFiles(this.inventoryFolderId);
        const cachedItems = await cacheService.getAllInventoryItems();
        const changedItems = files.filter(file => {
          const cached = cachedItems.find(i => i.id === file.id);
          return !cached;
        });
        await Promise.all(
          changedItems.map(file => {
            const item: InventoryItem = {
              id: file.id,
              name: file.name,
              mimeType: file.mimeType || '',
              webContentLink: file.webContentLink || ''
            };
            return cacheService.cacheInventoryItem(item);
          })
        );
      }

      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('Error syncing with Drive:', error);
    }
  }

  private parseDateFromName(name: string): string {
    const [day, month] = name.split('_');
    const year = new Date().getFullYear();
    return new Date(year, parseInt(month) - 1, parseInt(day)).toISOString();
  }

  private parseItemCountFromName(name: string): number {
    const parts = name.split('_');
    return parseInt(parts[2]) || 0;
  }

  private async ensureFoldersExist(): Promise<void> {
    try {
      // 1. First check if we already have the Snaplog folder ID
      if (!this.rootFolderId) {
        // Search for existing Snaplog folder at root
        const response = await this.retryOperation<gapi.client.drive.FileList>(
          () =>
            gapi.client.drive.files.list({
              q: "name='Snaplog' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents",
              fields: 'files(id, name)',
            }),
          'Failed to check Snaplog folder'
        );

        if (response.result.files && response.result.files.length > 0) {
          this.rootFolderId = response.result.files[0].id || null;
        } else {
          // Create Snaplog folder only if it doesn't exist
          const snaplogFolder = await this.retryOperation<gapi.client.drive.File>(
            () =>
              gapi.client.drive.files.create({
                resource: {
                  name: 'Snaplog',
                  mimeType: 'application/vnd.google-apps.folder',
                  parents: ['root'],
                },
                fields: 'id',
              }),
            'Failed to create Snaplog folder'
          );
          this.rootFolderId = snaplogFolder.result.id || null;
        }
      }

      // 2. If we have Snaplog folder ID but missing subfolder IDs, search for them
      if (this.rootFolderId && (!this.inventoryFolderId || !this.entriesFolderId)) {
        const subfoldersResponse = await this.retryOperation<gapi.client.drive.FileList>(
          () =>
            gapi.client.drive.files.list({
              q: `'${this.rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
              fields: 'files(id, name)',
            }),
          'Failed to check Snaplog subfolders'
        );

        if (subfoldersResponse.result.files) {
          for (const file of subfoldersResponse.result.files) {
            if (file.name === 'Inventory') this.inventoryFolderId = file.id || null;
            if (file.name === 'Entries') this.entriesFolderId = file.id || null;
          }
        }

        // Create missing subfolders if needed
        if (!this.inventoryFolderId) {
          this.inventoryFolderId = await this.createFolder('Inventory', this.rootFolderId);
        }
        if (!this.entriesFolderId) {
          this.entriesFolderId = await this.createFolder('Entries', this.rootFolderId);
        }
      }

      // 3. Cache the folder IDs if we have all of them
      if (this.rootFolderId && this.inventoryFolderId && this.entriesFolderId) {
        const folderIds: FolderIds = {
          rootFolderId: this.rootFolderId,
          inventoryFolderId: this.inventoryFolderId,
          entriesFolderId: this.entriesFolderId,
        };
        await cacheService.cacheFolderIds(folderIds);
      }
    } catch (error) {
      console.error('Error ensuring folders exist:', error);
      throw error;
    }
  }

  async listFiles(folderId: string): Promise<DriveFile[]> {
    try {
      await this.ensureInitialized();

      if (!this.isOnline) {
        if (folderId === this.entriesFolderId) {
          const entries = await cacheService.getAllEntries();
          // Return as DriveFile[] with required properties
          return entries.map(entry => ({
            id: entry.id,
            name: entry.label, // Use label as name
            mimeType: 'application/json', // Entries are JSON files
            webContentLink: (entry as EntryWithWebContentLink).webContentLink || '',
          }));
        } else if (folderId === this.inventoryFolderId) {
          const items = await cacheService.getAllInventoryItems();
          return items.map(item => ({
            id: item.id,
            name: item.name,
            mimeType: item.mimeType || '',
            webContentLink: item.webContentLink,
          }));
        }
        return [];
      }

      const response = await this.retryOperation<gapi.client.drive.FileList>(
        () =>
          gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, webContentLink)',
          }),
        'Failed to list files'
      );

      if (!response.result.files) {
        return [];
      }

      return response.result.files.map(file => ({
        id: file.id || '',
        name: file.name || '',
        mimeType: file.mimeType || '',
        webContentLink: file.webContentLink || '',
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async createFolder(name: string, parentId?: string | null): Promise<string> {
    try {
      await this.ensureInitialized();

      const response = await this.retryOperation<gapi.client.drive.File>(
        () =>
          gapi.client.drive.files.create({
            resource: {
              name,
              mimeType: 'application/vnd.google-apps.folder',
              parents: parentId ? [parentId] : undefined,
            },
            fields: 'id',
          }),
        'Failed to create folder'
      );

      return response.result.id || '';
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async uploadFile(
    file: File,
    parentId: string,
    entryName?: string,
    progress?: UploadProgress
  ): Promise<string> {
    try {
      await this.ensureInitialized();

      if (!parentId) {
        throw new Error('Parent folder ID is required');
      }

      const metadata = {
        name: entryName || file.name,
        mimeType: file.type,
        parents: [parentId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
      xhr.setRequestHeader('Authorization', `Bearer ${gapi.auth.getToken().access_token}`);

      return new Promise((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && progress?.onProgress) {
            const percentComplete = (event.loaded / event.total) * 100;
            progress.onProgress(percentComplete);
          }
        };

        xhr.onload = async () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (progress?.onComplete) {
              progress.onComplete(response.id);
            }
            resolve(response.id);
          } else {
            const error = new Error(`Upload failed: ${xhr.statusText}`);
            if (progress?.onError) {
              progress.onError(error);
            }
            reject(error);
          }
        };

        xhr.onerror = () => {
          const error = new Error('Network error during upload');
          if (progress?.onError) {
            progress.onError(error);
          }
          reject(error);
        };

        xhr.send(form);
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  private async generateThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not generate thumbnail'));
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => reject(new Error('Could not load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.ensureInitialized();

      await this.retryOperation(
        () =>
          gapi.client.drive.files.delete({
            fileId,
          }),
        'Failed to delete file'
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  getInventoryFolderId(): string | null {
    return this.inventoryFolderId;
  }

  getEntriesFolderId(): string | null {
    return this.entriesFolderId;
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }
}

export const driveService = new DriveServiceImpl();
 