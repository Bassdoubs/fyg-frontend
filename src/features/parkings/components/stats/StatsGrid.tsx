import React from 'react';
import { Grid } from '@mui/material';
import { StatsCard } from './StatsCard';
import { GlobalStats } from '../../types';
import { useTheme } from '@mui/material/styles';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import FlightIcon from '@mui/icons-material/Flight';
import BusinessIcon from '@mui/icons-material/Business';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

interface StatsGridProps {
  stats: GlobalStats;
  loading: boolean;
  onCountryClick: () => void;
  onAirportClick: () => void;
  onAirlineClick: () => void;
  countryCount: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  loading,
  onCountryClick,
  onAirportClick,
  onAirlineClick,
  countryCount
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Total Parkings"
          value={stats.totalParkings.toString()}
          icon={LocalParkingIcon}
          iconColor={theme.palette.primary.main}
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Total Aéroports"
          value={stats.totalAirports.toString()}
          icon={FlightIcon}
          iconColor={theme.palette.secondary.main}
          loading={loading}
          onClick={onAirportClick}
          clickable={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Total Compagnies"
          value={stats.totalCompanies.toString()}
          icon={BusinessIcon}
          iconColor={theme.palette.warning.main}
          loading={loading}
          onClick={onAirlineClick}
          clickable={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Pays"
          value={countryCount.toString()}
          icon={PublicIcon}
          iconColor={theme.palette.info.main}
          loading={loading}
          onClick={onCountryClick}
          clickable={true}
        />
      </Grid>
    </Grid>
  );
}; 