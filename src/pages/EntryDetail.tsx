import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Grid, Typography, Dialog } from '@mui/material';
import { getImageBlobUrl } from '../utils/driveImageUtils';
import { driveService } from '../services/driveService';
import { Entry } from '../types';

export const EntryDetail: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntryAndImages = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get the entries folder ID
        const entriesFolderId = driveService.getEntriesFolderId();
        if (!entriesFolderId) {
          throw new Error('Entries folder not found');
        }

        // List files in the entries folder to find the entry JSON file
        const files = await driveService.listFiles(entriesFolderId);
        const entryFile = files.find(f => f.id === entryId);
        
        if (!entryFile) {
          throw new Error('Entry not found');
        }

        // Fetch the entry JSON file content using the file's ID
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${entryFile.id}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch entry data');
        }

        const entryData = await response.json();
        console.log('Fetched entry data:', entryData); // Debug log
        setEntry(entryData);

        // Fetch all images by their IDs using getImageBlobUrl
        const imageUrls = await Promise.all(
          entryData.imageIds.map(async (id: string) => {
            try {
              const url = await getImageBlobUrl(id);
              console.log('Fetched image URL for ID:', id, url); // Debug log
              return url;
            } catch (e) {
              console.error('Failed to fetch image:', e);
              return null;
            }
          })
        );
        const validUrls = imageUrls.filter((url): url is string => typeof url === 'string');
        console.log('Valid image URLs:', validUrls); // Debug log
        setImages(validUrls);
      } catch (e) {
        console.error('Error loading entry:', e);
        setError(e instanceof Error ? e.message : 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    };

    fetchEntryAndImages();
  }, [entryId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !entry) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="error">{error || 'Entry not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {entry.label}
      </Typography>
      {/* Commented out date display
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {new Date(entry.date).toLocaleDateString()}
      </Typography>
      */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {images.map((url, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
            <Box
              component="img"
              src={url}
              alt={`Entry image ${idx + 1}`}
              sx={{ 
                width: '100%', 
                height: 200, 
                objectFit: 'cover', 
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
              onDoubleClick={() => setSelectedImage(url)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Image Zoom Modal */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden',
          },
        }}
      >
        {selectedImage && (
          <Box
            component="img"
            src={selectedImage}
            alt="Full size"
            sx={{
              display: 'block',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              margin: 'auto',
              objectFit: 'contain',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedImage(null)}
          />
        )}
      </Dialog>
    </Box>
  );
}; 