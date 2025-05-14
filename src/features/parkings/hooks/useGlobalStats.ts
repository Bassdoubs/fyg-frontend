import { useState, useEffect } from 'react';
import api from '../../../services/api'; // Importer l'instance api
import { countriesOACI } from '../../../constants/countryCodesOACI';
import { TERRITORY_TO_ISO } from '../../../constants/territoryMapping';

// Fonction utilitaire pour obtenir le nom du pays parent (ex: France pour FR)
// Trouve la première clé OACI dans countriesOACI dont le code ISO correspond
const getParentCountryName = (isoCode: string): string => {
  for (const oaciKey in countriesOACI) {
    if (countriesOACI[oaciKey].code === isoCode && !TERRITORY_TO_ISO[isoCode]) {
      // Si le code ISO correspond ET que ce n'est pas un territoire lui-même
      // Ou une logique plus simple : on prend le premier trouvé correspondant à l'ISO parent
       return countriesOACI[oaciKey].name;
    }
  }
  // Fallback pour les territoires ou si non trouvé (devrait être rare si la logique est bonne)
  // Tentative de retrouver via une clé OACI correspondant au code ISO
  const fallbackEntry = Object.entries(countriesOACI).find(([key, value]) => key === isoCode || value.code === isoCode);
  return fallbackEntry ? fallbackEntry[1].name : `Pays ${isoCode}`; 
};

const DEFAULT_GLOBAL_STATS: any = {
  totalParkings: 0,
  totalAirports: 0,
  totalCompanies: 0,
  totalCountries: 0,
  countries: [],
  countryCounts: []
};

export const useGlobalStats = () => {
  const [globalStats, setGlobalStats] = useState<any>(DEFAULT_GLOBAL_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [countryStats, setCountryStats] = useState<any[]>([]);

  const loadGlobalStats = async () => {
    try {
      setStatsLoading(true);
      // Utiliser l'instance api et ajouter /api
      const response = await api.get<any>('/api/stats/global');
      
      // Initialiser globalStats avec des valeurs par défaut si la réponse est partielle
      setGlobalStats({
        totalParkings: response.data?.totalParkings || 0,
        totalAirports: response.data?.totalAirports || 0,
        totalCompanies: response.data?.totalCompanies || 0,
        totalCountries: 0, // Sera mis à jour par processCountryStats
        countries: response.data?.countries || [],
        countryCounts: response.data?.countryCounts || []
      });

      if (response.data?.countryCounts) {
        processCountryStats(response.data.countryCounts);
      } else {
        // Si pas de countryCounts, initialiser countryStats et totalCountries
        setCountryStats([]);
        setGlobalStats((prev: any) => ({ ...prev, totalCountries: 0 }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques globales:', error);
      // Remettre les stats par défaut en cas d'erreur
      setGlobalStats(DEFAULT_GLOBAL_STATS);
      setCountryStats([]);
    } finally {
      setStatsLoading(false);
    }
  };

  const processCountryStats = (data: Array<{ code: string; count: number }>) => {
    // console.log('Données à traiter pour le regroupement (Directive OACI):', data);
    const countryMap = new Map<string, { count: number; codes: Set<string> }>();

    data.forEach(item => {
      const originalCode = item.code?.toUpperCase(); // Le code reçu (ex: LF, SO, GF, TF)
      if (!originalCode) {
        // console.warn("Code manquant dans l'item:", item); // Garder ce warn ?
        return;
      }

      // 1. Trouver les infos via le code original comme clé OACI
      const oaciInfo = countriesOACI[originalCode]; 
      if (!oaciInfo) {
        // console.warn(`Code OACI préfixe inconnu dans countriesOACI: ${originalCode}`); // Garder ce warn ?
        // Ici on pourrait tenter de voir si originalCode est un ISO connu comme fallback,
        // mais on suit la directive stricte basée sur les préfixes OACI comme clés.
        return; 
      }

      const itemIsoCode = oaciInfo.code; // ISO correspondant (ex: FR pour LF, GF pour SO, GP pour TF)
      
      // 2. Déterminer le code ISO de regroupement (pays parent)
      const groupingIsoCode = TERRITORY_TO_ISO[itemIsoCode] || itemIsoCode; // Ex: FR pour GF, FR pour FR

      // 3. Mettre à jour la map de regroupement
      if (countryMap.has(groupingIsoCode)) {
        const existing = countryMap.get(groupingIsoCode)!;
        existing.count += item.count || 0;
        existing.codes.add(originalCode); // Ajouter le code OACI original au Set
      } else {
        countryMap.set(groupingIsoCode, {
          count: item.count || 0,
          codes: new Set<string>([originalCode]) // Initialiser le Set
        });
      }
    });

    // 4. Transformer la map en tableau de CountryStats
    const processedStats: any[] = Array.from(countryMap.entries())
      .map(([groupingIsoCode, data]) => {
          // Trouver le nom du pays parent basé sur le groupingIsoCode
          const parentName = getParentCountryName(groupingIsoCode); 
          return {
            primaryCode: groupingIsoCode, // Code ISO pour le drapeau
            name: parentName,
            count: data.count,
            codes: Array.from(data.codes).sort() // Convertir Set en tableau trié pour les badges
          };
      })
      .sort((a, b) => b.count - a.count); // Tri par nombre d'aéroports décroissant

    // console.log('Statistiques traitées (Directive OACI):', processedStats);
    setCountryStats(processedStats);
    setGlobalStats((prev: any) => ({
      ...prev,
      totalCountries: processedStats.length 
    }));
  };

  // getCountryGroupCount et getTotalUniqueCountries restent inchangés fonctionnellement
  const getCountryGroupCount = () => {
    return countryStats.length;
  };

  const getTotalUniqueCountries = () => {
    return globalStats.totalCountries;
  };

  useEffect(() => {
    loadGlobalStats();
  }, []);

  return {
    globalStats,
    statsLoading,
    countryStats,
    getCountryGroupCount,
    getTotalUniqueCountries
  };
}; 