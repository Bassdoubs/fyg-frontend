import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Avatar, // Pour prévisualiser le logo
  Box,
  Typography
} from '@mui/material';
import { AirlineData } from '@bassdoubs/fyg-shared'; // <-- Importer depuis shared
import axios from 'axios';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Icône pour bouton upload
import api from '../../../services/api';

// Interface pour les données du formulaire
interface AirlineFormData {
  icao: string;
  name: string;
  callsign?: string;
  country?: string;
  logoUrl?: string; // Champ pour l'URL du logo
}

// Utiliser directement le type AirlineData au lieu de créer une extension
// interface AirlineWithMongoId extends AirlineData {
//     _id?: string;
//     logoUrl?: string;
// }

interface AirlineFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (airline: AirlineData) => void; // <-- Utiliser AirlineData
  airlineToEdit?: AirlineData | null; // <-- Utiliser AirlineData
}

export const AirlineFormDialog: React.FC<AirlineFormDialogProps> = ({
  open,
  onClose,
  onSave,
  airlineToEdit
}) => {
  const [formData, setFormData] = useState<AirlineFormData>({ 
    icao: '',
    name: '',
    callsign: '',
    country: '',
    logoUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Réf pour le champ file caché

  // Pré-remplir ou réinitialiser le formulaire
  useEffect(() => {
    if (airlineToEdit) {
      setFormData({
        icao: airlineToEdit.icao || '',
        name: airlineToEdit.name || '',
        callsign: airlineToEdit.callsign || '',
        country: airlineToEdit.country || '',
        logoUrl: airlineToEdit.logoUrl || undefined
      });
      // Afficher l'aperçu du logo existant
      setPreviewUrl(airlineToEdit.logoUrl || null); 
      setSelectedFile(null); // Reset fichier sélectionné si on édite
    } else {
      setFormData({ icao: '', name: '', callsign: '', country: '', logoUrl: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setError(null);
  }, [airlineToEdit, open]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gérer la sélection de fichier
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      // Créer une URL locale pour l'aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      }
      reader.readAsDataURL(file);
    } else {
      // Si aucun fichier n'est sélectionné (ou annulé), réinitialiser
      setSelectedFile(null);
      // Garder l'aperçu du logo existant si on est en mode édition
      setPreviewUrl(airlineToEdit?.logoUrl || null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    // Utiliser FormData pour envoyer les données et le fichier
    const formDataToSend = new FormData();
    formDataToSend.append('icao', formData.icao.toUpperCase());
    formDataToSend.append('name', formData.name);
    if (formData.callsign) formDataToSend.append('callsign', formData.callsign);
    if (formData.country) formDataToSend.append('country', formData.country.toUpperCase());
    
    // Si un fichier a été sélectionné, l'ajouter
    if (selectedFile) {
      formDataToSend.append('logoImage', selectedFile);
    } else if (formData.logoUrl === '') {
        // Si aucun fichier n'est sélectionné ET que l'URL dans le state est vide 
        // (signifie que l'utilisateur veut supprimer le logo existant sans en upload un nouveau)
        // On envoie une chaîne vide pour que le backend supprime le logoUrl
        formDataToSend.append('logoUrl', '');
    }
    // Si aucun fichier sélectionné et formData.logoUrl n'est pas vide, on n'envoie rien 
    // concernant le logo, le backend ne le modifiera pas.

    try {
      let response;
      const airlineId = airlineToEdit?._id; // Utiliser l'ID de la Airline

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (airlineId) {
        response = await api.put<AirlineData>( // Attendre Airline ici
          `/api/airlines/${airlineId}`, // Ajouter /api
          formDataToSend,
          config
        );
      } else {
        response = await api.post<AirlineData>( // Attendre Airline ici
          '/api/airlines', // Ajouter /api
          formDataToSend,
          config
        );
      }
      
      // Assurer que response.data a un _id, même si le backend ne le retourne pas toujours (par ex. sur PUT)
      // Normalement, le backend devrait retourner l'objet complet mis à jour.
      const savedData = { ...response.data, _id: response.data._id || airlineId }; 
      onSave(savedData as AirlineData); // Cast si nécessaire, mais idéalement le backend retourne le bon type
      onClose();

    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde de la compagnie:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.message || 'Une erreur est survenue lors de la sauvegarde.');
      } else {
        setError('Une erreur réseau ou inconnue est survenue.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Effet pour nettoyer l'URL d'aperçu créée avec createObjectURL
  useEffect(() => {
    // S'assurer que previewUrl est une URL blob avant de la révoquer
    let objectUrl: string | null = null;
    if (selectedFile && previewUrl && previewUrl.startsWith('blob:')) {
        objectUrl = previewUrl;
    }
    // Fonction de nettoyage
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        // console.log("Revoked blob URL:", objectUrl);
      }
    };
  }, [previewUrl, selectedFile]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{airlineToEdit ? 'Modifier la Compagnie' : 'Ajouter une Compagnie'}</DialogTitle>
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
                label="Code ICAO (3 lettres)"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.icao}
                onChange={handleChange}
                inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                disabled={!!airlineToEdit} // ICAO non modifiable
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                required
                margin="dense"
                id="name"
                name="name"
                label="Nom de la compagnie"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            {/* Ligne 2: Indicatif, Pays */}
            <Grid item xs={12} sm={7}>
              <TextField
                margin="dense"
                id="callsign"
                name="callsign"
                label="Indicatif d'appel (Callsign)"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.callsign}
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
            {/* Ligne 3: Upload Logo + Preview */}
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
               {/* Bouton stylisé pour déclencher l'input file */}
               <Button
                 variant="outlined"
                 component="label" // Fait que le bouton agit comme un label pour l'input caché
                 startIcon={<CloudUploadIcon />}
               >
                 Choisir Logo
                 <input 
                   type="file" 
                   hidden // Cache l'input file par défaut
                   accept="image/*" // N'accepte que les images
                   onChange={handleFileChange} 
                   ref={fileInputRef} // Référence si on veut le reset programmatiquement
                 />
               </Button>
               {/* Affichage du nom du fichier sélectionné ou message */}
               <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                 {selectedFile ? selectedFile.name : (airlineToEdit?.logoUrl ? 'Logo actuel' : 'Aucun logo sélectionné')}
               </Typography>
               {/* Aperçu */}
               <Box>
                 <Avatar 
                   // Utiliser previewUrl pour l'aperçu local, ou l'URL existante
                   src={previewUrl || undefined} 
                   alt="Logo Preview" 
                   sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}
                 >
                   {/* Afficher icône seulement si pas d'aperçu et pas de logo existant */}
                   {!previewUrl && <BrokenImageIcon fontSize="medium" />} 
                 </Avatar>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} color="inherit">Annuler</Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : (airlineToEdit ? 'Mettre à jour' : 'Ajouter')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 