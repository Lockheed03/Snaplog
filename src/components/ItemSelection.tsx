import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Skeleton,
  Card,
  CardMedia,
  CardContent,
  Dialog,
} from '@mui/material';
import { NavBar } from './NavBar';
import { driveService } from '../services/driveService';
import { InventoryItem } from '../types';
import { getImageBlobUrl, revokeImageUrl } from '../utils/driveImageUtils';
import { useNavigate } from 'react-router-dom';
import LoadingButton from '@mui/lab/LoadingButton';
import Snackbar from '@mui/material/Snackbar';

interface ItemSelectionProps {
  onBack: () => void;
  onSubmit: (selectedItems: InventoryItem[]) => void;
}

export const ItemSelection: React.FC<ItemSelectionProps> = ({
  onBack,
  onSubmit,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<{ [id: string]: string }>({});
  const [loadingImages, setLoadingImages] = useState<{ [id: string]: boolean }>({});
  const [modalImage, setModalImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    // Clean up blob URLs on unmount
    return () => {
      Object.values(imageUrls).forEach(url => revokeImageUrl(url));
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [imageUrls]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const folderId = driveService.getInventoryFolderId();
      if (folderId) {
        const files = await driveService.listFiles(folderId);
        console.log('Fetched files in ItemSelection:', files);
        files.forEach((file, index) => {
          console.log(`File ${index + 1}: name=${file.name}, mimeType=${file.mimeType}, webContentLink=${file.webContentLink}`);
        });
        // Only keep items with a valid webContentLink
        const validItems = files.filter(f => f.webContentLink && f.webContentLink.length > 0);
        setItems(validItems);
        // Fetch blob URLs for each image using fileId
        const urlMap: { [id: string]: string } = {};
        const loadingMap: { [id: string]: boolean } = {};
        await Promise.all(
          validItems.map(async (file) => {
            loadingMap[file.id] = true;
            try {
              const blobUrl = await getImageBlobUrl(file.id);
              urlMap[file.id] = blobUrl;
            } catch (e) {
              console.error('Failed to fetch blob for', file.name, e);
            } finally {
              loadingMap[file.id] = false;
            }
          })
        );
        setImageUrls(urlMap);
        setLoadingImages(loadingMap);
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleImageDoubleClick = (imageUrl: string) => {
    setModalImage(imageUrl);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSubmit(selectedItems);
      setSaveSuccess(true);
      setSnackbarOpen(true);
      saveTimeout.current = setTimeout(() => {
        setSnackbarOpen(false);
        navigate('/');
      }, 1500);
    } catch (error) {
      // Optionally handle error state
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar
        title="Select Items"
        rightElement={
          <LoadingButton
            color="inherit"
            onClick={handleSave}
            loading={saving}
            disabled={selectedItems.length === 0 || saving}
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            {saveSuccess ? 'Saved' : 'Save'}
          </LoadingButton>
        }
      />

      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid item xs={6} sm={4} md={3} key={item.id}>
                <Card
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    bgcolor: selectedItems.some(selected => selected.id === item.id) ? 'action.selected' : 'background.paper',
                  }}
                  onClick={() => handleItemClick(item)}
                >
                  {loadingImages[item.id] || !imageUrls[item.id] ? (
                    <Skeleton variant="rectangular" width="100%" height={200} />
                  ) : (
                    <CardMedia
                      component="img"
                      height="200"
                      image={imageUrls[item.id]}
                      alt={item.name}
                      sx={{
                        objectFit: 'cover',
                      }}
                      onDoubleClick={() => handleImageDoubleClick(imageUrls[item.id])}
                    />
                  )}
                  <CardContent>
                    <Typography variant="body2" noWrap>
                      {item.name}
                    </Typography>
                  </CardContent>
                  {selectedItems.some(selected => selected.id === item.id) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selectedItems.findIndex(selected => selected.id === item.id) + 1}
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Modal for full-size image preview on double click */}
      <Dialog
        open={!!modalImage}
        onClose={() => setModalImage(null)}
        maxWidth="lg"
        fullWidth
      >
        {modalImage && (
          <Box
            component="img"
            src={modalImage}
            alt="Full size"
            sx={{
              display: 'block',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              margin: 'auto',
              objectFit: 'contain',
              background: '#000',
            }}
          />
        )}
      </Dialog>

      {/* Snackbar for save confirmation */}
      <Snackbar
        open={snackbarOpen}
        message="Entry saved"
        autoHideDuration={1500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}; 