import { useMemo } from 'react';
import type { Parking } from '../../../types/parking';
import type { ValidationError } from '../types';

export const useImportValidation = (data: Array<Partial<Omit<Parking, '_id'>>> | null) => {
  const validation = useMemo(() => {
    if (!data) return { errors: [], isValid: false };

    const errors: ValidationError[] = [];
    const seen = new Map<string, number>();

    data.forEach((item, index) => {
      // Validation de la compagnie (ICAO)
      if (!item.airline?.match(/^[A-Z]{3}$/)) {
        errors.push({
          row: index,
          field: 'airline',
          message: 'Le code ICAO de la compagnie doit contenir exactement 3 lettres majuscules'
        });
      }

      // Validation de l'aéroport (ICAO)
      if (!item.airport?.match(/^[A-Z]{4}$/)) {
        errors.push({
          row: index,
          field: 'airport',
          message: 'Le code ICAO de l\'aéroport doit contenir exactement 4 lettres majuscules'
        });
      }

      // Validation des doublons internes
      if (item.airline && item.airport) {
        const key = `${item.airline}-${item.airport}`;
        const existingIndex = seen.get(key);
        
        if (existingIndex !== undefined) {
          errors.push({
            row: index,
            field: 'airline',
            message: `Doublon avec la ligne ${existingIndex + 1} : même combinaison compagnie/aéroport`
          });
        } else {
          seen.set(key, index);
        }
      }

      // Validation gate/terminal
      if (!item.gate?.terminal && !item.gate?.porte) {
        errors.push({
          row: index,
          field: 'gate',
          message: 'Au moins un terminal ou une porte doit être spécifié'
        });
      }
    });

    return {
      errors,
      isValid: errors.length === 0
    };
  }, [data]);

  return validation;
}; 