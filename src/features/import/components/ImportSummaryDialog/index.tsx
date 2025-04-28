import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer
} from '@mui/material';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useTheme } from '@mui/material/styles';

interface ImportSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  summary: {
    total: number;
    inserted: number;
    duplicates: number;
  };
  duplicateDetails: Array<{
    airline: string;
    airport: string;
    reason: string;
  }>;
  status: 'success' | 'partial';
}

export const ImportSummaryDialog = ({ 
  open, 
  onClose, 
  summary, 
  duplicateDetails, 
  status 
}: ImportSummaryDialogProps) => {
  const { isDarkMode } = useDarkMode();
  const theme = useTheme();

  const getStatusIcon = () => {
    if (status === 'success' && summary.duplicates === 0) {
      return <CheckCircleIcon 
        sx={{ 
          fontSize: 40, 
          color: theme.palette.success.main 
        }} 
      />;
    } else {
      return <WarningIcon 
        sx={{ 
          fontSize: 40, 
          color: theme.palette.warning.main 
        }} 
      />;
    }
  };

  const getStatusText = () => {
    if (status === 'success' && summary.duplicates === 0) {
      return "Importation réussie";
    } else {
      return "Importation partielle";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className={`${isDarkMode ? 'dark' : ''}`}
      PaperProps={{
        className: "bg-white dark:bg-gray-800"
      }}
    >
      <DialogTitle className="bg-gray-50 dark:bg-gray-700 flex items-center gap-3">
        {getStatusIcon()}
        <span className="text-gray-800 dark:text-gray-100">{getStatusText()}</span>
      </DialogTitle>

      <DialogContent className="!pt-6">
        <div className="space-y-6">
          {/* Résumé de l'importation */}
          <Paper elevation={0} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Typography variant="h6" className="mb-3 text-gray-800 dark:text-gray-100">
              Résumé de l'importation
            </Typography>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-600 p-3 rounded-lg text-center">
                <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-300">
                  Total
                </Typography>
                <Typography variant="h5" className="font-bold text-gray-800 dark:text-white">
                  {summary.total}
                </Typography>
              </div>
              
              <div className="bg-white dark:bg-gray-600 p-3 rounded-lg text-center">
                <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-300">
                  Importés
                </Typography>
                <Typography variant="h5" className="font-bold text-green-600 dark:text-green-400">
                  {summary.inserted}
                </Typography>
              </div>
              
              <div className="bg-white dark:bg-gray-600 p-3 rounded-lg text-center">
                <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-300">
                  Doublons
                </Typography>
                <Typography 
                  variant="h5" 
                  className={`font-bold ${
                    summary.duplicates > 0 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-gray-800 dark:text-white'
                  }`}
                >
                  {summary.duplicates}
                </Typography>
              </div>
            </div>
          </Paper>

          {/* Liste des doublons si présents */}
          {duplicateDetails.length > 0 && (
            <div>
              <Typography variant="h6" className="mb-3 text-gray-800 dark:text-gray-100">
                Détails des doublons
              </Typography>
              
              <TableContainer component={Paper} className="bg-white dark:bg-gray-700">
                <Table>
                  <TableHead className="bg-gray-50 dark:bg-gray-600">
                    <TableRow>
                      <TableCell className="font-medium text-gray-700 dark:text-gray-200">Compagnie</TableCell>
                      <TableCell className="font-medium text-gray-700 dark:text-gray-200">Aéroport</TableCell>
                      <TableCell className="font-medium text-gray-700 dark:text-gray-200">Raison</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {duplicateDetails.map((item, index) => (
                      <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600/50">
                        <TableCell className="text-gray-800 dark:text-gray-200">{item.airline}</TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-200">{item.airport}</TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-200">{item.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions className="border-t border-gray-200 dark:border-gray-700 p-4">
        <Button 
          onClick={onClose}
          variant="contained"
          className="bg-brand-500 hover:bg-brand-600"
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 