import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  Divider,
  CircularProgress // Peut-être pas nécessaire si on reçoit les données directement
} from '@mui/material';
import { Close as CloseIcon, FlightTakeoff as FlightTakeoffIcon, Business as BusinessIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ParkingData, AirlineData, AirportData } from '@bassdoubs/fyg-shared';
import countries from "i18n-iso-countries";
import frLocale from "i18n-iso-countries/langs/fr.json";

interface AirlineDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  airline: AirlineData | null;
  parkings: ParkingData[];
  airportsData: AirportData[];
}

export const AirlineDetailsDialog: React.FC<AirlineDetailsDialogProps> = ({ 
  open, 
  onClose, 
  airline,
  parkings,
  airportsData 
}) => {
  
  // Créer un Map pour un accès rapide aux aéroports par ICAO
  const airportsMap = useMemo(() => {
    if (!Array.isArray(airportsData)) {
      return new Map<string, AirportData>();
    }
    const map = new Map<string, AirportData>();
    airportsData.forEach(airport => {
      if (airport && airport.icao) { 
        map.set(airport.icao, airport);
      }
    });
    return map;
  }, [airportsData]);

  // Filtrer les parkings pour cette compagnie
  const airlineParkings = useMemo(() => {
    return parkings.filter(p => p.airline === airline?.icao);
  }, [parkings, airline]);

  // Calculer les aéroports desservis par cette compagnie (basé sur les parkings)
  const servedAirports = useMemo(() => {
    const icaoSet = new Set(airlineParkings.map(p => p.airport));
    return Array.from(icaoSet)
      .map(icao => airportsMap.get(icao)) // Récupérer AirportData depuis la map
      .filter((airport): airport is AirportData => !!airport) // Filtrer les undefined et typer correctement
      .sort((a, b) => a.name.localeCompare(b.name)); // Trier par nom
  }, [airlineParkings, airportsMap]);

  // Calculer le nombre total de parkings pour cette compagnie
  const parkingCount = airlineParkings.length;

  if (!airline) return null;

  const countryName = countries.getName(airline.country, "fr", { select: "official" }) || airline.country;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#111827', color: '#d1d5db', borderRadius: 2 } }}>
      <DialogTitle sx={{ bgcolor: '#374151', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 1.5 }}>
         <Avatar
            variant="rounded"
            sx={{ width: 40, height: 40, bgcolor: airline.logoUrl ? 'transparent' : '#4b5563' }}
          >
           {airline.logoUrl ? (
              <img
                src={airline.logoUrl}
                alt={`${airline.name} logo`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if(parent && !parent.querySelector('.MuiSvgIcon-root')) {
                       const iconPlaceholder = document.createElement('div');
                       iconPlaceholder.innerHTML = '<span style="color:#9ca3af">?</span>'; 
                       parent.appendChild(iconPlaceholder);
                    }
                }}
              />
           ) : (
              <BusinessIcon sx={{ color: '#9ca3af' }} />
           )}
         </Avatar>
        <Box>
          <Typography variant="h6">{airline.name}</Typography>
           <Typography variant="caption" sx={{ color: '#9ca3af' }}>
             {airline.icao} - {countryName}
           </Typography>
        </Box>
        {airline.callsign && (
            <Chip label={`Callsign: ${airline.callsign}`} size="small" sx={{ ml: 'auto', bgcolor: '#4b5563', color: '#9ca3af' }} />
        )}
      </DialogTitle>
      <DialogContent sx={{ borderTop: '1px solid #374151', borderBottom: '1px solid #374151', bgcolor: '#1f2937', minHeight: 300 }}>
         <Box sx={{ p: 2 }}>
             <Typography variant="h6" gutterBottom sx={{ color: '#a5b4fc' }}>
                 Parkings enregistrés : {parkingCount}
             </Typography>
             <Typography variant="subtitle1" sx={{ mb: 1, color: '#e5e7eb' }}>
                 Aéroports desservis (selon les données de parkings) :
             </Typography>
             {servedAirports.length > 0 ? (
               <List dense disablePadding>
                 {servedAirports.map(airport => (
                   <ListItem key={airport.icao} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                         <Chip 
                            label={airport.icao} 
                            size="small" 
                            icon={<FlightTakeoffIcon sx={{ fontSize: 14, ml: 0.5 }}/>} 
                            sx={{ bgcolor: '#4f46e5', color: '#e0e7ff' }} 
                          />
                      </ListItemIcon>
                      <ListItemText 
                        primary={airport.name}
                        secondary={
                          <Typography component="span" variant="body2" color="text.secondary">
                            {airport.icao} - {airport.city || 'Ville inconnue'}, {countryName}
                          </Typography>
                        }
                      />
                    </ListItem>
                 ))}
               </List>
             ) : (
               <Typography color="text.secondary">Aucun aéroport desservi trouvé dans les données de parkings.</Typography>
             )}
         </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#111827' }}>
        <Button onClick={onClose} startIcon={<CloseIcon />} variant="outlined" sx={{ color: '#9ca3af', borderColor: '#4b5563', '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' } }}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 