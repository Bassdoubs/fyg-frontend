import { useMemo } from 'react';
import { Card, CardActionArea, CardContent, CardMedia, Typography, Chip, Box, IconButton } from '@mui/material';
import { FlightTakeoff, FlightLand, LocalParking, Map, LocationDisabled } from '@mui/icons-material';
import { ParkingData } from '@bassdoubs/fyg-shared';
import { motion } from 'framer-motion';
import { useDarkMode } from '../../../../hooks/useDarkMode';

interface AirportCardProps {
  airport: string;
  parkings: ParkingData[];
  totalParkingsCount: number;
  onClick: () => void;
}

export const AirportCard = ({ airport, parkings, totalParkingsCount, onClick }: AirportCardProps) => {
  const { isDarkMode } = useDarkMode();
  
  const stats = useMemo(() => {
    const parkingsWithMaps = parkings.filter(p => p.mapInfo?.hasMap).length;
    
    return {
      mapsCount: parkingsWithMaps,
      hasMaps: parkingsWithMaps > 0
    };
  }, [parkings]);

  const cardStyle = {
    backgroundColor: 'var(--airport-card-bg)',
    color: 'var(--airport-card-text)',
    borderColor: 'var(--airport-card-border)',
    boxShadow: `0 10px 15px -3px var(--card-shadow), 0 4px 6px -2px var(--card-shadow)`
  };

  const gradientStyle = {
    background: isDarkMode 
      ? 'linear-gradient(to bottom right, rgba(30, 64, 175, 0.2), rgba(67, 56, 202, 0.1))'
      : 'linear-gradient(to bottom right, rgba(219, 234, 254, 0.7), rgba(199, 210, 254, 0.5))'
  };

  const iconContainerStyle = {
    backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(219, 234, 254, 0.8)',
    color: isDarkMode ? '#93c5fd' : '#2563eb'
  };

  const statBoxStyle = {
    backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
    color: isDarkMode ? '#f9fafb' : '#111827'
  };

  const mapBadgeStyle = stats.hasMaps
    ? {
        backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.3)' : 'rgba(240, 253, 244, 1)',
        borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
        color: isDarkMode ? '#34d399' : '#047857'
      }
    : {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.8)',
        borderColor: isDarkMode ? 'rgba(107, 114, 128, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        color: '#9ca3af'
      };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer rounded-3xl border transition-all duration-300 ease-out"
      style={cardStyle}
    >
      <div className="absolute inset-0" style={gradientStyle} />
      
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold" style={{ color: 'inherit' }}>
            {airport}
          </h3>
          <div className="flex justify-center items-center w-10 h-10 rounded-full" style={iconContainerStyle}>
            <FlightLand style={{ color: 'inherit' }} />
          </div>
        </div>

        <div className="rounded-xl p-3 shadow-sm border transform hover:scale-105 transition-transform duration-200" style={statBoxStyle}>
          <p className="text-sm font-medium" style={{ color: isDarkMode ? '#93c5fd' : '#2563eb' }}>
             Total Parkings
          </p>
          <p className="text-lg font-semibold" style={{ color: 'inherit' }}>
            {totalParkingsCount}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div 
            className="flex items-center gap-1 text-sm px-3 py-1 rounded-full border"
            style={mapBadgeStyle}
            title={stats.hasMaps ? "Cartes disponibles" : "Aucune carte disponible"}
          >
            {stats.hasMaps ? (
              <>
                <Map fontSize="small" />
                <span className="font-medium">{stats.mapsCount}</span>
              </>
            ) : (
              <>
                <LocationDisabled fontSize="small" />
                <span>0</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 