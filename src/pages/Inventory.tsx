import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Grid,
  Paper,
  CircularProgress,
  Typography,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { NavBar } from '../components/NavBar';
import { driveService } from '../services/driveService';
import { InventoryItem } from '../types';
import { ImageModal } from '../components/ImageModal'; // Import ImageModal
import { getImageBlobUrl, revokeImageUrl } from '../utils/driveImageUtils'; // Import utility function

interface DisplayItem extends InventoryItem {
  imageUrl?: string | null; // Use imageUrl and allow null for failed loads
}

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // State for modal open/close
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null); // State for image to display in modal

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const loadImageUrls = async () => {
      // Access token is now handled inside getImageBlobUrl utility
      const urls = await Promise.all(
        items.map(async item => {
          try {
            // Use the utility function
            const url = await getImageBlobUrl(item.id);
            return { ...item, imageUrl: url };
          } catch (e) {
            console.error(`Error loading ${item.name} (ID: ${item.id}):`, e);
            return { ...item, imageUrl: null }; // Set imageUrl to null on failure
          }
        })
      );
      setDisplayItems(urls);
    };

    if (items.length > 0) {
      loadImageUrls();
    } else {
       setDisplayItems([]); // Clear display items if items is empty
    }

    // Clean up blob URLs when items change or component unmounts
    return () => {
      displayItems.forEach(item => {
        revokeImageUrl(item.imageUrl); // Use utility cleanup
      });
    };
  }, [items]); // Depend on items state

  const loadItems = async () => {
    try {
      setLoading(true);
      const folderId = driveService.getInventoryFolderId();
      if (folderId) {
        const files = await driveService.listFiles(folderId);
        // driveService.listFiles already returns objects with id, name, webContentLink
        setItems(files as InventoryItem[]); // Cast to InventoryItem[] as listFiles returns compatible structure
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const folderId = driveService.getInventoryFolderId();
    if (!folderId) {
      console.error('Inventory folder not found');
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Assuming driveService.uploadFile handles authentication
        await driveService.uploadFile(file, folderId);
      }
      // Reload items after upload
      await loadItems();
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setUploading(false);
    }
  };

  // Selection logic remains largely the same, operating on displayItems but storing selected as InventoryItem
  const handleItemClick = (item: DisplayItem) => {
     // Find the corresponding InventoryItem from the original items list
     const originalItem = items.find(i => i.id === item.id);
     if (!originalItem) return; // Should not happen if logic is correct

    if (selectedItems.length > 0) {
      setSelectedItems(prev =>
        prev.some(selected => selected.id === originalItem.id) // Check by ID
          ? prev.filter(selected => selected.id !== originalItem.id) // Filter by ID
          : [...prev, originalItem] // Add original item
      );
    }
  };

  const handleLongPress = (item: DisplayItem) => {
      const originalItem = items.find(i => i.id === item.id);
      if (originalItem) {
         setSelectedItems([originalItem]);
      }
  };

  const handleDoubleClick = (item: DisplayItem) => {
      if (item.imageUrl) {
          setSelectedImageUrl(item.imageUrl);
          setModalOpen(true);
      }
  };

  const handleCloseModal = () => {
      setModalOpen(false);
      setSelectedImageUrl(null);
  };

  const handleDelete = async () => {
    try {
      for (const item of selectedItems) {
        await driveService.deleteFile(item.id);
      }
      setSelectedItems([]);
      // Reload items after deletion
      await loadItems();
    } catch (error) {
      console.error('Failed to delete items:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar
        title="Inventory"
        rightElement={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input">
              <IconButton
                component="span"
                color="inherit"
                disabled={uploading}
              >
                <AddIcon />
              </IconButton>
            </label>
            {selectedItems.length > 0 && (
              <IconButton
                color="error"
                onClick={handleDelete}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        }
      />

      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        {loading || displayItems.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {displayItems.map((item) => (
              <Grid item xs={6} sm={4} md={3} key={item.id}>
                <Card
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    border: selectedItems.some(selected => selected.id === item.id) ? 2 : 0,
                    borderColor: 'primary.main', // Use primary for selection border
                  }}
                  onClick={() => handleItemClick(item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(item);
                  }}
                  onDoubleClick={() => handleDoubleClick(item)} // Add double-click handler
                >
                  {item.imageUrl ? (
                    <CardMedia
                      component="img"
                      image={item.imageUrl}
                      alt={item.name}
                      sx={{
                        height: 200,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.disabledBackground' }}>
                      <Typography variant="caption" color="text.secondary">Image failed to load</Typography>
                    </Box>
                  )}
                  <CardContent sx={{ p: 1 }}>
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
                        bgcolor: 'primary.main', // Use primary for selection indicator
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

      {/* Image Modal */}
      <ImageModal
        imageUrl={selectedImageUrl}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </Box>
  );
}; 