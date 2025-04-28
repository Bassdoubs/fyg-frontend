import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
// import { useEntities } from './useEntities'; 
import { ParkingData as Parking, AirlineData as Airline } from '../../../../packages/shared/src/types'; // Retirer ProcessedAirline
import { ProcessedAirline } from '../types'; // Importer ProcessedAirline depuis le fichier local
import { selectParkings, selectLoading as selectParkingsLoading, selectError as selectParkingsError } from '../../../store/parkingSlice'; // Correction chemin slice
import { selectAirlines, selectAirlinesLoading } from '../../../store/airlinesSlice'; // Correction chemin slice
import { RootState } from '../../../store/store'; // Correction chemin store

// Supprimer la définition locale de RootState
/*
interface RootState {
  parkingsList: {
    parkings: Parking[];
    loading: boolean;
    error: string | null;
  };
}
*/

// Le hook prend maintenant les dépendances via les hooks standards
export const useAirlineStats = () => {
  // Récupérer les données globales via les sélecteurs Redux
  const parkings = useSelector(selectParkings); // Retourne AirportGroup[]
  const parkingsLoading = useSelector(selectParkingsLoading);
  const parkingsError = useSelector(selectParkingsError);
  const airlines = useSelector(selectAirlines); // Récupérer les airlines depuis Redux
  const airlinesLoading = useSelector(selectAirlinesLoading);
  // Retirer entitiesError car useEntities n'est plus utilisé
  // const { airlines, loading: airlinesLoading, error: entitiesError } = useEntities();

  // Calculer l'état de chargement global et l'erreur combinée
  const isLoading = parkingsLoading || airlinesLoading;
  const combinedError = parkingsError; // Utiliser seulement l'erreur des parkings (ou ajouter celle des airlines si elle est exportée)

  // Aplatir les parkings des groupes pour le useMemo
  const flatParkings = useMemo(() => parkings.flatMap(group => group.parkings), [parkings]);

  // Le traitement des données dépend maintenant directement des données globales
  const processedAirlines = useMemo((): ProcessedAirline[] => {
    console.log(`[useAirlineStats] Calcul processedAirlines. isLoading: ${isLoading}, Error: ${combinedError}, Parkings(flat): ${flatParkings?.length}, Airlines: ${airlines?.length}`);

    // Utiliser flatParkings pour la condition et le traitement
    if (isLoading || combinedError || !flatParkings || flatParkings.length === 0 || !airlines || airlines.length === 0) {
      console.log("[useAirlineStats] Condition retour tableau vide remplie (loading/error/données vides).");
      return [];
    }

    console.log("[useAirlineStats] Début traitement données...");

    // 1. Map des détails des compagnies
    const airlineMap = new Map<string, Airline>();
    airlines.forEach(a => airlineMap.set(a.icao, a));
    console.log(`[useAirlineStats] airlineMap créée. Taille: ${airlineMap.size}`);

    // 2. Map des données par compagnie trouvée dans les parkings
    const airlineDataMap = new Map<string, { airports: Set<string>, parkingsList: Parking[] }>();
    
    flatParkings.forEach(p => {
      if (!p.airline) return; 
      if (!airlineDataMap.has(p.airline)) {
        airlineDataMap.set(p.airline, { airports: new Set<string>(), parkingsList: [] });
      }
      const airlineEntry = airlineDataMap.get(p.airline);
      if (airlineEntry) {
         if(p.airport) airlineEntry.airports.add(p.airport);
         airlineEntry.parkingsList.push(p);
      }
    });
    console.log(`[useAirlineStats] airlineDataMap créée (compagnies présentes dans parkings). Taille: ${airlineDataMap.size}`);

    // 3. Construction du résultat final
    const result: ProcessedAirline[] = [];
    let foundCount = 0;
    let notFoundCount = 0;
    airlineDataMap.forEach((data, icao) => {
      const airlineDetails = airlineMap.get(icao);
      if (airlineDetails) {
        foundCount++;
        // Utiliser directement l'ID MongoDB comme `id` pour ProcessedAirline
        const processed: ProcessedAirline = {
           id: airlineDetails._id, // Assigner _id à id
           name: airlineDetails.name,
           callsign: airlineDetails.callsign,
           icao: airlineDetails.icao,
           country: airlineDetails.country,
           logoUrl: airlineDetails.logoUrl,
           logoPublicId: airlineDetails.logoPublicId,
           servedAirports: Array.from(data.airports).sort(),
           parkingCount: data.parkingsList.length
        };
        result.push(processed);
      } else {
        notFoundCount++;
        console.warn(`[useAirlineStats] Détails non trouvés pour la compagnie ICAO: ${icao}`);
      }
    });

    console.log(`[useAirlineStats] Traitement final: ${foundCount} compagnies trouvées, ${notFoundCount} non trouvées. Taille résultat final: ${result.length}`);
    return result.sort((a, b) => a.name.localeCompare(b.name));

  }, [flatParkings, airlines, isLoading, combinedError]); // Dépendre de flatParkings
  
  // Calculer le nombre total de compagnies uniques basées sur les parkings traités
  const totalUniqueAirlines = processedAirlines.length;

  return {
    processedAirlines,
    totalUniqueAirlines,
    loading: isLoading, // Retourner l'état de chargement global
    error: combinedError // Retourner l'erreur combinée
  };
}; 