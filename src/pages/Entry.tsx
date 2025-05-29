import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { driveService } from '../services/driveService';
import { cacheService } from '../services/cacheService';
import { ImageGrid } from '../components/ImageGrid';
import { NavBar } from '../components/NavBar';
import { InventoryItem, Item } from '../types';

export const Entry: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entryName, setEntryName] = useState('');

  useEffect(() => {
    if (id) {
      loadEntry(id);
    }
  }, [id]);

  const loadEntry = async (entryId: string) => {
    try {
      setIsLoading(true);
      const files = await driveService.listFiles(entryId);
      setItems(files);
      setEntryName(files[0]?.name.split('_')[0] || '');
    } catch (error) {
      console.error('Error loading entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !id) return;

    try {
      await Promise.all(
        Array.from(files).map(file =>
          driveService.uploadFile(file, id, entryName)
        )
      );

      await loadEntry(id);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleLongPress = (item: Item) => {
    if ('webContentLink' in item && typeof item.webContentLink === 'string') {
      setSelectedIds(prev => [...prev, item.id]);
    }
  };

  const handleSelect = (itemId: string) => {
    setSelectedIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => driveService.deleteFile(id)));
      setSelectedIds([]);
      if (id) {
        await loadEntry(id);
      }
    } catch (error) {
      console.error('Error deleting items:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar
        title={entryName || 'Entry'}
        showBack
        backPath="/history"
        rightElement={
          selectedIds.length > 0 && (
            <Typography
              onClick={handleDelete}
              sx={{ cursor: 'pointer', color: 'error.main' }}
            >
              Delete ({selectedIds.length})
            </Typography>
          )
        }
      />
      <Container sx={{ flex: 1, py: 2 }}>
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : items.length === 0 ? (
          <Typography>No items found</Typography>
        ) : (
          <ImageGrid
            images={items}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onLongPress={handleLongPress}
            showCheckboxes={selectedIds.length > 0}
          />
        )}
      </Container>
      <input
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        id="file-input"
      />
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}; 