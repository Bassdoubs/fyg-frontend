import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import api from '../../../services/api'; // Ajuster le chemin si nécessaire
// Importer UserData depuis @fyg/shared
import type { UserData } from '@bassdoubs/fyg-shared';

// Fonction pour tronquer l'email
const truncateEmail = (email: string): string => {
  const atIndex = email.indexOf('@');
  // Si pas d'@ ou partie avant l'@ trop courte, ne pas tronquer pour éviter use...@...
  if (atIndex === -1 || atIndex <= 3) { 
    return email;
  }
  // Retourne les 3 premiers caractères + ... + @domaine.com
  return email.substring(0, 3) + '...' + email.substring(atIndex);
};

const UserValidationPanel = () => {
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingUserId, setActivatingUserId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fonction pour charger les utilisateurs en attente
  const fetchPendingUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Attendre UserData[] en retour
      const response = await api.get<UserData[]>('/users?isActive=false');
      setPendingUsers(response.data);
    } catch (err: any) { // Utiliser any temporairement, idéalement typer l'erreur Axios
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      setError(err.response?.data?.message || 'Impossible de charger les utilisateurs en attente.');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Fonction pour activer un utilisateur avec des rôles spécifiques
  const handleActivateUser = async (userId: string, rolesToSet: string[]) => {
    setActivatingUserId(userId);
    setSnackbar({ open: false, message: '', severity: 'success' });
    
    try {
      await api.patch(`/users/${userId}/activate`, { roles: rolesToSet });
      
      setPendingUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      
      setSnackbar({ open: true, message: 'Utilisateur activé avec succès !', severity: 'success' });

    } catch (err: any) {
      console.error("Erreur lors de l'activation:", err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Erreur lors de l\'activation.', severity: 'error' });
    } finally {
      setActivatingUserId(null);
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  // Fonction pour fermer le Snackbar
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        mt: 0 // Padding déjà géré par TabPanel dans AdminPage
      }}
    >
      <Typography variant="h6" gutterBottom>
        Comptes Utilisateurs en Attente de Validation
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <TableContainer>
          <Table stickyHeader aria-label="Table des utilisateurs en attente">
            <TableHead>
              <TableRow>
                <TableCell>Nom d'utilisateur</TableCell>
                <TableCell>Email (Tronqué)</TableCell>
                <TableCell>Rôles demandés</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Aucun compte en attente de validation.
                  </TableCell>
                </TableRow>
              ) : (
                pendingUsers.map((user) => (
                  <TableRow hover key={user._id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{truncateEmail(user.email)}</TableCell>
                    <TableCell>
                      {user.roles.map((role: string) => (
                        <Chip key={role} label={role} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align="right">
                      <ButtonGroup variant="contained" size="small" aria-label="outlined primary button group">
                        <Button 
                          onClick={() => handleActivateUser(user._id, ['user'])}
                          disabled={activatingUserId === user._id}
                          color="primary"
                        >
                          {activatingUserId === user._id ? <CircularProgress size={20} color="inherit" /> : 'User'}
                        </Button>
                        <Button 
                          onClick={() => handleActivateUser(user._id, ['user', 'admin'])}
                          disabled={activatingUserId === user._id}
                          color="secondary"
                        >
                          {activatingUserId === user._id ? <CircularProgress size={20} color="inherit" /> : 'Admin'}
                        </Button>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} 
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default UserValidationPanel; 