import { TextField, Box } from '@mui/material';

interface SearchFiltersProps {
  filters: {
    airline: string;
    airport: string;
    terminal: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

export const SearchFilters = ({ filters, onFilterChange }: SearchFiltersProps) => {
  return (
    <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <TextField
        label="Compagnie aérienne"
        value={filters.airline}
        onChange={(e) => onFilterChange('airline', e.target.value)}
        size="small"
        className="dark:bg-gray-700 rounded-md"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(209, 213, 219, 0.2)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgb(156, 163, 175)',
          },
          '& .MuiInputBase-input': {
            color: 'inherit',
          },
        }}
      />
      <TextField
        label="Aéroport"
        value={filters.airport}
        onChange={(e) => onFilterChange('airport', e.target.value)}
        size="small"
        className="dark:bg-gray-700 rounded-md"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(209, 213, 219, 0.2)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgb(156, 163, 175)',
          },
          '& .MuiInputBase-input': {
            color: 'inherit',
          },
        }}
      />
      <TextField
        label="Terminal"
        value={filters.terminal}
        onChange={(e) => onFilterChange('terminal', e.target.value)}
        size="small"
        className="dark:bg-gray-700 rounded-md"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(209, 213, 219, 0.2)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgb(156, 163, 175)',
          },
          '& .MuiInputBase-input': {
            color: 'inherit',
          },
        }}
      />
    </Box>
  );
}; 