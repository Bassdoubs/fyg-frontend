import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
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
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { AirportData } from '@bassdoubs/fyg-shared';
import { Pagination } from '../../parkings/components/Pagination';
import countries from "i18n-iso-countries";
import frLocale from "i18n-iso-countries/langs/fr.json";
import { useDebounce } from '../../../hooks/useDebounce';
import { AirportFormDialog } from './AirportFormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

countries.registerLocale(frLocale);

const getCountryName = (code: string | null | undefined) => {
  if (typeof code !== 'string' || !code.trim()) {
    return 'N/A';
  }
  const name = countries.getName(code.toUpperCase(), "fr", { select: "official" });
  return name || code;
};

const AirportAdminTable = () => {
  const [airports, setAirports] = useState<AirportData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalAirports, setTotalAirports] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [airportToEdit, setAirportToEdit] = useState<AirportData | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [airportToDeleteId, setAirportToDeleteId] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchAirports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ 
        docs: AirportData[];
        totalDocs: number;
      }>('/api/airports', {
        params: {
          page: currentPage + 1,
          limit: rowsPerPage,
          search: debouncedSearchTerm
        }
      });
      setAirports(response.data.docs);
      setTotalAirports(response.data.totalDocs);
    } catch (err) {
      console.error("Erreur lors de la récupération des aéroports:", err);
      setError('Impossible de charger les données des aéroports. Veuillez réessayer.');
      setAirports([]);
      setTotalAirports(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchAirports();
  }, [fetchAirports]);

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

  const handleAddAirport = () => {
    setAirportToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditAirport = (airport: AirportData) => {
    setAirportToEdit(airport);
    setIsFormOpen(true);
  };

  const handleDeleteAirport = (airportId: string) => {
    setAirportToDeleteId(airportId);
    setConfirmationOpen(true);
  };

  const confirmDeleteAirport = async () => {
    if (!airportToDeleteId) return;

    setConfirmationOpen(false);

    try {
      await api.delete(`/api/airports/${airportToDeleteId}`);
      setSnackbar({ open: true, message: 'Aéroport supprimé avec succès !', severity: 'success' });
      fetchAirports();
    } catch (err) {
      console.error("Erreur lors de la suppression de l'aéroport:", err);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression de l\'aéroport.', severity: 'error' });
    } finally {
      setAirportToDeleteId(null);
    }
  };

  const handleSaveAirport = () => {
    fetchAirports();
    const message = airportToEdit ? 'Aéroport mis à jour avec succès !' : 'Aéroport ajouté avec succès !';
    setSnackbar({ open: true, message, severity: 'success' });
    setAirportToEdit(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setAirportToEdit(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(null);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mt: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', p: 2, gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Liste des Aéroports du monde
        </Typography>
        <TextField
          label="Rechercher (ICAO, Nom, Ville, Pays...)"
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
          onClick={handleAddAirport}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>ICAO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ville</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Pays</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {airports.length > 0 ? (
                  airports
                    .filter(Boolean)
                    .map((airport: AirportData, index) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={airport._id || airport.icao || index}>
                      <TableCell component="th" scope="row">
                        {airport.icao || 'N/A'}
                      </TableCell>
                      <TableCell>{airport.name || 'N/A'}</TableCell>
                      <TableCell>{airport.city || 'N/A'}</TableCell>
                      <TableCell>{airport.country ? getCountryName(airport.country) : 'N/A'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => handleEditAirport(airport)} disabled={!airport}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            onClick={() => airport._id && handleDeleteAirport(airport._id)} 
                            sx={{ color: 'error.main' }} 
                            disabled={!airport._id}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Aucun aéroport trouvé pour "{debouncedSearchTerm}"
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            count={totalAirports}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      <AirportFormDialog
        open={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveAirport}
        airportToEdit={airportToEdit}
      />
      
      <ConfirmDialog
        open={confirmationOpen}
        onClose={() => { setConfirmationOpen(false); setAirportToDeleteId(null); }}
        onConfirm={confirmDeleteAirport}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer cet aéroport ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        severity="error"
      />
      
      {snackbar && (
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
      )}
    </Paper>
  );
};

export default AirportAdminTable; 