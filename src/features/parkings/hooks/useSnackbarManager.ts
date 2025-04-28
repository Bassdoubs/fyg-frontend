import { useState, useCallback } from 'react';

type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

const initialState: SnackbarState = {
  open: false,
  message: '',
  severity: 'info',
};

export const useSnackbarManager = () => {
  const [snackbarState, setSnackbarState] = useState<SnackbarState>(initialState);

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'info') => {
    setSnackbarState({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarState(prev => ({ ...prev, open: false }));
  }, []);

  return {
    snackbarState,
    showSnackbar,
    handleCloseSnackbar,
  };
}; 