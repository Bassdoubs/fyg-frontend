import { useState } from 'react';
import type { Parking } from '../../../types/parking';

export const useParkingActions = () => {
  const [selectedParkings, setSelectedParkings] = useState<string[]>([]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedParkings(prev => 
      checked ? [...prev, id] : prev.filter(pId => pId !== id)
    );
  };

  const handleSelectAll = (parkings: Parking[], checked: boolean) => {
    setSelectedParkings(checked ? parkings.map(p => p._id) : []);
  };

  const clearSelection = () => {
    setSelectedParkings([]);
  };

  return {
    selectedParkings,
    handleSelect,
    handleSelectAll,
    clearSelection
  };
}; 