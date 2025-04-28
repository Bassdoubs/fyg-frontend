import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Input,
  Snackbar,
  Button,
  Collapse,
  Chip,
  Fade
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import FlightIcon from '@mui/icons-material/Flight'; // Icône par défaut
import WarningIcon from '@mui/icons-material/Warning'; // Icône pour l'avertissement
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Icône pour succès chargement
import api from '../../../services/api'; // Utiliser l'instance api configurée
// Utiliser AirlineData depuis @fyg/shared
import type { AirlineData } from '@bassdoubs/fyg-shared'; 

// Interface pour la réponse de la nouvelle API
interface ManagedAirlinesResponse {
  managedAirlines: AirlineData[]; // Utiliser AirlineData
  missingIcaos: string[];
}

const AirlineLogoManager: React.FC = () => {
  // États locaux pour gérer les données chargées via API
  const [managedAirlines, setManagedAirlines] = useState<AirlineData[]>([]); // Utiliser AirlineData
  const [missingIcaosList, setMissingIcaosList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [postLoadMessageVisible, setPostLoadMessageVisible] = useState(false);
  
  // États locaux
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{ id: string; message: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);
  const [showMissingList, setShowMissingList] = useState(false); // État pour afficher/masquer la liste

  // Effet pour charger les données depuis la nouvelle route API
  useEffect(() => {
    let isMounted = true; // Flag pour gérer le démontage
    const fetchManagedAirlines = async () => {
      // Reset états avant de charger
      setLoading(true);
      setError(null);
      setPostLoadMessageVisible(false); 
      
      try {
        const response = await api.get<ManagedAirlinesResponse>('/api/airlines/managed');
        if (isMounted) {
          setManagedAirlines(response.data.managedAirlines || []);
          setMissingIcaosList(response.data.missingIcaos || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Erreur lors de la récupération des compagnies gérables:", err);
          setError(err.message || 'Impossible de charger les données.');
          setManagedAirlines([]);
          setMissingIcaosList([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // Afficher le message de succès seulement si pas d'erreur
          if (!error) { 
            setPostLoadMessageVisible(true); 
          }
        }
      }
    };
    fetchManagedAirlines();

    // Cleanup function pour éviter les mises à jour sur composant démonté
    return () => { isMounted = false; };
  }, []); // Charger une seule fois au montage

  // Effet pour masquer le message de post-chargement après un délai
  useEffect(() => {
    if (postLoadMessageVisible) {
      const timer = setTimeout(() => {
        setPostLoadMessageVisible(false);
      }, 1500); // Masquer après 1.5 secondes
      return () => clearTimeout(timer); // Nettoyer le timer si le composant est démonté
    }
  }, [postLoadMessageVisible]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, airlineId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(airlineId);
    setUploadError(null);
    setSnackbar(null);

    const formData = new FormData();
    formData.append('logoFile', file);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      // Attendre AirlineData en retour
      const response = await api.put<AirlineData>(`/api/airlines/${airlineId}/logo`, formData, config);
      const updatedAirlineData = response.data;
      
      setManagedAirlines(currentAirlines => 
        currentAirlines.map(airline => 
          airline._id === airlineId ? updatedAirlineData : airline
        )
      );
      
      console.log('Upload réussi:', updatedAirlineData);
      // Utiliser updatedAirlineData qui est de type AirlineData
      setSnackbar({ open: true, message: `Logo pour ${updatedAirlineData?.icao || 'la compagnie'} mis à jour !`, severity: 'success' });

    } catch (err: any) {
      console.error(`Erreur lors de l'upload pour ${airlineId}:`, err);
      const message = err.response?.data?.message || 'Une erreur est survenue lors de l\'upload.';
      setUploadError({ id: airlineId, message });
      setSnackbar({ open: true, message: `Erreur upload: ${message}`, severity: 'error' });
    } finally {
      setIsUploading(null);
      if(event.target) {
        event.target.value = ''; 
      }
    }
  };

  const handleCloseSnackbar = () => {
      setSnackbar(null);
  };

  // Affichage principal
  return (
    <Box>
      {/* 1. Spinner amélioré pendant le chargement initial */}
      {loading && (
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column', // Aligner verticalement
            justifyContent: 'center',
            alignItems: 'center',
            p: 4, // Ajouter du padding
            minHeight: '200px' // Hauteur minimale pour centrer verticalement
          }}
        >
          <CircularProgress size={50} sx={{ mb: 2 }} /> {/* Taille augmentée et marge en bas */}
          <Typography variant="body1" color="text.secondary">
            Chargement des données logos...
          </Typography>
        </Box>
      )}

      {/* 2. Message d'erreur principal si le chargement a échoué */}
      {!loading && error && (
        <Alert severity="error">{error}</Alert>
      )}

      {/* 3. Contenu principal si pas de chargement et pas d'erreur */}
      {!loading && !error && (
        <>
          {/* Message de succès post-chargement (optionnel) */}
          <Fade in={postLoadMessageVisible} timeout={300}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, color: 'success.main' }}>
                <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Données chargées !</Typography>
              </Box>
          </Fade>

          <Typography variant="h6" gutterBottom>
            Gestion des Logos ({managedAirlines.length} compagnies gérables)
          </Typography>

          {/* Section pour les compagnies manquantes - utilise missingIcaosList */}
          {missingIcaosList.length > 0 && (
            <Box sx={{ mb: 2, p: 1.5, border: '1px solid', borderColor: 'warning.light', borderRadius: 1, bgcolor: 'warning.lighter' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="body2" color="warning.dark">
                    Attention : {missingIcaosList.length} compagnie(s) référencée(s) dans les parkings sont manquantes dans la base Airlines.
                  </Typography>
                </Box>
                <Button 
                  size="small"
                  onClick={() => setShowMissingList(!showMissingList)} 
                  endIcon={showMissingList ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {showMissingList ? 'Masquer' : 'Afficher'} la liste
                </Button>
              </Box>
              <Collapse in={showMissingList}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, pl: 4 }}>
                  {missingIcaosList.map(icao => (
                    <Chip key={icao} label={icao} size="small" />
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Liste des compagnies gérables - Itérer sur managedAirlines */}
          {managedAirlines.length > 0 ? (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {managedAirlines.map((airline) => (
                <ListItem 
                  key={airline._id} 
                  divider 
                  secondaryAction={
                     <label htmlFor={`upload-logo-${airline._id}`}>
                      <Input
                        id={`upload-logo-${airline._id}`}
                        type="file"
                        inputProps={{ 
                          accept: "image/*",
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, airline._id)
                        }}
                        sx={{ display: 'none' }}
                        disabled={isUploading === airline._id}
                      />
                      <IconButton component="span" color="primary" aria-label="Modifier le logo" disabled={isUploading === airline._id}>
                        {isUploading === airline._id ? <CircularProgress size={24} /> : <EditIcon />}
                      </IconButton>
                    </label>
                  }
                >
                   <ListItemAvatar>
                    <Avatar src={airline.logoUrl || undefined} variant="rounded">
                      {!airline.logoUrl && <FlightIcon />} 
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={airline.icao}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Typography component="span" variant="body1">
                           {airline.name}
                        </Typography>
                      </Box>
                    }
                    secondary={airline.country || 'Pays non spécifié'} 
                  />
                   {/* Vérifier que uploadError existe avant d'afficher l'alerte */}
                   {uploadError && uploadError.id === airline._id && (
                    <Alert severity="error" sx={{ ml: 2, flexShrink: 1, fontSize: '0.8rem', padding: '2px 8px' }} 
                           onClose={() => setUploadError(null)}
                    >
                      {uploadError.message} 
                    </Alert>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <ListItem>
                <ListItemText primary="Aucune compagnie gérable trouvée (vérifiez les données des parkings et des compagnies)." />
            </ListItem>
          )}
        </>
      )}
      
      {/* Snackbar */} 
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
    </Box>
  );
};

export default AirlineLogoManager; 