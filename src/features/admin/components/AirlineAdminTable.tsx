import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api'; // Utiliser l'instance configurée
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  Avatar,
  Snackbar, // Importer Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { AirlineData } from '@bassdoubs/fyg-shared';
import { Pagination } from '../../parkings/components/Pagination'; // Réutiliser Pagination
import { AirlineFormDialog } from './AirlineFormDialog'; // Importer le formulaire spécifique
import { ConfirmDialog } from '../../../components/ConfirmDialog'; // Réutiliser ConfirmDialog
import { useDebounce } from '../../../hooks/useDebounce';
import countries from "i18n-iso-countries";
import frLocale from "i18n-iso-countries/langs/fr.json";

countries.registerLocale(frLocale);

// Fonction utilitaire pour obtenir le nom du pays (robuste)
const getCountryName = (code: string | null | undefined) => {
  if (typeof code !== 'string' || !code.trim()) {
    return 'N/A';
  }
  // Tenter la conversion ISO -> Nom
  const name = countries.getName(code.toUpperCase(), "fr", { select: "official" });
  // Si la conversion échoue (le code n'est pas un code ISO valide), retourner le code original
  return name || code; 
};

const AirlineAdminTable = () => {
  // États pour les données, chargement, erreur
  const [airlines, setAirlines] = useState<AirlineData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // États pour pagination et recherche
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalAirlines, setTotalAirlines] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // États pour les dialogues et notifications
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<AirlineData | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [airlineToDelete, setAirlineToDelete] = useState<AirlineData | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

  // Fonction de fetch (utilise maintenant l'instance 'api')
  const fetchAirlines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ 
        docs: AirlineData[]; 
        totalDocs: number; 
      }>('/api/airlines', { // Pointe vers la bonne route backend
        params: {
          page: currentPage + 1,
          limit: rowsPerPage,
          search: debouncedSearchTerm || undefined // Ne pas envoyer search si vide
        }
      });
      if (response.data && Array.isArray(response.data.docs)) {
        setAirlines(response.data.docs);
        setTotalAirlines(response.data.totalDocs || 0);
      } else {
        console.error("Réponse API inattendue (airlines):", response.data);
        setError('Format de données inattendu reçu du serveur.');
        setAirlines([]);
        setTotalAirlines(0);
      }
    } catch (err: any) {
      console.error("Erreur lors de la récupération des compagnies:", err);
      const message = err.response?.data?.message || 'Impossible de charger les données des compagnies.';
      setError(message);
      setAirlines([]);
      setTotalAirlines(0);
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchAirlines();
  }, [fetchAirlines]);

  // --- Handlers ---
  const handleChangePage = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0); // Retour à la première page si on change le nombre par page
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0); // Retour à la première page lors d'une nouvelle recherche
  };

  const handleAddAirline = () => {
    setSelectedAirline(null); // Pas d'airline sélectionnée pour l'ajout
    setIsFormOpen(true);
  };

  const handleEditAirline = (airline: AirlineData) => {
    setSelectedAirline(airline);
    setIsFormOpen(true);
  };

  const handleDeleteAirline = (airline: AirlineData) => {
    setAirlineToDelete(airline); // Garder l'objet airline pour afficher nom/icao dans dialogue
    setConfirmDeleteOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAirline(null); // Réinitialiser l'airline sélectionnée
  };

  const handleSaveAirline = () => {
    // Message dynamique basé sur ajout ou modification
    const message = selectedAirline ? 'Compagnie mise à jour avec succès !' : 'Compagnie ajoutée avec succès !';
    setSnackbar({ open: true, message, severity: 'success' });
    fetchAirlines(); // Rafraîchir les données après sauvegarde
    // Note: handleCloseForm est appelé par le dialogue lui-même après succès
  };

  const handleConfirmDelete = async () => {
    if (!airlineToDelete?._id) return;
    const idToDelete = airlineToDelete._id;
    const nameToDelete = airlineToDelete.name; // Garder le nom pour le message snackbar

    setConfirmDeleteOpen(false); // Fermer le dialogue de confirmation

    try {
      await api.delete(`/api/airlines/${idToDelete}`);
      setSnackbar({ open: true, message: `Compagnie ${nameToDelete} supprimée avec succès !`, severity: 'success' });
      fetchAirlines(); // Rafraîchir la liste
    } catch (err: any) {
      console.error("Erreur lors de la suppression de la compagnie:", err);
      const message = err.response?.data?.message || 'Erreur lors de la suppression.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setAirlineToDelete(null); // Réinitialiser l'état
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setAirlineToDelete(null);
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(null);
  };

  // --- Rendu JSX ---
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mt: 3, borderRadius: 2, boxShadow: 3 }}>
      {/* En-tête avec titre, recherche et bouton ajouter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', p: 2, gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
          Gestion des Compagnies Aériennes
        </Typography>
        <TextField
          label="Rechercher (ICAO, Nom, Indicatif, Pays...)"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: '300px' }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAirline}
          color="primary"
        >
          Ajouter Compagnie
        </Button>
      </Box>
      
      {/* Indicateur de chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {/* Affichage de l'erreur */}
      {!loading && error && (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      )}
      {/* Affichage de la table si pas de chargement et pas d'erreur */}
      {!loading && !error && (
        <>
          <TableContainer sx={{ maxHeight: 650 }}> {/* Ajuster la hauteur max si besoin */}
            <Table stickyHeader aria-label="Tableau des compagnies aériennes">
              <TableHead>
                <TableRow>
                  {/* En-têtes de colonnes */}
                  <TableCell sx={{ fontWeight: 'bold', width: '60px', py: 1 }}>Logo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1 }}>ICAO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Nom</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Indicatif</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Pays</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {airlines && airlines.length > 0 ? (
                  airlines
                    // Le filtre n'est plus nécessaire ici car on s'attend à des données valides
                    .map((airline) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={airline._id}>
                      {/* Logo */}
                      <TableCell sx={{ py: 0.5 }}>
                        <Avatar 
                          src={airline.logoUrl || undefined}
                          alt={airline.name} 
                          sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}
                          imgProps={{ loading: 'lazy' }} // Lazy load logos
                        >
                          {/* Icône par défaut si pas de logo */}
                          {!airline.logoUrl && <BrokenImageIcon fontSize="small" />}
                        </Avatar>
                      </TableCell>
                      {/* ICAO */}
                      <TableCell component="th" scope="row" sx={{ py: 0.5, fontWeight: 'medium' }}>
                        {airline.icao || 'N/A'}
                      </TableCell>
                      {/* Nom */}
                      <TableCell sx={{ py: 0.5 }}>{airline.name || 'N/A'}</TableCell>
                      {/* Indicatif */}
                      <TableCell sx={{ py: 0.5 }}>{airline.callsign || 'N/A'}</TableCell>
                      {/* Pays */}
                      <TableCell sx={{ py: 0.5 }}>{getCountryName(airline.country)}</TableCell>
                      {/* Actions */}
                      <TableCell align="right" sx={{ py: 0.5 }}>
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => handleEditAirline(airline)} color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" onClick={() => handleDeleteAirline(airline)} sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Message si aucune donnée
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      {searchTerm ? `Aucune compagnie trouvée pour "${debouncedSearchTerm}"` : 'Aucune compagnie à afficher.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalAirlines > 0 && (
             <Pagination
               count={totalAirlines}
               page={currentPage}
               rowsPerPage={rowsPerPage}
               onPageChange={handleChangePage}
               onRowsPerPageChange={handleChangeRowsPerPage}
             />
          )}
        </>
      )}

      {/* Dialogue Formulaire Ajout/Modif */}
      <AirlineFormDialog
        open={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveAirline} // handleSaveAirline s'occupe du snackbar et fetch
        airlineToEdit={selectedAirline}
      />
      
      {/* Dialogue Confirmation Suppression */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        // Utiliser l'optional chaining pour l'affichage message
        message={`Êtes-vous sûr de vouloir supprimer la compagnie ${airlineToDelete?.name || ''} (${airlineToDelete?.icao || ''}) ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        severity="error"
      />
      
      {/* Snackbar pour les notifications */}
      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {/* Utiliser Alert à l'intérieur pour la couleur et l'icône */}
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Paper>
  );
};

// Exporter le bon nom de composant
export default AirlineAdminTable; 