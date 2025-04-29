import React, { useState, useEffect } from 'react';
import api from '../../../services/api'; // Ajuster le chemin relatif
import {
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
  Button,
  TextField,
  InputAdornment,
  Dialog, // Garder Dialog pour les confirmations
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AirlinesIcon from '@mui/icons-material/Airlines';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { format } from 'date-fns';

// Interface CommandLog (inchangée)
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

// Interface pour les props (vide maintenant, car pas de open/onClose)
interface DiscordLogsPanelProps {}

export const DiscordLogsPanel: React.FC<DiscordLogsPanelProps> = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
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

  // useEffect pour la sélection (plus besoin de dépendre de 'open')
  useEffect(() => {
    setSelectedLogs([]);
  }, [page]);

  const fetchLogs = async () => {
    try {
      const response = await api.get<{ logs: CommandLog[], total: number }>('/api/discord-logs', {
        params: {
          page: page,
          limit: rowsPerPage,
          search: searchTerm || undefined
        }
      });
      const data = response.data;
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des logs:', error);
      const message = error.response?.data?.message || 'Erreur lors de la récupération des logs.';
      setSnackbar({ open: true, message, severity: 'error' });
      setLogs([]);
      setTotalLogs(0);
    }
  };

  // useEffect pour fetch initial et sur changements
  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, searchTerm]);

  // --- Handlers (inchangés) ---
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
      await api.delete(`/api/discord-logs/${logToDelete}`);
      setSnackbar({ open: true, message: 'Log supprimé avec succès', severity: 'success' });
      fetchLogs();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const message = error.response?.data?.message || 'Erreur lors de la suppression.';
      setSnackbar({ open: true, message: message, severity: 'error' });
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
      // Note: On pourrait avoir une route bulk delete côté API pour plus d'efficacité
      const deletionPromises = selectedLogs.map(id => api.delete(`/api/discord-logs/${id}`));
      await Promise.all(deletionPromises);
      setSnackbar({ open: true, message: `${selectedLogs.length} logs supprimés avec succès`, severity: 'success' });
      setSelectedLogs([]);
      fetchLogs();
    } catch (error: any) {
      console.error('Erreur lors de la suppression multiple:', error);
      const message = error.response?.data?.message || 'Erreur lors de la suppression multiple.';
      setSnackbar({ open: true, message: message, severity: 'error' });
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
      const response = await api.post(`/api/discord-logs/clean`, { days: daysToKeep });
      const data = response.data;
      let message = '';
      if (data.deletedCount > 0) {
        message = `${data.deletedCount} logs supprimés (plus vieux que ${data.daysKept} jours)`;
      } else {
        message = `Aucun log supprimé (aucun plus vieux que ${data.daysKept} jours)`;
      }
      setSnackbar({ open: true, message, severity: 'success' });
      setPage(0); // Revenir à la première page
      fetchLogs(); // Rafraîchir les logs affichés
    } catch (error: any) {
      console.error('Erreur lors du nettoyage:', error);
      const message = error.response?.data?.message || 'Erreur lors du nettoyage des logs.';
      setSnackbar({ open: true, message: message, severity: 'error' });
    } finally {
      setIsCleaning(false);
      setCleanConfirmOpen(false);
    }
  };

  const handlePurgeClick = () => {
    setCleanConfirmOpen(true);
  };

  // Retourne directement le contenu (sans Dialog wrapper)
  return (
    <>
      {/* Barre d'outils du panneau de logs */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
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
            sx={{ maxWidth: '600px' }} // Limiter la largeur de la recherche
          />
          <Box display="flex" gap={1}>
             {selectedLogs.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleBulkDeleteClick}
                >
                  Supprimer ({selectedLogs.length})
                </Button>
              )}
              <Tooltip title="Purger les anciens logs" arrow>
                <IconButton
                  size="small"
                  onClick={handlePurgeClick}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                  }}
                >
                  <CleaningServicesIcon fontSize="small" />
                </IconButton>
              </Tooltip>
          </Box>
      </Box>

      {/* Conteneur de la table */}
      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' /* Ajuster la hauteur */ }}>
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
              <TableRow key={log._id} hover selected={selectedLogs.includes(log._id)}>
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
                <TableCell>{log.details.responseTime}ms</TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() => handleDeleteClick(log._id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {/* Afficher un message si aucun log n'est trouvé */}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" p={3}>
                    Aucun log à afficher.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalLogs}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Lignes par page"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`}
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      />

      {/* Dialogs de confirmation (restent nécessaires) */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent><DialogContentText>Êtes-vous sûr de vouloir supprimer ce log ?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteConfirmOpen} onClose={() => setBulkDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression multiple</DialogTitle>
        <DialogContent><DialogContentText>Êtes-vous sûr de vouloir supprimer {selectedLogs.length} logs ?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)}>Annuler</Button>
          <Button onClick={handleBulkDeleteConfirm} color="error" variant="contained">Supprimer {selectedLogs.length} logs</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cleanConfirmOpen} onClose={() => setCleanConfirmOpen(false)}>
        <DialogTitle>Confirmer le nettoyage</DialogTitle>
        <DialogContent>
          <DialogContentText>Supprimer définitivement les logs plus vieux que la période sélectionnée.</DialogContentText>
          <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
            <InputLabel id="days-select-label">Logs plus vieux que</InputLabel>
            <Select
              labelId="days-select-label"
              value={daysToKeep}
              onChange={(e) => setDaysToKeep(Number(e.target.value))}
              label="Logs plus vieux que"
            >
              <MenuItem value={7}>7 jours</MenuItem>
              <MenuItem value={15}>15 jours</MenuItem>
              <MenuItem value={30}>30 jours</MenuItem>
              <MenuItem value={60}>60 jours</MenuItem>
              <MenuItem value={90}>90 jours</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanConfirmOpen(false)}>Annuler</Button>
          <Button onClick={handleCleanLogs} color="warning" variant="contained" disabled={isCleaning}>
            {isCleaning ? 'Nettoyage...' : 'Nettoyer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar (reste nécessaire) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DiscordLogsPanel; // Exporter par défaut pour faciliter l'import 