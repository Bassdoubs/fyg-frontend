import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, CircularProgress, Alert, Pagination } from '@mui/material';
import AirplanemodeInactiveIcon from '@mui/icons-material/AirplanemodeInactive';
import { motion, AnimatePresence } from 'framer-motion';
import { ParkingData } from '@bassdoubs/fyg-shared';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { AirportCard } from '../AirportCard';
import { AirportGroup } from '../../../../store/parkingSlice';

interface AirportGridProps {
  parkings: AirportGroup[];
  onAirportSelect: (airport: string, parkingsInGroup: ParkingData[]) => void;
  isLoading?: boolean;
}

export const AirportGrid = ({ parkings: airportGroups, onAirportSelect, isLoading = false }: AirportGridProps) => {
  const { isDarkMode } = useDarkMode();

  const displayedAirportGroups = airportGroups;

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <div className="w-12 h-12 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Chargement des aéroports...
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-6 ${isDarkMode ? 'dark' : ''}`}>
      {displayedAirportGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <AirplanemodeInactiveIcon className="text-4xl mb-4 text-gray-400" />
          <p className="text-center text-gray-500 dark:text-gray-400">
            Aucun aéroport trouvé
          </p>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-1">
            Essayez de modifier votre recherche ou d'ajouter de nouveaux parkings
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {displayedAirportGroups.map((group, index) => (
                <motion.div
                  key={group.airport}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AirportCard
                    airport={group.airport}
                    totalParkingsCount={group.totalParkingsInAirport}
                    parkings={group.parkings}
                    onClick={() => onAirportSelect(group.airport, group.parkings)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}; 