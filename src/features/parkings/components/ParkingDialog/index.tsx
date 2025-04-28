import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Chip, DialogActions, Button, CircularProgress, Alert } from '@mui/material';
import { DialogTransition } from './DialogTransition';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { ParkingData } from '@bassdoubs/fyg-shared';
import { motion } from 'framer-motion';
import { ParkingList } from './ParkingList';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { Airport } from '../../../types';
import { ParkingForm } from '../ParkingForm';
import { useParkingDialog } from '../../../hooks/useParkingDialog';

interface ParkingDialogProps {
  open: boolean;
  onClose: () => void;
  airportICAO: string;
  airportName: string;
  parkings: ParkingData[];
  onEdit: (parking: ParkingData) => void;
  onDelete: (ids: string[]) => void;
  onAdd: () => void;
  selectedParkings: string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const ParkingDialog: React.FC<ParkingDialogProps> = ({ 
  open, 
  onClose, 
  airportICAO,
  airportName,
  parkings,
  onEdit,
  onDelete,
  onAdd,
  selectedParkings,
  onSelect,
  onSelectAll
}) => {
  const { isDarkMode } = useDarkMode();

  const handleDeleteSelectedParkings = () => {
    onDelete(selectedParkings);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className={`backdrop-blur-sm rounded-3xl ${isDarkMode ? 'dark' : ''}`}
      slots={{
        backdrop: DialogTransition
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(4px)'
          }
        },
        paper: {
          sx: {
            borderRadius: '24px',
            backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          }
        }
      }}
    >
      <DialogTitle className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-t-3xl">
        <div className="flex items-center space-x-4">
          <Chip 
            label={airportICAO} 
            size="medium"
            sx={{ 
              bgcolor: 'primary.dark',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              height: '28px'
            }} 
          />
          <Typography variant="h6" component="span" sx={{ fontSize: '0.9rem', flexGrow: 1, lineHeight: 1.2, fontWeight: 500 }}>
            {airportName}
          </Typography>
          <div className="flex gap-2">
            <span className="
              px-3 py-1.5 text-sm font-medium rounded-full
              bg-blue-500 text-white
              dark:bg-blue-600 dark:text-white
              shadow-sm
              transition-colors duration-200
            ">
              {parkings.length} parkings
            </span>
            <span className="
              px-3 py-1.5 text-sm font-medium rounded-full
              bg-purple-500 text-white
              dark:bg-purple-600 dark:text-white
              shadow-sm
              transition-colors duration-200
            ">
              {new Set(parkings.map(p => p.gate?.terminal || '-')).size} terminaux
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconButton
              onClick={onAdd}
              className="bg-brand-50 hover:bg-brand-100 text-brand-600
                        dark:bg-brand-900/20 dark:hover:bg-brand-900/30 dark:text-brand-400"
            >
              <AddIcon />
            </IconButton>
          </motion.div>
          <IconButton onClick={onClose} size="small" className="text-gray-500 dark:text-gray-400">
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent className={`relative ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/90'}`}>
        {selectedParkings.length > 0 && (
          <div className="
            absolute top-4 right-4 z-10
            flex items-center space-x-2
            bg-white dark:bg-gray-800 
            shadow-lg rounded-lg px-4 py-2
            animate-slideIn
          ">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedParkings.length} sélectionné(s)
            </span>
            <IconButton 
              size="small"
              onClick={handleDeleteSelectedParkings}
              className="text-red-500 hover:text-red-600"
            >
              <DeleteIcon />
            </IconButton>
          </div>
        )}

        <ParkingList
          parkings={parkings}
          selectedParkings={selectedParkings}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          onEdit={onEdit}
        />
      </DialogContent>
    </Dialog>
  );
}; 