import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, AlertColor } from '@mui/material';
import { useState, useEffect } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  showCancel?: boolean;
  item?: any;
  parkings?: any[];
  severity?: 'success' | 'error' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, message, item, parkings, onConfirm, onClose, confirmLabel, showCancel, severity = 'error' }) => {
  const { isDarkMode } = useDarkMode();
  const [countdown, setCountdown] = useState(3);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  useEffect(() => {
    if (open && !isCountdownActive && !confirmLabel) {
      setCountdown(3);
      setIsCountdownActive(true);
    }
    if (!open) {
      setIsCountdownActive(false);
    }
  }, [open]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountdownActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, isCountdownActive]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className={isDarkMode ? 'dark' : ''}
      PaperProps={{
        className: "bg-white/80 dark:bg-gray-800 backdrop-blur-sm"
      }}
    >
      <DialogTitle className={`
        flex items-center gap-2 p-0
        ${severity === 'success' 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
          : severity === 'warning'
          ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
          : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'
        }`}
      >
        <div className="flex items-center gap-2 p-4 w-full">
          {severity === 'success' ? <CheckCircleIcon className="text-green-600 dark:text-green-400" /> :
           severity === 'warning' ? <WarningAmberIcon className="text-orange-600 dark:text-orange-400" /> :
           <ErrorIcon className="text-red-600 dark:text-red-400" />
          }
          <span className={`
            ${severity === 'success' ? 'text-green-700 dark:text-green-300' : 
              severity === 'warning' ? 'text-orange-700 dark:text-orange-300' :
              'text-red-700 dark:text-red-300'
            }
          `}>
            {title}
          </span>
        </div>
      </DialogTitle>
      <DialogContent className="!pt-6 space-y-4">
        <div className={`
          p-4 rounded-lg
          ${severity === 'success' ? 'bg-green-50/50 dark:bg-green-900/10' : 
            severity === 'warning' ? 'bg-orange-50/50 dark:bg-orange-900/10' :
            'bg-red-50/50 dark:bg-red-900/10'
          }
        `}>
          {message}
        </div>
        
        {item && (
          <div className="bg-gray-50/80 backdrop-blur-sm dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-200">Détails du parking :</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500 dark:text-gray-400">Compagnie :</div>
              <div className="font-medium text-gray-700 dark:text-gray-200">{item.airline}</div>
              <div className="text-gray-500 dark:text-gray-400">Aéroport :</div>
              <div className="font-medium text-gray-700 dark:text-gray-200">{item.airport}</div>
              <div className="text-gray-500 dark:text-gray-400">Terminal :</div>
              <div className="font-medium text-gray-700 dark:text-gray-200">{item.gate?.terminal || '-'}</div>
              <div className="text-gray-500 dark:text-gray-400">Porte :</div>
              <div className="font-medium text-gray-700 dark:text-gray-200">{item.gate?.porte || '-'}</div>
            </div>
          </div>
        )}

        {parkings && parkings.length > 0 && (
          <div className="bg-gray-50/80 backdrop-blur-sm dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              {parkings.length} parkings sélectionnés :
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {parkings.map(p => (
                <div key={p._id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Compagnie :</div>
                    <div className="font-medium text-gray-700 dark:text-gray-200">{p.airline}</div>
                    <div className="text-gray-500 dark:text-gray-400">Aéroport :</div>
                    <div className="font-medium text-gray-700 dark:text-gray-200">{p.airport}</div>
                    <div className="text-gray-500 dark:text-gray-400">Terminal :</div>
                    <div className="font-medium text-gray-700 dark:text-gray-200">{p.gate?.terminal || '-'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Porte :</div>
                    <div className="font-medium text-gray-700 dark:text-gray-200">{p.gate?.porte || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          onClick={onClose}
          sx={{ display: showCancel === false ? 'none' : 'inline-flex' }}
          className="text-gray-600"
        >
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!confirmLabel && countdown > 0}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
        >
          {confirmLabel || `Confirmer ${countdown > 0 ? `(${countdown})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 