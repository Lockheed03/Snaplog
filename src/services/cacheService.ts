import { FolderIds, Entry, InventoryItem } from '../types';

const DB_NAME = 'snaplog_cache';
const DB_VERSION = 1;

const STORES = {
  FOLDERS: 'folders',
  ENTRIES: 'entries',
  INVENTORY: 'inventory',
  THUMBNAILS: 'thumbnails',
};

class CacheServiceImpl {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
          db.createObjectStore(STORES.FOLDERS);
        }
        if (!db.objectStoreNames.contains(STORES.ENTRIES)) {
          db.createObjectStore(STORES.ENTRIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
          db.createObjectStore(STORES.INVENTORY, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.THUMBNAILS)) {
          db.createObjectStore(STORES.THUMBNAILS, { keyPath: 'id' });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async cacheFolderIds(ids: FolderIds): Promise<void> {
    const store = await this.getStore(STORES.FOLDERS, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(ids, 'folderIds');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFolderIds(): Promise<FolderIds | null> {
    const store = await this.getStore(STORES.FOLDERS);
    return new Promise((resolve, reject) => {
      const request = store.get('folderIds');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheEntry(entry: Entry): Promise<void> {
    const store = await this.getStore(STORES.ENTRIES, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEntry(id: string): Promise<Entry | null> {
    const store = await this.getStore(STORES.ENTRIES);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEntries(): Promise<Entry[]> {
    const store = await this.getStore(STORES.ENTRIES);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheInventoryItem(item: InventoryItem): Promise<void> {
    const store = await this.getStore(STORES.INVENTORY, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    const store = await this.getStore(STORES.INVENTORY);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheThumbnail(fileId: string, thumbnail: Blob): Promise<void> {
    const store = await this.getStore(STORES.THUMBNAILS, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ id: fileId, data: thumbnail });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getThumbnail(fileId: string): Promise<Blob | null> {
    const store = await this.getStore(STORES.THUMBNAILS);
    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const storeNames = Object.values(STORES);
    const clearPromises = storeNames.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(clearPromises);
  }
}

export const cacheService = new CacheServiceImpl(); 