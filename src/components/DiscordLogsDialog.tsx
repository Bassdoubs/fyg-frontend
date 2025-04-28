import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  Box,
  Chip,
  useTheme,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  DialogContentText,
  Alert,
  Snackbar,
  Tooltip,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AirlinesIcon from '@mui/icons-material/Airlines';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { 
  NavigateBefore, 
  NavigateNext, 
  FirstPage, 
  LastPage 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useDarkMode } from '../hooks/useDarkMode';

interface CommandLog {
  _id: string;
  command: string;
  user: {
    id: string;
    tag: string;
    nickname: string;
  };
  guild: {
    id: string;
    name: string;
  };
  timestamp: string;
  details: {
    airport: string;
    airline: string;
    found: boolean;
    parkingsCount: number;
    responseTime: number;
  };
}

interface DiscordLogsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const DiscordLogsDialog: React.FC<DiscordLogsDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanConfirmOpen, setCleanConfirmOpen] = useState(false);
  const [daysToKeep, setDaysToKeep] = useState(30);

  useEffect(() => {
    setSelectedLogs([]);
  }, [open, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/discord-logs?page=${page}&limit=${rowsPerPage}&search=${searchTerm}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des logs');
      }
      const data = await response.json();
      console.log('Logs récupérés:', data.logs);
      data.logs.forEach((log: CommandLog) => {
        console.log(`Log ID: ${log._id}, Airport: ${log.details.airport}, Airline: ${log.details.airline}, Found: ${log.details.found}, ParkingsCount: ${log.details.parkingsCount}`);
      });
      setLogs(data.logs);
      setTotalLogs(data.total);
    } catch (error) {
      console.error('Erreur:', error);
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, page, rowsPerPage, searchTerm]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDeleteClick = (logId: string) => {
    setLogToDelete(logId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!logToDelete) return;

    try {
      const response = await fetch(`/api/discord-logs/${logToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setSnackbar({
        open: true,
        message: 'Log supprimé avec succès',
        severity: 'success'
      });
      
      // Rafraîchir les données
      fetchLogs();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression',
        severity: 'error'
      });
    } finally {
      setDeleteConfirmOpen(false);
      setLogToDelete(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleBulkDeleteClick = () => {
    if (selectedLogs.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedLogs.length === 0) return;

    try {
      const deletionPromises = selectedLogs.map(id => 
        fetch(`/api/discord-logs/${id}`, { method: 'DELETE' })
          .then(response => {
            if (!response.ok) throw new Error(`Erreur lors de la suppression du log ${id}`);
            return response.json();
          })
      );

      await Promise.all(deletionPromises);

      setSnackbar({
        open: true,
        message: `${selectedLogs.length} logs supprimés avec succès`,
        severity: 'success'
      });
      
      setSelectedLogs([]);
      
      fetchLogs();
    } catch (error) {
      console.error('Erreur lors de la suppression multiple:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression multiple',
        severity: 'error'
      });
    } finally {
      setBulkDeleteConfirmOpen(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedLogs(logs.map(log => log._id));
    } else {
      setSelectedLogs([]);
    }
  };

  const handleSelectLog = (logId: string) => {
    setSelectedLogs(prev => {
      if (prev.includes(logId)) {
        return prev.filter(id => id !== logId);
      } else {
        return [...prev, logId];
      }
    });
  };

  const handleCleanLogs = async () => {
    try {
      setIsCleaning(true);
      
      // On teste d'abord pour voir quel est le log le plus ancien
      const oldestResponse = await fetch('/api/discord-logs/oldest');
      const oldestData = await oldestResponse.json();
      console.log('Log le plus ancien avant purge:', oldestData);

      const response = await fetch(`/api/discord-logs/clean?days=${daysToKeep}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days: daysToKeep })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du nettoyage des logs');
      }

      const data = await response.json();
      console.log('Résultat du nettoyage:', data);
      
      // Vérifier à nouveau le log le plus ancien après purge
      const newOldestResponse = await fetch('/api/discord-logs/oldest');
      const newOldestData = await newOldestResponse.json();
      console.log('Log le plus ancien après purge:', newOldestData);
      
      let message = '';
      if (data.deletedCount > 0) {
        message = `${data.deletedCount} logs supprimés avec succès (logs > ${data.daysKept} jours)`;
      } else {
        message = `Aucun log supprimé (il n'y a pas de logs plus vieux que ${data.daysKept} jours)`;
      }
      
      setSnackbar({
        open: true,
        message,
        severity: 'success'
      });
      
      // Forcer un retour à la première page après nettoyage
      setPage(0);
      
      // Rafraîchir les données après un court délai pour être sûr que la base a bien été mise à jour
      setTimeout(() => {
        fetchLogs();
      }, 1000);
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du nettoyage des logs',
        severity: 'error'
      });
    } finally {
      setIsCleaning(false);
      setCleanConfirmOpen(false);
    }
  };

  const handlePurgeClick = () => {
    setCleanConfirmOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        keepMounted
        aria-labelledby="logs-dialog-title"
        aria-describedby="logs-dialog-description"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle className="flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <Typography variant="h6" component="div" className="text-gray-900 dark:text-blue-100">Logs Discord</Typography>
          <Box className="flex items-center gap-2">
            {selectedLogs.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={handleBulkDeleteClick}
                className="mr-2"
              >
                Supprimer ({selectedLogs.length})
              </Button>
            )}
            <Tooltip title="Purger les logs" arrow>
              <IconButton 
                size="small" 
                onClick={handlePurgeClick}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-blue-300"
              >
                <CleaningServicesIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton 
              onClick={onClose} 
              size="small"
              className="text-gray-700 dark:text-gray-300"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent className="bg-gray-100 dark:bg-gray-900 h-[70vh] overflow-auto">
          <Box mb={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Rechercher par utilisateur, aéroport ou compagnie..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedLogs.length > 0 && selectedLogs.length < logs.length}
                      checked={logs.length > 0 && selectedLogs.length === logs.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Date et Heure</TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Aéroport</TableCell>
                  <TableCell>Compagnie</TableCell>
                  <TableCell>Résultat</TableCell>
                  <TableCell>Temps de réponse</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow 
                    key={log._id} 
                    hover 
                    selected={selectedLogs.includes(log._id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedLogs.includes(log._id)}
                        onChange={() => handleSelectLog(log._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTimeIcon fontSize="small" />
                        {format(new Date(log.timestamp), "dd MMM yyyy HH:mm:ss")}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" />
                        {log.user.nickname}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <FlightTakeoffIcon fontSize="small" />
                        {log.details.airport}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AirlinesIcon fontSize="small" />
                        {log.details.airline}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.details.found ? `${log.details.parkingsCount || 0} parkings` : 'Aucun parking'}
                        color={log.details.found ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {log.details.responseTime}ms
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleDeleteClick(log._id)}
                        size="small"
                        className="text-red-500 hover:text-red-700"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalLogs}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce log ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmer la suppression multiple</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer {selectedLogs.length} logs ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleBulkDeleteConfirm} color="error" variant="contained">
            Supprimer {selectedLogs.length} logs
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cleanConfirmOpen}
        onClose={() => setCleanConfirmOpen(false)}
      >
        <DialogTitle>Confirmer le nettoyage</DialogTitle>
        <DialogContent>
          <DialogContentText className="mb-4">
            Êtes-vous sûr de vouloir nettoyer les logs ? Cette action supprimera définitivement les logs plus vieux que la période sélectionnée.
          </DialogContentText>
          <FormControl fullWidth variant="outlined" className="mt-2">
            <InputLabel id="days-select-label">Supprimer les logs plus vieux que</InputLabel>
            <Select
              labelId="days-select-label"
              value={daysToKeep}
              onChange={(e) => setDaysToKeep(Number(e.target.value))}
              label="Supprimer les logs plus vieux que"
            >
              <MenuItem value={15}>15 jours</MenuItem>
              <MenuItem value={30}>30 jours</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanConfirmOpen(false)} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleCleanLogs}
            color="warning"
            variant="contained"
            disabled={isCleaning}
          >
            {isCleaning ? 'Nettoyage en cours...' : 'Nettoyer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export const LogsDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  return (
    <DiscordLogsDialog
      open={open}
      onClose={onClose}
    />
  );
};

export default DiscordLogsDialog; 