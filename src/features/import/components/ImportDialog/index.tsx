import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, CircularProgress
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import type { ParkingData } from '../../../../types/parking';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import type { ImportResult } from '../../types';
import { useImportParser } from '../../hooks/useImportParser';
import { useImportValidation } from '../../hooks/useImportValidation';
import { ImportPreview } from './ImportPreview';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  file: File;
  onImport: (data: Array<Omit<ParkingData, '_id'>>) => Promise<ImportResult>;
}

export const ImportDialog = ({ open, onClose, file, onImport }: ImportDialogProps) => {
  const { isDarkMode } = useDarkMode();
  const { parsedData, isLoading, error: parseError, setParsedData } = useImportParser(open ? file : null);
  const { errors, isValid } = useImportValidation(parsedData?.data ?? null);

  const handleImport = async () => {
    if (!parsedData?.data || !isValid) return;

    try {
      const validData = parsedData.data.filter((item): item is Omit<ParkingData, '_id'> => 
        Boolean(item.airline) && 
        Boolean(item.airport) && 
        Boolean(item.gate?.terminal || item.gate?.porte)
      );
      await onImport(validData);
      onClose();
    } catch (error) {
      // L'erreur sera gérée par le composant parent
    }
  };

  const handleUpdateRow = (index: number, updatedData: Partial<Omit<ParkingData, '_id'>>) => {
    if (parsedData) {
      const newData = [...parsedData.data];
      newData[index] = updatedData;
      setParsedData({
        ...parsedData,
        data: newData
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      className={`${isDarkMode ? 'dark' : ''} backdrop-blur-sm`}
      PaperProps={{
        className: "bg-white dark:bg-gray-800"
      }}
    >
      <DialogTitle className="bg-gray-50 dark:bg-gray-700 backdrop-blur-sm flex items-center gap-2">
        <PreviewIcon className="text-brand-500" />
        <span className="text-gray-800 dark:text-gray-100">Aperçu de l'import</span>
      </DialogTitle>

      <DialogContent className="!pt-6">
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <CircularProgress className="text-brand-500" />
          </div>
        )}

        {parseError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            <Typography>{parseError}</Typography>
          </div>
        )}

        {parsedData && !isLoading && (
          <ImportPreview 
            data={parsedData.data}
            errors={errors}
            onUpdateRow={handleUpdateRow}
          />
        )}
      </DialogContent>

      <DialogActions className="border-t border-gray-200 dark:border-gray-700 p-4">
        <Button 
          onClick={onClose}
          className="text-gray-600 dark:text-gray-300"
        >
          Annuler
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!isValid || isLoading}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
        >
          Importer
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 