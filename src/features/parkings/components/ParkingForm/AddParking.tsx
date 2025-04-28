import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  FormControlLabel,
  Switch,
  Typography,
  Collapse
} from '@mui/material';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import LinkIcon from '@mui/icons-material/Link';
import SourceIcon from '@mui/icons-material/Source';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { Airport, ParkingType, ParkingTypeOption } from '../../../types';
import { useAddParking } from '../../../hooks/useAddParking';
import type { ParkingData } from '@bassdoubs/fyg-shared';
import { useDarkMode } from '../../../../hooks/useDarkMode';

interface AddParkingProps {
  open: boolean;
  onClose: () => void;
  defaultAirport?: string;
  onSubmit: (parking: Omit<ParkingData, '_id'>) => Promise<void>;
  initialData?: {
    airline?: string;
    airport?: string;
    terminal?: string;
    porte?: string;
  };
}

export const AddParking = ({ open, onClose, defaultAirport, onSubmit, initialData }: AddParkingProps) => {
  const { isDarkMode } = useDarkMode();

  // Utiliser initialData pour pré-remplir
  const prefilledAirport = initialData?.airport;

  const [formData, setFormData] = useState({
    airline: initialData?.airline || '',
    airport: prefilledAirport || '', // Utiliser la valeur pré-remplie
    terminal: initialData?.terminal || '',
    porte: initialData?.porte || '',
    hasMap: false,
    mapUrl: '',
    source: ''
  });
  
  // Réinitialiser le formulaire quand initialData change (si ouvert)
  useEffect(() => {
    if(open) {
        setFormData({
          airline: initialData?.airline || '',
          airport: initialData?.airport || '', // Mettre à jour avec initialData
          terminal: initialData?.terminal || '',
          porte: initialData?.porte || '',
          hasMap: false,
          mapUrl: '',
          source: ''
        });
    }
  }, [open, initialData]);
  
  // Fonction pour valider l'URL de carte
  const isValidMapUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return url.includes('maps.google.com') || 
             url.includes('goo.gl/maps') || 
             url.includes('maps.app.goo.gl');
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // === Log de débogage simple au submit ===
    console.log("[AddParking handleSubmit] Formulaire soumis. Données:", JSON.stringify(formData, null, 2));
    // ======================================
    // Rétablir l'appel à onSubmit
    await onSubmit({
      airline: formData.airline,
      airport: formData.airport,
      gate: {
        terminal: formData.terminal,
        porte: formData.porte
      },
      // Envoyer mapInfo conditionnellement
      mapInfo: formData.hasMap ? {
        hasMap: true,
        mapUrl: formData.mapUrl,
        source: formData.source
      } : {
        hasMap: false,
        mapUrl: undefined,
        source: undefined
      },
      // Ajouter createdAt/updatedAt pour satisfaire le type Omit<ParkingData, '_id'>
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className={isDarkMode ? 'dark' : ''}
      PaperProps={{
        className: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
      }}
    >
      <DialogTitle className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20">
        Ajouter un parking
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4 !pt-6">
          <TextField
            autoFocus
            margin="dense"
            label="Compagnie aérienne"
            fullWidth
            value={formData.airline}
            onChange={(e) => setFormData({ ...formData, airline: e.target.value.toUpperCase() })}
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AirplaneTicketIcon className="text-brand-500 dark:text-brand-400" />
                </InputAdornment>
              ),
              className: "rounded-lg"
            }}
            InputLabelProps={{
              className: "dark:text-gray-300"
            }}
          />
          <TextField
            label="Aéroport"
            fullWidth
            value={formData.airport}
            onChange={(e) => setFormData({ ...formData, airport: e.target.value.toUpperCase() })}
            disabled={!!prefilledAirport} // Désactiver si pré-rempli
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon className="text-brand-500 dark:text-brand-400" />
                </InputAdornment>
              ),
              className: "rounded-lg"
            }}
            InputLabelProps={{
              className: "dark:text-gray-300"
            }}
          />
          <TextField
            label="Terminal"
            fullWidth
            value={formData.terminal}
            onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AirplanemodeActiveIcon className="text-brand-500 dark:text-brand-400" />
                </InputAdornment>
              ),
              className: "rounded-lg"
            }}
            InputLabelProps={{
              className: "dark:text-gray-300"
            }}
          />
          <TextField
            label="Porte"
            fullWidth
            value={formData.porte}
            onChange={(e) => setFormData({ ...formData, porte: e.target.value })}
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DoorFrontIcon className="text-brand-500 dark:text-brand-400" />
                </InputAdornment>
              ),
              className: "rounded-lg"
            }}
            InputLabelProps={{
              className: "dark:text-gray-300"
            }}
          />
          
          {/* New Map section */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Typography variant="subtitle1" className="text-gray-700 dark:text-gray-300 mb-2">
              Informations de carte
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasMap}
                  onChange={(e) => setFormData({ ...formData, hasMap: e.target.checked })}
                  color="primary"
                />
              }
              label="Ce parking a une carte"
              className="mb-2 dark:text-gray-300"
            />
            
            <Collapse in={formData.hasMap}>
              <div className="space-y-4 mt-2">
                <TextField
                  label="URL de la carte (Google Maps, etc.)"
                  fullWidth
                  value={formData.mapUrl}
                  onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  placeholder="https://maps.app.goo.gl/example"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon className="text-brand-500 dark:text-brand-400" />
                      </InputAdornment>
                    ),
                    className: "rounded-lg"
                  }}
                  InputLabelProps={{
                    className: "dark:text-gray-300"
                  }}
                  error={formData.mapUrl !== '' && !isValidMapUrl(formData.mapUrl)}
                  helperText={formData.mapUrl !== '' && !isValidMapUrl(formData.mapUrl) ? 'URL de carte invalide' : ''}
                />
                <TextField
                  label="Source de la carte"
                  fullWidth
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  placeholder="Google Maps, OpenStreetMap, etc."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SourceIcon className="text-brand-500 dark:text-brand-400" />
                      </InputAdornment>
                    ),
                    className: "rounded-lg"
                  }}
                  InputLabelProps={{
                    className: "dark:text-gray-300"
                  }}
                />
              </div>
            </Collapse>
          </div>
        </DialogContent>
        <DialogActions className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 p-4">
          <Button 
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300"
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmit}
            className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            Ajouter
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 