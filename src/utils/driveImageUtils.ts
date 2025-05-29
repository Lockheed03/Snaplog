import { gapi } from 'gapi-script';

// Function to fetch image Blob URL using fetch with auth header
export const getImageBlobUrl = async (fileId: string): Promise<string> => {
  // Ensure gapi is loaded and auth is available before getting token
  if (!gapi.auth || !gapi.auth.getToken) {
     console.error('gapi auth not initialized.');
     throw new Error('Google API authentication not initialized.');
  }

  const accessToken = gapi.auth.getToken().access_token; // Get access token
  if (!accessToken) {
      console.error('Access token not available.');
      throw new Error('Google Drive access token not available.');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

// Add a cleanup function for Blob URLs (optional, but good practice)
export const revokeImageUrl = (imageUrl: string | null | undefined) => {
  if (imageUrl) {
    URL.revokeObjectURL(imageUrl);
  }
}; 