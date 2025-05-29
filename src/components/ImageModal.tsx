import React from 'react';
import {
  Modal,
  Box,
  Backdrop,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ImageModalProps {
  imageUrl: string | null;
  open: boolean;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  open,
  onClose,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: { backdropFilter: 'blur(3px)' }, // Apply blur effect
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ position: 'relative', outline: 'none' }}>
        {imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt="Full screen view"
            sx={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              objectFit: 'contain',
            }}
          />
        )}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Modal>
  );
}; 