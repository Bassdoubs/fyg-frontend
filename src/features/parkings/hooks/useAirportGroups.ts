import { useMemo } from 'react';
import type { Parking } from '../../../types/parking';

export const useAirportGroups = (parkings: Parking[], searchTerm: string = '') => {
  return useMemo(() => {
    const groups = parkings.reduce((acc, parking) => {
      if (!acc[parking.airport]) {
        acc[parking.airport] = [];
      }
      acc[parking.airport].push(parking);
      return acc;
    }, {} as Record<string, Parking[]>);
    
    return Object.entries(groups)
      .filter(([airport]) => 
        airport.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort(([a], [b]) => a.localeCompare(b));
  }, [parkings, searchTerm]);
}; 