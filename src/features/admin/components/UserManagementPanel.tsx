import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import api from '../../../services/api';
import type { UserData } from '@bassdoubs/fyg-shared';

const truncateEmail = (email: string): string => {
  const atIndex = email.indexOf('@');
  if (atIndex === -1 || atIndex <= 3) { 
    return email;
  }
  return email.substring(0, 3) + '...' + email.substring(atIndex);
};

const UserManagementPanel = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true); 
  const [error, setError] = useState<string | null>(null); 
  const [activatingUserId, setActivatingUserId] = useState<string | null>(null); 
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [view, setView] = useState<'pending' | 'all'>('pending');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const params = view === 'pending' ? { isActive: false } : {}; 
    
    try {
      const response = await api.get<UserData[]>('/api/users', { params }); 
      setUsers(response.data);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      if (view === 'all' && err.response?.status === 400) {
         setError('Le filtre \'Tous les comptes\' n\'est pas encore supporté par l\'API.');
      } else {
        setError(err.response?.data?.message || 'Impossible de charger les utilisateurs.');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleActivateUser = async (userId: string, rolesToSet: string[]) => {
    setActivatingUserId(userId); 
    setSnackbar({ open: false, message: '', severity: 'success' });
    
    try {
      await api.patch(`/api/users/${userId}/activate`, { roles: rolesToSet }); 
      
      if (view === 'pending') {
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId)); 
      } else {
        await fetchUsers(); 
      }
      setSnackbar({ open: true, message: 'Utilisateur activé avec succès !', severity: 'success' });
    } catch (err: any) {
      console.error("Erreur lors de l'activation:", err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Erreur lors de l\'activation.', severity: 'error' });
    } finally {
      setActivatingUserId(null); 
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'pending' | 'all' | null,
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, mt: 0 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
          Gestion des Utilisateurs
        </Typography>
        <ToggleButtonGroup
          color="primary"
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label="Filtre d'affichage des utilisateurs"
          size="small"
        >
          <ToggleButton value="pending">En attente</ToggleButton>
          <ToggleButton value="all">Tous</ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
          <Table stickyHeader aria-label="Table de gestion des utilisateurs">
            <TableHead>
              <TableRow>
                <TableCell>Nom d'utilisateur</TableCell>
                <TableCell>Email (Tronqué)</TableCell>
                <TableCell>Rôles</TableCell>
                {view === 'all' && <TableCell>Statut</TableCell>}
                <TableCell>Date de création</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={view === 'all' ? 6 : 5} align="center">
                    Aucun compte utilisateur trouvé pour la vue "{view === 'pending' ? 'En attente' : 'Tous'}".
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userData) => (
                  <TableRow hover key={userData._id}>
                    <TableCell>{userData.username}</TableCell>
                    <TableCell>{truncateEmail(userData.email)}</TableCell> 
                    <TableCell>
                      {userData.roles.map((role: string) => (
                        <Chip key={role} label={role} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    {view === 'all' && (
                      <TableCell>
                        <Chip 
                          label={userData.isActive ? 'Actif' : 'Inactif'} 
                          color={userData.isActive ? 'success' : 'default'} 
                          size="small" 
                        />
                      </TableCell>
                    )}
                    <TableCell>{formatDate(userData.createdAt)}</TableCell>
                    <TableCell align="right">
                      {!userData.isActive && (
                        <ButtonGroup variant="contained" size="small" aria-label="outlined primary button group">
                          <Button 
                            onClick={() => handleActivateUser(userData._id, ['user'])} 
                            disabled={activatingUserId === userData._id} 
                            color="primary"
                          >
                            {activatingUserId === userData._id ? <CircularProgress size={20} color="inherit" /> : 'User'}
                          </Button>
                          <Button 
                            onClick={() => handleActivateUser(userData._id, ['user', 'admin'])} 
                            disabled={activatingUserId === userData._id} 
                            color="secondary" 
                          >
                            {activatingUserId === userData._id ? <CircularProgress size={20} color="inherit" /> : 'Admin'}
                          </Button>
                        </ButtonGroup>
                      )}
                      {userData.isActive && view === 'all' && (
                        <Typography variant="caption" color="text.secondary">
                          (Actif)
                        </Typography>
                      )}
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

export default UserManagementPanel; 