import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Typography,
  Box,
} from '@mui/material';
import { useLongPress } from '../hooks/useLongPress';
import { Entry } from '../types';

interface EntryListProps {
  entries: Entry[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onLongPress: (entry: Entry) => void;
  onEntryClick: (entry: Entry) => void;
  showCheckboxes?: boolean;
}

export const EntryList: React.FC<EntryListProps> = ({
  entries,
  selectedIds,
  onSelect,
  onLongPress,
  onEntryClick,
  showCheckboxes = false,
}) => {
  const handleLongPress = useLongPress(
    (entry: Entry) => onLongPress(entry),
    (entry: Entry) => onEntryClick(entry)
  );

  return (
    <List>
      {entries.map((entry) => (
        <ListItem
          key={entry.id}
          {...handleLongPress(entry)}
          sx={{
            cursor: 'pointer',
            bgcolor: selectedIds.includes(entry.id)
              ? 'action.selected'
              : 'background.paper',
            '&:hover': {
              bgcolor: selectedIds.includes(entry.id)
                ? 'action.selected'
                : 'action.hover',
            },
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">{entry.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.imageIds.length} items
                </Typography>
              </Box>
            }
            secondary={new Date(entry.date).toLocaleDateString()}
          />
          {showCheckboxes && (
            <Checkbox
              edge="end"
              checked={selectedIds.includes(entry.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </ListItem>
      ))}
    </List>
  );
}; 