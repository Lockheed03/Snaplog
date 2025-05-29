import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Delete as DeleteIcon, Sort as SortIcon } from '@mui/icons-material';
import { NavBar } from '../components/NavBar';
import { driveService } from '../services/driveService';
import { cacheService } from '../services/cacheService';
import { Entry } from '../types';

export const ViewHistory: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const entries = await cacheService.getAllEntries();
      setEntries(entries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setEntries(prev => [...prev].sort((a, b) => {
      return order === 'asc' 
        ? a.label.localeCompare(b.label)
        : b.label.localeCompare(a.label);
    }));
  };

  const handleLongPress = (entryId: string) => {
    setSelectedEntries(prev => [...prev, entryId]);
  };

  const handleSelect = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleDeleteSelected = async () => {
    try {
      for (const entryId of selectedEntries) {
        await driveService.deleteFile(entryId);
        await cacheService.clearCache(); // Clear cache to force refresh
      }
      setSelectedEntries([]);
      await loadEntries();
    } catch (error) {
      console.error('Failed to delete entries:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await driveService.deleteFile(entryId);
      await cacheService.clearCache(); // Clear cache to force refresh
      await loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    return sortOrder === 'asc'
      ? a.label.localeCompare(b.label)
      : b.label.localeCompare(a.label);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar
        title="Entry History"
        rightElement={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort</InputLabel>
              <Select
                value={sortOrder}
                label="Sort"
                onChange={(e) => handleSort(e.target.value as 'asc' | 'desc')}
                startAdornment={<SortIcon sx={{ mr: 1 }} />}
              >
                <MenuItem value="asc">A to Z</MenuItem>
                <MenuItem value="desc">Z to A</MenuItem>
              </Select>
            </FormControl>
            
            {selectedEntries.length > 0 && (
              <IconButton color="error" onClick={handleDeleteSelected}>
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        }
      />

      <Container sx={{ flex: 1, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortOrder}
              label="Sort"
              onChange={(e) => handleSort(e.target.value as 'asc' | 'desc')}
              startAdornment={<SortIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="asc">A to Z</MenuItem>
              <MenuItem value="desc">Z to A</MenuItem>
            </Select>
          </FormControl>
          
          {selectedEntries.length > 0 && (
            <IconButton color="error" onClick={handleDeleteSelected}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
        <List>
          {sortedEntries.map((entry) => (
            <ListItem
              key={entry.id}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                  {selectedEntries.includes(entry.id) && (
                    <Checkbox
                      edge="end"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={() => handleSelect(entry.id)}
                    />
                  )}
                  <IconButton 
                    onClick={() => handleDeleteEntry(entry.id)}
                    sx={{
                      bgcolor: 'red',
                      color: 'white',
                      ml: 1,
                      '&:hover': { bgcolor: 'darkred' },
                      padding: '6px', // Ensure padding is applied
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              // Prevent navigating on clicking the delete icon
              onClick={(event) => {
                // Check if the click target is the delete icon or its children
                const target = event.target as HTMLElement;
                const isDeleteIconClick = target.closest('button');
                
                if (!isDeleteIconClick) {
                  navigate(`/entry/${entry.id}`);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress(entry.id);
              }}
              sx={{ 
                pr: 12, // Keep right padding to make space for the icon
              }}
            >
              <ListItemText
                primary={entry.label}
                secondary={new Date(entry.date).toLocaleDateString()}
                sx={{ 
                  wordBreak: 'break-word',
                  minWidth: 0, // Allow text to shrink
                  flex: 1, // Allow text to take up available space
                }}
              />
            </ListItem>
          ))}
        </List>
      </Container>
    </Box>
  );
}; 