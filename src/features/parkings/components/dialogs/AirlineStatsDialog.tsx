import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  CircularProgress, 
  Typography, 
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Chip,
  ListItemButton,
  ListItemAvatar,
  Pagination
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, Flight as FlightIcon } from '@mui/icons-material';
import { Airline, ProcessedAirline } from '../../types'; // Importer ProcessedAirline
import countries from "i18n-iso-countries";
import frLocale from "i18n-iso-countries/langs/fr.json";

// Enregistrer la locale si ce n'est pas déjà fait globalement
try {
  countries.registerLocale(frLocale);
} catch (e) { 
  console.warn("Locale 'fr' peut-être déjà enregistrée pour i18n-iso-countries.");
}

interface AirlineStatsDialogProps {
  open: boolean;
  onClose: () => void;
  airlinesData: ProcessedAirline[];
  isLoading: boolean;
  onAirlineClick: (airline: ProcessedAirline) => void;
}

export const AirlineStatsDialog: React.FC<AirlineStatsDialogProps> = ({
  open,
  onClose,
  airlinesData = [], // Valeur par défaut pour éviter les erreurs si undefined
  isLoading,
  onAirlineClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 15; // Nombre de compagnies par page

  const filteredAndSortedAirlines = useMemo(() => {
    if (!airlinesData) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    
    let filtered = airlinesData;
    if (lowerCaseSearchTerm) {
      const icaoRegex = /^[A-Z]{3}$/i;
      if (icaoRegex.test(lowerCaseSearchTerm)) {
          filtered = airlinesData.filter(a => a.icao.toLowerCase() === lowerCaseSearchTerm);
      } else {
          filtered = airlinesData.filter(a => 
              a.name.toLowerCase().includes(lowerCaseSearchTerm) ||
              (a.callsign && a.callsign.toLowerCase().includes(lowerCaseSearchTerm)) ||
              a.country.toLowerCase().includes(lowerCaseSearchTerm)
          );
      }
    }
    
    // Ajouter le tri par nom ici, après le filtrage
    return filtered.sort((a, b) => a.name.localeCompare(b.name));

  }, [airlinesData, searchTerm]);

  // Réinitialiser la page quand le filtre change
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Calcul pour la pagination sur la liste filtrée ET triée
  const count = Math.ceil(filteredAndSortedAirlines.length / rowsPerPage);
  const paginatedAirlines = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    // Appliquer la pagination sur la liste déjà filtrée et triée
    return filteredAndSortedAirlines.slice(start, end);
  }, [filteredAndSortedAirlines, page, rowsPerPage]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md" // Un peu plus large que sm
      PaperProps={{ sx: { height: '85vh', bgcolor: '#111827', color: '#d1d5db' } }}
    >
      <DialogTitle sx={{ bgcolor: '#374151', color: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <FlightIcon /> {/* Icône différente pour ce dialogue */} 
           <Typography variant="h6" component="div">Compagnies Aériennes (Présentes dans les Parkings)</Typography>
        </Box>
        {/* Barre de recherche */} 
        <TextField
          variant="outlined"
          size="small"
          placeholder="Rechercher (Nom, ICAO, Callsign, Pays)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            width: '250px',
            '& .MuiInputBase-root': { backgroundColor: 'rgba(17, 24, 39, 0.5)', borderRadius: 1 },
            input: { color: '#e5e7eb' }, 
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#4b5563' },
              '&:hover fieldset': { borderColor: '#6b7280' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
            },
            '& .MuiInputAdornment-root': { color: '#9ca3af' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small"/>
              </InputAdornment>
            ),
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 2, backgroundColor: '#1f2937' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress color="inherit" />
          </Box>
        ) : paginatedAirlines.length > 0 ? (
          <List dense sx={{ width: '100%', bgcolor: 'transparent' }}>
            {paginatedAirlines.map((airline, index) => (
              <React.Fragment key={airline.icao || index}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }} 
                  onClick={() => onAirlineClick(airline)}
                >
                  <ListItemAvatar sx={{ minWidth: 56, mr: 2, mt: 0.5 }}>
                     {/* Affichage du logo via le nouveau composant */}
                     <Avatar sx={{ width: 40, height: 40, bgcolor: airline.logoUrl ? 'transparent' : '#eeeeee' /* Gris clair */ }}>
                       {airline.logoUrl ? (
                         <img
                           src={airline.logoUrl} // Utiliser l'URL directe de Cloudinary
                           alt={`${airline.name} logo`}
                           style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                           onError={(e) => {
                             // Fallback très simple si l'URL Cloudinary est cassée
                             e.currentTarget.style.display = 'none';
                             const parent = e.currentTarget.parentElement;
                             if(parent && !parent.querySelector('.MuiSvgIcon-root')) {
                                const icon = document.createElement('span');
                                icon.innerHTML = '?'; // Ou insérer l'icône SVG si possible
                                parent.appendChild(icon);
                             }
                           }}
                         />
                       ) : (
                         <FlightIcon sx={{ color: '#757575' /* Gris moyen */ }} />
                       )}
                     </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={airline.icao} 
                          size="small" 
                          sx={{ bgcolor: '#a855f7', color: '#f3e8ff', fontWeight: 'medium' }} // Couleur violette pour ICAO
                         />
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{airline.name}</Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" sx={{ display: 'block', color: '#9ca3af' }}>
                          Pays: {countries.getName(airline.country, "fr", { select: "official" }) || airline.country}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                    sx={{ color: '#d1d5db', mt: 0.5 }}
                  />
                </ListItem>
                {index < paginatedAirlines.length - 1 && <Divider component="li" sx={{ borderColor: 'rgba(75, 85, 99, 0.5)' }}/>}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography sx={{ textAlign: 'center', mt: 4, color: '#9ca3af' }}>
            {searchTerm ? 'Aucune compagnie ne correspond à votre recherche.' : 'Aucune donnée de compagnie à afficher.'}
          </Typography>
        )}
      </DialogContent>

      {paginatedAirlines.length > 0 && (
        <DialogActions sx={{ bgcolor: '#374151', borderTop: '1px solid #4b5563', p: 1, justifyContent: 'center' }}>
          <Pagination 
            count={count} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            sx={{ 
                '& .MuiPaginationItem-root': {
                  color: '#d1d5db' // Couleur du texte des numéros
                },
                '& .MuiPaginationItem-icon': {
                  color: '#9ca3af' // Couleur des flèches
                },
                '& .MuiPaginationItem-root.Mui-selected': {
                  backgroundColor: '#3b82f6', // Bleu pour l'élément sélectionné
                  color: '#ffffff'
                }
            }}
          />
        </DialogActions>
      )}
    </Dialog>
  );
}; 