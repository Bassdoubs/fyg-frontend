import { useState, useEffect } from 'react';
import axios from 'axios';
import { AirlineData as Airline, Airport } from '../../../../packages/shared/src/types';

// Définir un type pour la réponse paginée de l'API
interface PaginatedResponse<T> {
  docs: T[]; // Utiliser 'docs'
  totalDocs: number; // Utiliser 'totalDocs'
  // Retirer les anciennes clés optionnelles si elles ne sont plus utilisées
  // airports?: T[]; 
  // airlines?: T[];
  // totalCount?: number;
  // currentPage?: number;
  // totalPages?: number;
}

interface EntitiesState {
  // Ces états contiendront directement les TABLEAUX
  airlines: Airline[];
  airports: Airport[];
  loading: boolean;
  error: string | null;
}

export const useEntities = () => {
  const [state, setState] = useState<EntitiesState>({
    airlines: [],
    airports: [],
    loading: false,
    error: null,
  });

  const fetchAirlines = async () => {
    try {
      // Attendre la nouvelle structure
      const response = await axios.get<PaginatedResponse<Airline>>('/api/airlines?limit=10000');
      // Extraire le tableau depuis 'docs'
      if (!Array.isArray(response.data?.docs)) {
        console.warn("API response for /airlines lacks 'docs' array. Received:", response.data);
        return []; // Retourner tableau vide en cas d'erreur de format
      }
      return response.data.docs;
    } catch (error) {
      console.error('Erreur lors de la récupération des compagnies aériennes:', error);
      throw error; 
    }
  };

  const fetchAirports = async () => {
    try {
      // Attendre la nouvelle structure
      const response = await axios.get<PaginatedResponse<Airport>>('/api/airports?limit=10000');
      // Extraire le tableau depuis 'docs'
      if (!Array.isArray(response.data?.docs)) {
        console.warn("API response for /airports lacks 'docs' array. Received:", response.data);
        return []; // Retourner tableau vide en cas d'erreur de format
      }
      return response.data.docs;
    } catch (error) {
      console.error('Erreur lors de la récupération des aéroports:', error);
      throw error; 
    }
  };

  const fetchAll = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Promise.all attendra que les deux requêtes soient terminées
      const [fetchedAirlines, fetchedAirports] = await Promise.all([
        fetchAirlines(),
        fetchAirports(),
      ]);
      // Mettre à jour l'état avec les TABLEAUX extraits
      setState({
        airlines: fetchedAirlines, // Directement le tableau
        airports: fetchedAirports, // Directement le tableau
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors de la récupération des données',
      }));
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const refresh = () => {
    fetchAll();
  };

  // Le hook retourne maintenant directement les tableaux dans state.airlines et state.airports
  return {
    ...state,
    refresh,
  };
}; 