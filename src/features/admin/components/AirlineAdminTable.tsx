import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
  Avatar, // Pour afficher le logo
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BrokenImageIcon from '@mui/icons-material/BrokenImage'; // Icône par défaut pour logo
import { AirlineData } from '@bassdoubs/fyg-shared'; // <-- Importer depuis shared
// Importer Pagination et ConfirmDialog plus tard
import { Pagination } from '../../parkings/components/Pagination';
// import { ConfirmDialog } from '../../../components/ConfirmDialog';
// Importer le formulaire
import { AirlineFormDialog } from './AirlineFormDialog';
// Importer le hook debounce et i18n
import { useDebounce } from '../../../hooks/useDebounce';
import countries from "i18n-iso-countries";
import frLocale from "i18n-iso-countries/langs/fr.json";
// Importer le dialogue de confirmation (export nommé)
// import { useSnackbar } from '../../../context/SnackbarContext'; // <-- Supprimé car chemin incorrect
import { ConfirmDialog } from '../../../components/ConfirmDialog'; // <-- Import nommé

countries.registerLocale(frLocale);
const getCountryName = (code: string) => {
  if (!code) return 'N/A';
  const name = countries.getName(code.toUpperCase(), "fr", { select: "official" });
  return name || code;
};

// Utiliser directement le type Airline
// interface AirlineWithMongoId extends Airline {
//   _id?: string; // Ajout optionnel pour l'ID MongoDB
//   logoUrl?: string; // Assurer que logoUrl est là
// }

const AirlineAdminTable = () => {
  const [airlines, setAirlines] = useState<AirlineData[]>([]); // <-- Utiliser AirlineData
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Ajouter états pagination/recherche/dialogues
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalAirlines, setTotalAirlines] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  // Ajouter états pour dialogues et snackbar
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<AirlineData | null>(null); // <-- Utiliser AirlineData
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [airlineToDelete, setAirlineToDelete] = useState<AirlineData | null>(null); // <-- Utiliser AirlineData
  // const { showSnackbar } = useSnackbar(); // <-- Supprimé

  // Fonction de fetch avec pagination/recherche
  const fetchAirlines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ 
        docs: AirlineData[]; // <-- Changer ici
        totalDocs: number; // <-- Changer ici
      }>('/api/airlines', {
        params: {
          page: currentPage + 1,
          limit: rowsPerPage,
          search: debouncedSearchTerm
        }
      });
      setAirlines(response.data.docs); // <-- Changer ici
      setTotalAirlines(response.data.totalDocs); // <-- Changer ici
    } catch (err) {
      console.error("Erreur lors de la récupération des compagnies:", err);
      setError('Impossible de charger les données des compagnies. Veuillez réessayer.');
      setAirlines([]);
      setTotalAirlines(0);
      // showSnackbar('Erreur lors du chargement des compagnies.', 'error'); // <-- Supprimé
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchAirlines();
  }, [fetchAirlines]); // <-- Supprimé showSnackbar des dépendances

  // Handlers Pagination et Recherche
  const handleChangePage = (newPage: number) => {
    setCurrentPage(newPage);
  };
  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0);
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0);
  };

  // Handlers pour ouvrir le formulaire (ajout/modif)
  const handleAddAirline = () => {
    setSelectedAirline(null);
    setIsFormOpen(true);
  };
  const handleEditAirline = (airline: AirlineData) => { // Utiliser AirlineData
    setSelectedAirline(airline);
    setIsFormOpen(true);
  };
  const handleDeleteAirline = (airline: AirlineData) => { // <-- Utiliser AirlineData
    setAirlineToDelete(airline);
    setConfirmDeleteOpen(true);
  };
  
  // Handler appelé par le formulaire après sauvegarde
  const handleSaveAirline = () => { 
    fetchAirlines(); // Rafraîchir la liste
    // showSnackbar(`Compagnie ${selectedAirline ? 'mise à jour' : 'ajoutée'} avec succès.`, 'success'); // <-- Supprimé
    setSelectedAirline(null);
  }; 

  // Handler pour fermer le formulaire
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAirline(null);
  };

  const handleConfirmDelete = async () => {
    if (!airlineToDelete || !airlineToDelete._id) return;
    setConfirmDeleteOpen(false);

    try {
      await axios.delete(`/api/airlines/${airlineToDelete._id}`);
      setAirlines(airlines.filter(a => a._id !== airlineToDelete._id));
      // showSnackbar(`Compagnie ${airlineToDelete.name} supprimée avec succès.`, 'success'); // <-- Supprimé
      setAirlineToDelete(null);
    } catch (err) {
      console.error("Erreur suppression compagnie:", err);
      setError('Erreur lors de la suppression de la compagnie.');
      // showSnackbar('Erreur lors de la suppression.', 'error'); // <-- Supprimé
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setAirlineToDelete(null);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mt: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', p: 2, gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Liste des Compagnies Aériennes
        </Typography>
        {/* Ajouter TextField recherche */}
        <TextField
          label="Rechercher (ICAO, Nom, Indicatif, Pays...)"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: '300px' }} 
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAirline}
        >
          Ajouter
        </Button>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      )}
      {!loading && !error && (
        <>
          <TableContainer sx={{ maxHeight: 600 }}> 
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>Logo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ICAO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Indicatif</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Pays</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {airlines.length > 0 ? (
                  airlines
                    .filter(a => a && a._id)
                    .map((airline) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={airline._id}>
                      <TableCell> {/* Placeholder Logo */} - </TableCell>
                      <TableCell component="th" scope="row">{airline?.icao || '?'}</TableCell>
                      <TableCell>{airline?.name || '?'}</TableCell>
                      <TableCell>{airline?.callsign || '?'}</TableCell>
                      <TableCell> {/* Placeholder Pays */} {airline?.country || '?'} </TableCell>
                      <TableCell align="right"> {/* Placeholder Actions */} - </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {/* Message si recherche vide */}
                      {searchTerm ? `Aucune compagnie trouvée pour "${debouncedSearchTerm}"` : 'Aucune compagnie trouvée'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Ajouter Pagination */}
          <Pagination
            count={totalAirlines}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
      {/* Ajouter AirlineFormDialog */}
      <AirlineFormDialog
        open={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveAirline}
        airlineToEdit={selectedAirline}
      />

      {/* Ajouter Snackbar */} 
      {/* {snackbar && (
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
      )} */}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer la compagnie ${airlineToDelete?.name} (${airlineToDelete?.icao}) ? Cette action est irréversible.`}
      />

    </Paper>
  );
};

export default AirlineAdminTable; 