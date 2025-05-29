export interface Entry {
  id: string;
  date: string;
  imageIds: string[];
  label: string;
}

export interface InventoryItem extends DriveFile {
  // Additional inventory-specific fields if needed
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webContentLink: string;
}

export interface FolderIds {
  rootFolderId: string;
  inventoryFolderId: string;
  entriesFolderId: string;
}

export interface DriveService {
  init(): Promise<void>;
  listFiles(folderId: string): Promise<DriveFile[]>;
  uploadFile(file: File, parentId: string, entryName?: string): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
  getInventoryFolderId(): string | null;
  getEntriesFolderId(): string | null;
  getLastSyncTime(): number;
}

export interface CacheService {
  cacheFolderIds(folderIds: FolderIds): Promise<void>;
  getFolderIds(): Promise<FolderIds | null>;
  cacheEntry(entry: Entry): Promise<void>;
  getAllEntries(): Promise<Entry[]>;
  cacheInventoryItem(item: InventoryItem): Promise<void>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  clearCache(): Promise<void>;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface ImageGridProps {
  images: Item[];
  selectedIds?: string[];
  onSelect?: (itemId: string) => void;
  onLongPress?: (item: Item) => void;
  onItemClick?: (item: Item) => void;
  showCheckboxes?: boolean;
}

export type Item = Entry | InventoryItem;

export interface UploadProgress {
  onProgress: (progress: number) => void;
  onComplete: (fileId: string) => void;
  onError: (error: Error) => void;
}

export interface DriveResponse<T> {
  result: T;
  status: number;
  statusText: string;
}

export interface DriveFileList {
  files: DriveFile[];
} 