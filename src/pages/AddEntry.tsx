import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { NavBar } from '../components/NavBar';
import { driveService } from '../services/driveService';
import { cacheService } from '../services/cacheService';
import { InventoryItem } from '../types';
import { ItemSelection } from '../components/ItemSelection';

export const AddEntry: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  });
  const [step, setStep] = useState<'date' | 'items'>('date');

  const handleDateSubmit = () => {
    // Convert DD/MM/YY to YYYY-MM-DD for storage
    const [day, month, year] = date.split('/');
    const fullYear = '20' + year; // Assuming 20xx for the year
    const isoDate = `${fullYear}-${month}-${day}`;
    sessionStorage.setItem('selectedDate', isoDate);
    setStep('items');
  };

  const handleItemsSubmit = async (selectedItems: InventoryItem[]) => {
    try {
      const selectedDate = sessionStorage.getItem('selectedDate');
      if (!selectedDate) {
        throw new Error('No date selected');
      }

      const date = new Date(selectedDate);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];
      const entryName = `${day}_${month}_${selectedItems.length}_${dayOfWeek}`;

      const entriesFolderId = driveService.getEntriesFolderId();
      if (!entriesFolderId) {
        throw new Error('Entries folder not found');
      }

      const entry = {
        id: entryName,
        date: selectedDate,
        imageIds: selectedItems.map(item => item.id),
        label: entryName,
      };

      const metadataBlob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], `${entryName}.json`, { type: 'application/json' });

      await driveService.uploadFile(metadataFile, entriesFolderId, `${entryName}.json`);
      await cacheService.cacheEntry(entry);

      navigate('/history');
    } catch (error) {
      console.error('Failed to create entry:', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and forward slashes
    if (/^[0-9/]*$/.test(value)) {
      // Format the date as user types
      let formatted = value.replace(/\D/g, '');
      if (formatted.length > 0) {
        if (formatted.length > 2) {
          formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
        }
        if (formatted.length > 5) {
          formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 7);
        }
      }
      setDate(formatted);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar title="Add Entry" />
      
      <Container sx={{ flex: 1, py: 4 }}>
        {step === 'date' ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Date
            </Typography>
            <TextField
              type="text"
              value={date}
              onChange={handleDateChange}
              placeholder="DD/MM/YY"
              fullWidth
              sx={{ mb: 3 }}
              inputProps={{
                maxLength: 8,
                pattern: '\\d{2}/\\d{2}/\\d{2}'
              }}
            />
            <Button
              variant="contained"
              onClick={handleDateSubmit}
              fullWidth
              disabled={!date.match(/^\d{2}\/\d{2}\/\d{2}$/)}
            >
              Select Images
            </Button>
          </Paper>
        ) : (
          <ItemSelection
            onBack={() => setStep('date')}
            onSubmit={handleItemsSubmit}
          />
        )}
      </Container>
    </Box>
  );
}; 