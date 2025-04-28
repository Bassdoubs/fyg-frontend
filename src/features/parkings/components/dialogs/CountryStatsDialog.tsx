import React, { useState } from 'react';
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
  TextField,
  InputAdornment,
  Box,
  Chip,
  Typography,
  Paper,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon, Public as PublicIcon } from '@mui/icons-material';
import Flag from 'react-world-flags';
import { CountryStats } from '../../types';

interface CountryStatsDialogProps {
  open: boolean;
  onClose: () => void;
  countryStats: CountryStats[];
  totalCountries: number;
  onCountryClick: (country: CountryStats) => void;
}

export const CountryStatsDialog: React.FC<CountryStatsDialogProps> = ({
  open,
  onClose,
  countryStats,
  totalCountries,
  onCountryClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStats = countryStats.filter(stat =>
    stat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.2)',
          bgcolor: '#111827',
          color: '#d1d5db'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#374151',
        color: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <PublicIcon />
        Statistiques par pays ({totalCountries} pays)
      </DialogTitle>
      <DialogContent sx={{ p: 2, borderTop: '1px solid #374151', borderBottom: '1px solid #374151', bgcolor: '#1f2937' }}>
        <Paper elevation={0} sx={{ mb: 2, p: 1.5, bgcolor: '#111827' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher un pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#6b7280' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Effacer la recherche"
                    onClick={() => setSearchTerm('')}
                    edge="end"
                    size="small"
                    sx={{ color: '#6b7280' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                color: '#d1d5db',
                bgcolor: '#374151',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4b5563'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6b7280'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4f46e5'
                },
                input: {
                  '&::placeholder': {
                    color: '#9ca3af',
                    opacity: 1
                  }
                }
              }
            }}
          />
        </Paper>
        <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
          {filteredStats.length > 0 ? (
            filteredStats.map((stat) => (
              <ListItem 
                key={stat.primaryCode}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: '#1f2937',
                  border: '1px solid #374151',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: '#374151',
                    borderColor: '#4f46e5'
                  },
                  p: 1.5
                }}
                onClick={() => onCountryClick(stat)}
              >
                <ListItemAvatar sx={{ minWidth: 50 }}>
                  <Avatar sx={{ bgcolor: 'transparent', width: 40, height: 30, '& img': { borderRadius: '2px'} }}>
                    <Flag code={stat.primaryCode} height="30" />
                  </Avatar>
                </ListItemAvatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {stat.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({stat.count} aéroports)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {stat.codes.map((code: string) => (
                      <Chip
                        key={code}
                        label={code}
                        size="small"
                        sx={{ 
                          bgcolor: '#4b5563',
                          color: '#9ca3af',
                          fontSize: '0.75rem',
                          height: '20px',
                          '&:hover': {
                            bgcolor: '#6b7280'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="Aucun pays trouvé"
                secondary="Essayez de modifier votre recherche"
              />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#111827' }}>
        <Button 
          onClick={onClose} 
          startIcon={<CloseIcon />}
          variant="contained"
          color="primary"
          sx={{
            bgcolor: '#4f46e5',
            color: 'white',
            '&:hover': {
              bgcolor: '#4338ca'
            }
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 