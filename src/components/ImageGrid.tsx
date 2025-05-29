import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Checkbox,
  Box,
} from '@mui/material';
import { useLongPress } from '../hooks/useLongPress';
import { Item, Entry, InventoryItem } from '../types';

export interface ImageGridProps {
  images: Item[];
  selectedIds?: string[];
  onSelect?: (itemId: string) => void;
  onLongPress?: (item: Item) => void;
  onItemClick?: (item: Item) => void;
  showCheckboxes?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selectedIds = [],
  onSelect,
  onLongPress,
  onItemClick,
  showCheckboxes = false,
}) => {
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});
  const [errorImages, setErrorImages] = useState<{ [key: string]: boolean }>({});

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id: string) => {
    setErrorImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleClick = (item: Item) => {
    if (onSelect) {
      onSelect(item.id);
    } else if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleLongPress = (item: Item) => {
    if (onLongPress) {
      onLongPress(item);
    }
  };

  const longPressHandlers = useLongPress<Item>(
    handleLongPress,
    handleClick,
    { delay: 500 }
  );

  const getImageUrl = (item: Item): string => {
    // Type guard to check if item is InventoryItem or DriveFile
    const isInventoryItem = (item: Item): item is InventoryItem => {
      return 'webContentLink' in item && typeof item.webContentLink === 'string';
    };
    if (isInventoryItem(item)) {
      return item.webContentLink;
    }
    return '';
  };

  return (
    <Grid container spacing={2}>
      {images.map((item) => (
        <Grid item xs={6} sm={4} md={3} key={item.id}>
          <Card
            sx={{
              position: 'relative',
              cursor: 'pointer',
              bgcolor: selectedIds.includes(item.id) ? 'action.selected' : 'background.paper',
            }}
            {...longPressHandlers(item)}
          >
            {showCheckboxes && (
              <Checkbox
                checked={selectedIds.includes(item.id)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                }}
              />
            )}
            <CardMedia
              component="img"
              height="200"
              image={getImageUrl(item)}
              alt={('name' in item && typeof item.name === 'string') ? item.name : (('label' in item && typeof item.label === 'string') ? item.label : '')}
              onLoad={() => handleImageLoad(item.id)}
              onError={() => handleImageError(item.id)}
              sx={{
                objectFit: 'cover',
                opacity: loadedImages[item.id] ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
            {!loadedImages[item.id] && !errorImages[item.id] && (
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            )}
            {errorImages[item.id] && (
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'error.light',
                }}
              >
                <Typography variant="body2" color="error">
                  Failed to load
                </Typography>
              </Box>
            )}
            <CardContent>
              <Typography variant="body2" noWrap>
                {('name' in item && typeof item.name === 'string') ? item.name : (('label' in item && typeof item.label === 'string') ? item.label : '')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}; 