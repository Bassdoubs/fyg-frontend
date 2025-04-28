import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ParkingData } from '@bassdoubs/fyg-shared';

interface ParkingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (parking: Partial<ParkingData>) => void;
  parking?: ParkingData;
  airlines: string[];
  airports: string[];
}

export const ParkingForm: React.FC<ParkingFormProps> = ({
  open,
  onClose,
  onSubmit,
  parking,
  airlines,
  airports,
}) => {
  const [formData, setFormData] = React.useState<Partial<ParkingData>>({
    airline: '',
    airport: '',
    gate: {
      terminal: '',
      porte: '',
    },
  });

  React.useEffect(() => {
    if (parking) {
      setFormData(parking);
    }
  }, [parking]);

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => {
        const parentKey = parent as keyof Partial<ParkingData>;
        const parentValue = prev[parentKey];
        return {
          ...prev,
          [parentKey]: {
            ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
            [child]: value,
          },
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {parking ? 'Modifier le parking' : 'Ajouter un parking'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Compagnie aérienne</InputLabel>
                <Select
                  value={formData.airline}
                  label="Compagnie aérienne"
                  onChange={(e) => handleChange('airline', e.target.value)}
                  required
                >
                  {airlines.map((airline) => (
                    <MenuItem key={airline} value={airline}>
                      {airline}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Aéroport</InputLabel>
                <Select
                  value={formData.airport}
                  label="Aéroport"
                  onChange={(e) => handleChange('airport', e.target.value)}
                  required
                >
                  {airports.map((airport) => (
                    <MenuItem key={airport} value={airport}>
                      {airport}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Terminal"
                value={formData.gate?.terminal}
                onChange={(e) => handleChange('gate.terminal', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Porte"
                value={formData.gate?.porte}
                onChange={(e) => handleChange('gate.porte', e.target.value)}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" color="primary">
            {parking ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 