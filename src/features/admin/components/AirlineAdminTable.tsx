import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AirlineData } from '@bassdoubs/fyg-shared';
import { Typography, Box, CircularProgress, Alert } from '@mui/material'; // Garder imports basiques MUI

const AirlineAdminTableMinimal = () => {
  const [airlines, setAirlines] = useState<AirlineData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAirlines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simplifié: fetch toutes les airlines sans pagination/recherche pour le test
      const response = await axios.get<{ docs: AirlineData[] }>('/api/airlines?limit=100'); // Limite à 100 pour test
      setAirlines(response.data.docs);
    } catch (err) {
      console.error("Erreur lors de la récupération des compagnies:", err);
      setError('Impossible de charger les données des compagnies.');
      setAirlines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAirlines();
  }, [fetchAirlines]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Liste Simple des Compagnies (Test)</Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      )}
      {!loading && !error && (
        <Box component="ul" sx={{ mt: 2, pl: 2 }}> {/* Utilisation de Box comme ul */} 
          {airlines && airlines.length > 0 ? (
            airlines
              // .filter(a => a && a._id && a.name) // <-- FILTRE SUPPRIMÉ TEMPORAIREMENT
              .map((airline) => (
                // Ajout de vérifications pour l'affichage au cas où des données seraient nulles
                <li key={airline?._id || Math.random()}> 
                  {airline?.icao || '?'} - {airline?.name || '?'} 
                </li>
              ))
          ) : (
            <li>Aucune compagnie trouvée.</li>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AirlineAdminTableMinimal; 