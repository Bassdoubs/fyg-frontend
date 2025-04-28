import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { AirportData } from '@bassdoubs/fyg-shared';
import api from '../../../services/api';
import axios from 'axios';

// Définir une interface pour les props du formulaire
interface AirportFormData {
  icao: string;
  name: string;
  city?: string;
  country?: string;
  latitude?: number | string; // Accepter string pour l'input, convertir ensuite
  longitude?: number | string;
  elevation?: number | string;
  timezone?: string;
}

interface AirportFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (savedAirport: AirportData) => void; // Callback après sauvegarde réussie
  airportToEdit?: AirportData | null; // Optionnel: pour la modification future
}

export const AirportFormDialog: React.FC<AirportFormDialogProps> = ({
  open,
  onClose,
  onSave,
  airportToEdit
}) => {
  const [formData, setFormData] = useState<AirportFormData>({ // État initial vide ou pré-rempli
    icao: '',
    name: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    elevation: '',
    timezone: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplir le formulaire si on édite (sera utilisé plus tard)
  useEffect(() => {
    if (airportToEdit) {
      setFormData({
        icao: airportToEdit.icao,
        name: airportToEdit.name,
        city: airportToEdit.city || '',
        country: airportToEdit.country || '',
        latitude: airportToEdit.latitude?.toString() || '',
        longitude: airportToEdit.longitude?.toString() || '',
        elevation: airportToEdit.elevation?.toString() || '',
        timezone: airportToEdit.timezone || ''
      });
    } else {
      // Réinitialiser si on ouvre pour ajout
      setFormData({ icao: '', name: '', city: '', country: '', latitude: '', longitude: '', elevation: '', timezone: '' });
    }
    setError(null); // Reset error on open/edit change
  }, [airportToEdit, open]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    // Préparer les données à envoyer (convertir nombres, nettoyer)
    const dataToSend: Partial<AirportFormData> = {
      ...formData,
      icao: formData.icao.toUpperCase(), // Assurer ICAO en majuscule
      country: formData.country?.toUpperCase(), // Assurer code pays en majuscule
      latitude: formData.latitude !== '' ? Number(formData.latitude) : undefined,
      longitude: formData.longitude !== '' ? Number(formData.longitude) : undefined,
      elevation: formData.elevation !== '' ? Number(formData.elevation) : undefined,
    };

    // Supprimer les clés avec des valeurs undefined pour éviter les erreurs
    Object.keys(dataToSend).forEach(key => 
      (dataToSend as any)[key] === undefined && delete (dataToSend as any)[key]
    );

    try {
      let response;
      if (airportToEdit) {
        // Utiliser _id qui est dans AirportData, plus besoin de cast
        const airportId = airportToEdit._id;
        if (!airportId) {
          throw new Error("ID de l'aéroport manquant pour la mise à jour.");
        }
        // Utiliser api et attendre AirportData en retour
        response = await api.put<AirportData>(
          `/api/airports/${airportId}`, // Ajouter /api
          dataToSend
        );
      } else {
        // Utiliser api et attendre AirportData en retour
        response = await api.post<AirportData>('/api/airports', dataToSend); // Ajouter /api
      }

      // Utiliser AirportData
      onSave(response.data);
      onClose(); // Fermer le dialogue

    } catch (err: any) {
      // Amélioration du log d'erreur
      const apiError = axios.isAxiosError(err) ? err : null; // Garder axios ici pour isAxiosError
      const method = airportToEdit ? 'PUT' : 'POST';
      // Ajouter /api au chemin loggué
      const url = airportToEdit ? `/api/airports/${airportToEdit._id}` : '/api/airports';
      console.error(`Erreur lors de la sauvegarde de l'aéroport (Méthode: ${method}, URL: ${url}):`, {
        errorMessage: apiError?.message,
        response: apiError?.response?.data,
        requestData: dataToSend, // Log des données envoyées (peut être utile)
        errorObject: err // Log de l'objet d'erreur complet
      });

      if (apiError && apiError.response) {
        // Tenter d'extraire un message d'erreur plus précis de l'API
        setError(apiError.response.data?.message || 'Une erreur est survenue lors de la sauvegarde.');
      } else {
        setError('Une erreur réseau ou inconnue est survenue.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{airportToEdit ? 'Modifier l\'Aéroport' : 'Ajouter un Aéroport'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            {/* Ligne 1: ICAO, Nom */}
            <Grid item xs={12} sm={4}>
              <TextField
                required
                margin="dense"
                id="icao"
                name="icao"
                label="Code ICAO (4 lettres)"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.icao}
                onChange={handleChange}
                inputProps={{ maxLength: 4, style: { textTransform: 'uppercase' } }}
                disabled={!!airportToEdit} // ICAO non modifiable pour l'instant
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                required
                margin="dense"
                id="name"
                name="name"
                label="Nom de l'aéroport"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            {/* Ligne 2: Ville, Pays */}
            <Grid item xs={12} sm={7}>
              <TextField
                margin="dense"
                id="city"
                name="city"
                label="Ville"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                margin="dense"
                id="country"
                name="country"
                label="Code Pays (2 lettres)"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.country}
                onChange={handleChange}
                inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
              />
            </Grid>
             {/* Ligne 3: Latitude, Longitude */}
             <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="latitude"
                name="latitude"
                label="Latitude (ex: 48.8566)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.latitude}
                onChange={handleChange}
                inputProps={{ step: "any" }} // Permet les décimales
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="longitude"
                name="longitude"
                label="Longitude (ex: 2.3522)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.longitude}
                onChange={handleChange}
                inputProps={{ step: "any" }}
              />
            </Grid>
             {/* Ligne 4: Elevation, Timezone */}
             <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="elevation"
                name="elevation"
                label="Élévation (mètres)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.elevation}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="timezone"
                name="timezone"
                label="Timezone (ex: Europe/Paris)"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.timezone}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} color="inherit">Annuler</Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : (airportToEdit ? 'Mettre à jour' : 'Ajouter')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 