import { Entry, DriveFile } from '../types';

export const generateEntryLabel = (date: Date, imageCount: number): string => {
  const dateStr = date.toISOString().split('T')[0];
  return `Entry_${dateStr}_${imageCount}images`;
};

export const getDriveViewUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/view`;
};

export const createEntryMetadata = (date: Date, imageIds: string[]): Entry => {
  return {
    id: generateEntryLabel(date, imageIds.length),
    date: date.toISOString(),
    imageIds,
    label: generateEntryLabel(date, imageIds.length),
  };
};

export const parseEntryFromJson = (json: string): Entry => {
  try {
    const data = JSON.parse(json);
    return {
      id: data.id,
      date: data.date,
      imageIds: data.imageIds,
      label: data.label,
    };
  } catch (error) {
    console.error('Error parsing entry JSON:', error);
    throw new Error('Invalid entry metadata format');
  }
};

export const getImageUrls = (files: DriveFile[]): string[] => {
  return files.map(file => file.webContentLink);
}; 