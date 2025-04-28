import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour "débouncing" une valeur.
 * @param value La valeur à "débouncé".
 * @param delay Le délai en millisecondes.
 * @returns La valeur "débouncée".
 */
export function useDebounce<T>(value: T, delay: number): T {
  // État pour stocker la valeur "débouncée"
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Met à jour la valeur "débouncée" après le délai spécifié
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoie le timeout si la valeur change (avant la fin du délai)
    // ou si le composant est démonté.
    return () => {
      clearTimeout(handler);
    };
  }, [
    value, // Se ré-exécute seulement si la valeur change
    delay  // ou si le délai change
  ]);

  return debouncedValue;
} 