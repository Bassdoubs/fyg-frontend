import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip, // Pour afficher les détails complets au survol
  IconButton, // Pour le bouton supprimer
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Icône pour supprimer
// Importer les composants nécessaires pour les filtres
import { TextField } from '@mui/material'; // Ajout de TextField
// Importer la fonction pour appeler l'API (à adapter selon votre structure)
// import { apiService } from '../../../../services/apiService'; // Ancien import incorrect
import api from '../../../services/api'; // Chemin corrigé et import par défaut
import { ConfirmDialog } from '../../../components/ConfirmDialog'; // <-- Importer le dialogue

// Définir une interface pour les données de log (à adapter selon la réponse API réelle)
interface ActivityLogEntry {
  _id: string;
  timestamp: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  user: {
    _id: string;
    username: string;
    // email?: string; // Email n'est plus inclus
  } | null; // L'utilisateur peut être null si non trouvé ou pour certaines actions système
}

// Définir une interface pour les paramètres de l'API
interface FetchLogParams {
  page: number;
  limit: number;
  sort?: string;
  userId?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

// --- Traduction des Actions ---
const actionTranslations: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Mise à jour',
  DELETE: 'Suppression',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  REGISTER: 'Inscription',
  UPLOAD_LOGO: 'Upload Logo',
  CLEAN_LOGS: 'Nettoyage Logs',
  BULK_CREATE: 'Création',
  BULK_DELETE: 'Suppression',
  UPDATE_MAP: 'Mise à jour Carte',
  VALIDATE_USER: 'Validation Utilisateur',
  CHANGE_ROLE: 'Changement Rôle',
  // Ajouter d'autres actions si nécessaire
};

const translateAction = (action: string): string => {
  return actionTranslations[action] || action; // Retourne la traduction ou l'action originale si non trouvée
};

// Fonction utilitaire pour formater la date
const formatDateTime = (isoString: string) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString('fr-FR');
  } catch (e) {
    return isoString; // Retourner la chaîne originale si le format est invalide
  }
};

const ActivityLogPanel: React.FC = () => {
  // --- États ---
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la pagination
  const [page, setPage] = useState<number>(0); // MUI TablePagination est 0-based
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [totalLogs, setTotalLogs] = useState<number>(0);

  // États pour les filtres (exemples, à adapter)
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterTargetType, setFilterTargetType] = useState<string>('');
  // Ajouter des états pour les filtres de date si nécessaire

  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Pour suivre quel log est en cours de suppression

  // États pour le dialogue de confirmation
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  // --- Récupération des données ---
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: FetchLogParams = {
        page: page + 1, 
        limit: rowsPerPage,
        ...(filterUserId && { userId: filterUserId }),
        ...(filterAction && { action: filterAction }),
        ...(filterTargetType && { targetType: filterTargetType }),
        // sort: '-timestamp' // Tri par défaut géré par le backend mais peut être surchargé ici
      };
      
      // console.log("Fetching logs with params:", params); // <-- Supprimer ou commenter
      
      // Appel API réel (utilisation de l'instance 'api' importée par défaut)
      const response = await api.get<{ docs: ActivityLogEntry[], totalDocs: number }>('/api/activity-logs', { params });
      // // MOCK RESPONSE (à supprimer)
      // const mockResponse = { 
      //   data: {
      //     docs: [
      //       { _id: '1', timestamp: new Date().toISOString(), action: 'CREATE', targetType: 'Parking', targetId: 'LFPG-AFR', user: { _id: 'user1', username: 'AdminUser' } },
      //       { _id: '2', timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'UPDATE', targetType: 'Airport', targetId: 'LFPG', user: { _id: 'user1', username: 'AdminUser' }, details: { changes: [{ field: 'name', old: 'CDG', new: 'Charles de Gaulle'}] } },
      //        { _id: '3', timestamp: new Date(Date.now() - 7200000).toISOString(), action: 'LOGIN', targetType: 'Auth', user: { _id: 'user2', username: 'AnotherUser' } },
      //     ],
      //     totalDocs: 3,
      //   } 
      // };
      // await new Promise(resolve => setTimeout(resolve, 500)); 
      // const response = mockResponse; 
      // // Fin du MOCK

      setLogs(response.data.docs);
      setTotalLogs(response.data.totalDocs);

    } catch (err: any) { // Typage plus précis de l'erreur
      console.error("Failed to fetch activity logs:", err);
      const errorMessage = err.response?.data?.error || err.message || "Erreur inconnue lors de la récupération des logs.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterUserId, filterAction, filterTargetType]); 

  // Effet pour charger les logs au montage et quand les paramètres changent
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]); // fetchLogs a ses propres dépendances

  // --- Gestionnaires d'événements (Pagination, Filtres) ---
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Revenir à la première page quand la limite change
  };

  // --- Gestionnaires pour les filtres ---
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setPage(0); // Revenir à la première page lors du changement de filtre
  };

  // --- Ouvre le dialogue de confirmation ---
  const openDeleteDialog = (logId: string) => {
    setLogToDelete(logId);
    setDialogOpen(true);
  };

  // --- Fonction appelée lors de la confirmation de suppression ---
  const handleConfirmDelete = async () => {
    if (!logToDelete) return;

    setIsDeleting(logToDelete); // Indiquer le début de la suppression pour ce log
    setError(null);
    setDialogOpen(false); // Fermer le dialogue immédiatement

    try {
      await api.delete(`/api/activity-logs/${logToDelete}`);
      
      setLogs(prevLogs => prevLogs.filter(log => log._id !== logToDelete));
      setTotalLogs(prevTotal => prevTotal - 1);
      
      // showSnackbar("Entrée de log supprimée avec succès.", "success");

    } catch (err: any) {
      console.error("Failed to delete activity log:", err);
      const errorMessage = err.response?.data?.error || err.message || "Erreur inconnue lors de la suppression du log.";
      setError(errorMessage);
      // showSnackbar(errorMessage, "error");
    } finally {
      setIsDeleting(null);
      setLogToDelete(null); // Réinitialiser l'ID après l'opération
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Journal d'Activité
      </Typography>

      {/* Section des Filtres */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Filtrer par Action"
          variant="outlined"
          size="small"
          value={filterAction}
          onChange={handleFilterChange(setFilterAction)}
          sx={{ minWidth: '150px' }} // Largeur minimale
        />
        <TextField
          label="Filtrer par Type Cible"
          variant="outlined"
          size="small"
          value={filterTargetType}
          onChange={handleFilterChange(setFilterTargetType)}
          sx={{ minWidth: '150px' }} // Largeur minimale
        />
        {/* Ajouter d'autres filtres ici (ex: Date Pickers) */}
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}> {/* Limite la hauteur et ajoute un scroll */} 
            <Table stickyHeader aria-label="journal d'activité">
              <TableHead>
                <TableRow>
                  <TableCell>Date/Heure</TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Type Cible</TableCell>
                  <TableCell>Aéroport (ICAO)</TableCell>
                  <TableCell>Compagnie (ICAO)</TableCell>
                  <TableCell align="right">Supprimer</TableCell> {/* Nouvelle colonne */} 
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    {/* colSpan ajusté à 7 */} 
                    <TableCell colSpan={7} align="center">
                      Aucun log trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={log._id}>
                      <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                      <TableCell>{log.user?.username || 'N/A'}</TableCell>
                      <TableCell>{translateAction(log.action)}</TableCell>
                      <TableCell>{log.targetType}</TableCell>
                      <TableCell>
                        {log.targetType === 'Airport' 
                          ? log.targetId 
                          : log.details?.airport || '-'}
                      </TableCell>
                      <TableCell>
                        {log.targetType === 'Airline' 
                          ? log.targetId 
                          : log.details?.airline || '-'}
                      </TableCell>
                      {/* Cellule pour le bouton Supprimer -> Ouvre le dialogue */}
                      <TableCell align="right">
                        <IconButton 
                          aria-label="supprimer"
                          size="small"
                          onClick={() => openDeleteDialog(log._id)} // Ouvre le dialogue
                          disabled={isDeleting === log._id} 
                        >
                          {isDeleting === log._id ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalLogs}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Logs par page :"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}–${to} sur ${count !== -1 ? count : `plus de ${to}`}`
            }
          />
        </Paper>
      )}

      {/* Dialogue de Confirmation */}
      <ConfirmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette entrée de log ? Cette action est irréversible."
        confirmLabel="Supprimer" // Utiliser un label fixe plutôt que le compte à rebours
        severity="warning" // Utiliser warning pour la suppression
      />

    </Box>
  );
};

export default ActivityLogPanel; 