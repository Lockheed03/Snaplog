import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

interface UploadFile {
  name: string;
  progress: number;
}

interface UploadProgressProps {
  files: UploadFile[];
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ files }) => {
  if (files.length === 0) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        p: 2,
        zIndex: 1000,
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Uploading {files.length} file{files.length > 1 ? 's' : ''}
      </Typography>
      <List dense>
        {files.map((file) => (
          <ListItem key={file.name}>
            <ListItemText
              primary={file.name}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={file.progress}
                    sx={{ flexGrow: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(file.progress)}%
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}; 