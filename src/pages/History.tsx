import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Checkbox,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  SelectAll as SelectAllIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { driveService } from '../services/driveService';
import { Item, Entry } from '../types';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const folderId = driveService.getEntriesFolderId();
      if (folderId) {
        const files = await driveService.listFiles(folderId);
        const entries = files.map(file => ({
          id: file.id,
          date: file.name.split('_')[0],
          imageIds: [],
          label: file.name.replace('.json', ''),
        }));
        setEntries(entries);
      }
    } catch (error) {
      setError('Failed to load entries');
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLongPress = (item: Item) => {
    if ('date' in item) {  // Type guard for Entry
      setSelectedIds(prev => [...prev, item.id]);
      setMultiSelectMode(true);
    }
  };

  const handleEntryClick = (item: Item) => {
    if ('date' in item) {  // Type guard for Entry
      if (multiSelectMode) {
        setSelectedIds(prev =>
          prev.includes(item.id)
            ? prev.filter(id => id !== item.id)
            : [...prev, item.id]
        );
      } else {
        navigate(`/entry/${item.id}`);
      }
    }
  };

  const verifyDeletion = async (entryId: string, retries = 3): Promise<boolean> => {
    const folderId = driveService.getEntriesFolderId();
    if (!folderId) return false;

    for (let i = 0; i < retries; i++) {
      const files = await driveService.listFiles(folderId);
      const entryStillExists = files.some(file => file.id === entryId);
      
      if (!entryStillExists) {
        return true;
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  };

  const handleDeleteEntry = async (entryId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation when clicking delete
    try {
      await driveService.deleteFile(entryId);
      const isDeleted = await verifyDeletion(entryId);
      if (isDeleted) {
        await loadEntries();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const verifyMultipleDeletions = async (entryIds: string[], retries = 3): Promise<boolean> => {
    const folderId = driveService.getEntriesFolderId();
    if (!folderId) return false;

    for (let i = 0; i < retries; i++) {
      const files = await driveService.listFiles(folderId);
      const remainingIds = entryIds.filter(id => 
        files.some(file => file.id === id)
      );
      
      if (remainingIds.length === 0) {
        return true;
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedIds.map(id => driveService.deleteFile(id)));
      const allDeleted = await verifyMultipleDeletions(selectedIds);
      if (allDeleted) {
        setSelectedIds([]);
        setMultiSelectMode(false);
        await loadEntries();
      }
    } catch (error) {
      console.error('Error deleting entries:', error);
    }
  };

  const toggleMultiSelect = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedIds([]);
  };

  const handleSortChange = (
    event: React.MouseEvent<HTMLElement>,
    newSortOrder: 'asc' | 'desc' | null
  ) => {
    if (newSortOrder !== null) {
      setSortOrder(newSortOrder);
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            History
          </Typography>
          {multiSelectMode ? (
            <>
              <IconButton color="inherit" onClick={handleDeleteSelected}>
                <DeleteIcon />
              </IconButton>
              <IconButton color="inherit" onClick={toggleMultiSelect}>
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <>
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={handleSortChange}
                size="small"
                sx={{ mr: 1 }}
              >
                <ToggleButton value="asc">
                  <SortIcon sx={{ transform: 'rotate(180deg)' }} />
                </ToggleButton>
                <ToggleButton value="desc">
                  <SortIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <IconButton color="inherit" onClick={toggleMultiSelect}>
                <SelectAllIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : (
          <Paper elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <List>
              {sortedEntries.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {multiSelectMode && (
                          <Checkbox
                            edge="end"
                            checked={selectedIds.includes(entry.id)}
                            onChange={() => handleEntryClick(entry)}
                          />
                        )}
                        <IconButton
                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                          sx={{
                            bgcolor: 'red',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'darkred',
                            },
                            padding: '8px',
                          }}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemButton
                      onClick={() => handleEntryClick(entry)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleLongPress(entry);
                      }}
                      sx={{
                        py: 2,
                        pr: 8, // Add right padding to make space for the delete button
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" noWrap>
                            {entry.label}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < sortedEntries.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Box>
  );
}; 