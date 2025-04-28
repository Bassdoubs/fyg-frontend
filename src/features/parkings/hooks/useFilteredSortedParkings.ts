import { useMemo } from 'react';
import { ParkingData } from '@fyg/shared';
import { SortOption } from './useParkingViewControls'; // Import SortOption type

export const useFilteredSortedParkings = (
  parkings: ParkingData[] | undefined,
  searchTerm: string,
  sortBy: SortOption // Use the imported type
): ParkingData[] => {
  // Filtrer les parkings en fonction de la recherche
  const filteredParkings = useMemo(() => {
    if (!parkings) return [];
    if (!searchTerm) return parkings;
    return parkings.filter(p =>
      p.airport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.airline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gate?.terminal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gate?.porte?.toLowerCase().includes(searchTerm.toLowerCase()) // Ajout recherche sur la porte
    );
  }, [parkings, searchTerm]);

  // Trier les parkings (uniquement par date ou aéroport maintenant)
  const sortedParkings = useMemo(() => {
    if (!Array.isArray(filteredParkings)) {
      console.warn("[useFilteredSortedParkings] filteredParkings n'est pas un tableau:", filteredParkings);
      return [];
    }
    // Créer une copie avant de trier pour ne pas muter l'original
    return [...filteredParkings].sort((a, b) => {
      if (sortBy === 'airport') {
        const nameA = a.airport || '';
        const nameB = b.airport || '';
        return nameA.localeCompare(nameB);
      } else { // Default or 'updatedAt'
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA; // Plus récent en premier
      }
    });
  }, [filteredParkings, sortBy]);

  return sortedParkings;
}; 