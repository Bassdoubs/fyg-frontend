import React, { useState, useEffect, useCallback } from 'react';
// Importer l'instance configurée au lieu de l'axios de base
// import axios from 'axios'; <-- Supprimé
import api from '../../../services/api'; // <-- AJOUT (Adapter chemin si besoin)
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
      // Utiliser l'instance configurée 'api' au lieu de 'axios'
      const response = await api.get<{ docs: AirlineData[] }>('/api/airlines?limit=100'); // Limite à 100 pour test
      console.log('[fetchAirlines Frontend] Received response.data:', response.data);
      // Tenter d'accéder à .docs SEULEMENT si response.data est un objet
      if (response.data && typeof response.data === 'object' && 'docs' in response.data) {
        setAirlines(response.data.docs);
      } else {
        // Gérer le cas où la réponse n'a pas le format attendu (ex: HTML reçu)
        console.error("Réponse API inattendue:", response.data);
        setError('Réponse inattendue reçue du serveur.');
        setAirlines([]);
      }
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