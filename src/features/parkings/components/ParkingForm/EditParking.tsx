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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { Airport, ParkingType, ParkingTypeOption } from '../../../types';
import { useEditParking } from '../../../hooks/useEditParking';
import type { ParkingData } from '@bassdoubs/fyg-shared';
import { useDarkMode } from '../../../../hooks/useDarkMode';

interface EditParkingProps {
  open: boolean;
  onClose: () => void;
  parking: ParkingData;
  onSubmit: (id: string, parkingData: Partial<Omit<ParkingData, '_id'>>) => Promise<void>;
}

export const EditParking = ({ open, onClose, parking, onSubmit }: EditParkingProps) => {
  const { isDarkMode } = useDarkMode();

  const [formData, setFormData] = useState({
    airline: '',
    airport: '',
    terminal: '',
    porte: '',
    hasMap: false,
    mapUrl: '',
    source: ''
  });
  
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

  useEffect(() => {
    if (parking) {
      setFormData({
        airline: parking.airline || '',
        airport: parking.airport || '',
        terminal: parking.gate?.terminal || '',
        porte: parking.gate?.porte || '',
        hasMap: parking.mapInfo?.hasMap || false,
        mapUrl: parking.mapInfo?.mapUrl || '',
        source: parking.mapInfo?.source || ''
      });
    }
  }, [parking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedParking = {
      airline: formData.airline,
      airport: formData.airport,
      gate: {
        terminal: formData.terminal,
        porte: formData.porte
      },
      mapInfo: {
        hasMap: formData.hasMap,
        mapUrl: formData.mapUrl,
        source: formData.source
      }
    };

    try {
      await onSubmit(parking._id, updatedParking);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
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
      <DialogTitle className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        Modifier un parking
      </DialogTitle>
      <form onSubmit={handleSubmit} className="py-4">
        <DialogContent className="space-y-4 !pt-6">
          <TextField
            autoFocus
            margin="dense"
            label="Compagnie aérienne"
            fullWidth
            value={formData.airline}
            onChange={(e) => setFormData({ ...formData, airline: e.target.value.toUpperCase() })}
            disabled
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
            disabled
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
            Enregistrer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 