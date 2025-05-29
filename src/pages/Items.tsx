import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Button, Typography, CircularProgress } from '@mui/material';
import { driveService } from '../services/driveService';
import { ImageGrid } from '../components/ImageGrid';
import { NavBar } from '../components/NavBar';
import { InventoryItem } from '../types';
import { generateEntryLabel, createEntryMetadata } from '../utils/driveUtils';

const Items: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const inventoryFolderId = driveService.getInventoryFolderId();
      if (!inventoryFolderId) {
        throw new Error('Inventory folder not found');
      }

      const files = await driveService.listFiles(inventoryFolderId);
      setItems(files as InventoryItem[]);
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Failed to load items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (itemId: string) => {
    setSelectedIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one item');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const selectedDate = sessionStorage.getItem('selectedDate');
      if (!selectedDate) {
        throw new Error('No date selected');
      }

      const date = new Date(selectedDate);
      const label = generateEntryLabel(date, selectedIds.length);
      const entriesFolderId = driveService.getEntriesFolderId();

      if (!entriesFolderId) {
        throw new Error('Entries folder not found');
      }

      // Create entry metadata
      const entry = createEntryMetadata(date, selectedIds);

      // Create a JSON file with the metadata
      const metadataBlob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], `${label}.json`, { type: 'application/json' });

      // Upload the metadata file to the Entries folder
      await driveService.uploadFile(metadataFile, entriesFolderId, `${label}.json`);

      navigate('/history');
    } catch (error) {
      console.error('Error saving entry:', error);
      setError('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar title="Select Items" showBack backPath="/add-entry" />
      <Container sx={{ flex: 1, py: 2 }}>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography>No items found</Typography>
        ) : (
          <>
            <ImageGrid
              images={items}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              showCheckboxes
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/add-entry')}
                fullWidth
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving || selectedIds.length === 0}
                fullWidth
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Items; 