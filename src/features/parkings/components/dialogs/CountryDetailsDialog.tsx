import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon, FlightTakeoff as FlightTakeoffIcon } from '@mui/icons-material';
import Flag from 'react-world-flags';
import { CountryStats } from '../../types';
import { AirportData, ParkingData } from '@bassdoubs/fyg-shared';
import api from '../../../../services/api';

interface CountryDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  country: CountryStats | null;
  airportsData: AirportData[];
}

export const CountryDetailsDialog: React.FC<CountryDetailsDialogProps> = ({
  open,
  onClose,
  country,
  airportsData
}) => {

  // State local pour les parkings et le chargement
  const [countrySpecificParkings, setCountrySpecificParkings] = useState<ParkingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les parkings spécifiques au pays quand le dialogue s'ouvre
  useEffect(() => {
    if (open && country && country.codes.length > 0) {
      const fetchCountryParkings = async () => {
        setIsLoading(true);
        setError(null);
        setCountrySpecificParkings([]); // Vider l'ancien état
        try {
          const codesString = country.codes.join(',');
          // Utiliser l'instance api et ajuster le chemin (sans /api)
          const response = await api.get<ParkingData[]>('/parkings/by-country', {
            params: { countryCodes: codesString }
          });
          // Ajout de la vérification : s'assurer que response.data est bien un tableau
          if (Array.isArray(response.data)) {
            setCountrySpecificParkings(response.data);
          } else {
            // Si ce n'est pas un tableau, logguer une erreur et garder/mettre un tableau vide
            console.error("Réponse API inattendue pour les parkings par pays (pas un tableau):", response.data);
            setCountrySpecificParkings([]); 
            setError("Données de parking invalides reçues."); // Optionnel: informer l'utilisateur
          }
        } catch (err) {
          console.error("Erreur lors du chargement des parkings pour le pays:", err);
          setError("Impossible de charger les parkings pour ce pays.");
          setCountrySpecificParkings([]); // Assurer que c'est un tableau en cas d'erreur
        } finally {
          setIsLoading(false);
        }
      };
      fetchCountryParkings();
    } else if (!open) {
      // Optionnel: nettoyer quand le dialogue se ferme
      setCountrySpecificParkings([]);
      setError(null);
    }
  }, [open, country]); // Dépend de l'ouverture et du pays sélectionné

  // Créer un Map pour un accès rapide aux aéroports par ICAO
  const airportsMap = useMemo(() => {
    // Vérifier si airportsData est bien un tableau avant d'itérer
    if (!Array.isArray(airportsData)) {
      // console.warn('[DetailsDialog] airportsData n\'est pas un tableau, impossible de créer la map.', airportsData);
      return new Map<string, AirportData>(); // Retourner une map vide
    }
    const map = new Map<string, AirportData>();
    airportsData.forEach(airport => {
      // Ajouter une vérification supplémentaire pour s'assurer que l'objet a bien icao
      if (airport && airport.icao) { 
        map.set(airport.icao, airport);
      }
    });
    // console.log(`[DetailsDialog] airportsMap créée avec ${map.size} entrées.`);
    return map;
  }, [airportsData]);

  // Utiliser les parkings locaux (ne plus filtrer ici)
  const countryParkings = countrySpecificParkings;

  // Groupement par aéroport
  const parkingsByAirport = useMemo(() => {
    if (!airportsMap || !Array.isArray(countryParkings)) return [];
    const grouped: { [airportICAO: string]: { name: string; parkings: ParkingData[] } } = {};
    countryParkings.forEach(p => {
      const currentAirportKey = p.airport;
      if (!grouped[currentAirportKey]) {
        const airportDetails = airportsMap.get(currentAirportKey);
        grouped[currentAirportKey] = {
          name: airportDetails?.name || currentAirportKey, 
          parkings: []
        };
      }
      if (grouped[currentAirportKey]) {
           grouped[currentAirportKey].parkings.push(p); 
      } 
    });
    const sortedGrouped = Object.entries(grouped).sort(([, a], [, b]) => a.name.localeCompare(b.name));
    return sortedGrouped;
  }, [countryParkings, airportsMap]);

  if (!country) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#111827', color: '#d1d5db', borderRadius: 2 } }}>
      <DialogTitle sx={{ bgcolor: '#374151', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'transparent', width: 40, height: 30, '& img': { borderRadius: '2px'} }}>
          <Flag code={country.primaryCode} height="30" />
        </Avatar>
        {country.name} ({country.count} aéroports référencés)
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
           {country.codes.map(code => <Chip key={code} label={code} size="small" sx={{ bgcolor: '#4b5563', color: '#9ca3af' }} />)}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ borderTop: '1px solid #374151', borderBottom: '1px solid #374151', bgcolor: '#1f2937', minHeight: 300 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress color="inherit" />
          </Box>
        )}
        {error && (
           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'error.main' }}>
             <Typography>{error}</Typography>
           </Box>
        )}
        {!isLoading && !error && parkingsByAirport.length > 0 ? (
          <List>
            {parkingsByAirport.map(([airportICAO, airportData]) => (
              <React.Fragment key={airportICAO}>
                <ListItem sx={{ pt: 2, pb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#4f46e5' }}>
                      <FlightTakeoffIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={airportICAO} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#4f46e5', // Couleur d'accentuation
                            color: '#e0e7ff',
                            fontSize: '0.7rem',
                            height: '18px',
                            lineHeight: '18px'
                          }} 
                        />
                        <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#a5b4fc' }}>
                          {airportData.name}
                        </Typography>
                      </Box>
                    }
                    secondary={`${airportData.parkings.length} parking(s) enregistré(s)`}
                    primaryTypographyProps={{ component: 'div' }} // Important pour permettre un Box comme primary
                    secondaryTypographyProps={{ color: '#9ca3af', mt: 0.5 }}
                  />
                </ListItem>
                <Divider sx={{ borderColor: '#374151', ml: 9 }} />
              </React.Fragment>
            ))}
          </List>
        ) : (!isLoading && !error &&
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun parking trouvé pour ce pays.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vérifiez que les parkings ont des codes ICAO valides et que l'API stats renvoie les bons préfixes.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#111827' }}>
        <Button onClick={onClose} startIcon={<CloseIcon />} variant="outlined" sx={{ color: '#9ca3af', borderColor: '#4b5563', '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' }}}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 