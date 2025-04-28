import { createSlice, createAsyncThunk, isRejectedWithValue } from '@reduxjs/toolkit';
// import type { ParkingData } from '@fyg/shared'; // Commenté
import api from '../services/api';
import { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

// --- Définir la nouvelle structure pour un groupe d'aéroport --- 
export interface AirportGroup {
  airport: string; // Le code ICAO de l'aéroport (_id du $group)
  totalParkingsInAirport: number; // Le compte total pour cet aéroport
  parkings: any[]; // Remplacé ParkingData[] par any[]
  lastUpdatedAt?: string; // Optionnel: dernière MàJ dans le groupe
}

// --- Mettre à jour l'interface de la réponse paginée --- 
interface PaginatedParkingResponse {
  docs: AirportGroup[]; // Contient maintenant des groupes d'aéroports
  totalDocs: number;   // Nombre total de groupes d'aéroports
  limit: number;
  page: number;
  totalPages: number;
  // ... autres champs de pagination ...
}

// --- Interface pour les paramètres de fetchParkings ---
interface FetchParkingsParams {
  page: number;
  limit: number;
  search?: string; // Optional search term
  sort?: string;   // Optional sort key (e.g., 'airport', '-updatedAt')
}

// --- Mettre à jour l'état pour stocker les groupes ET les ICAO --- 
export interface ParkingState {
  parkings: AirportGroup[]; // Stocke maintenant des groupes
  allAirportIcaos: string[]; // Stocke la liste complète des ICAO d'aéroports avec parkings
  loading: boolean;
  loadingIcaos: boolean; // État de chargement spécifique pour les ICAO
  error: string | null;
  errorIcaos: string | null; // Erreur spécifique pour les ICAO
  status: string; // Garder celui-ci ? Ou le fusionner avec loading/error ?
  currentPage: number;
  totalPages: number;
  totalDocs: number; // Représente le nombre total de groupes
}

// --- État initial --- 
const initialState: ParkingState = {
  parkings: [],
  allAirportIcaos: [], // Initialiser comme tableau vide
  loading: false,
  loadingIcaos: false,
  error: null,
  errorIcaos: null,
  status: 'idle',
  currentPage: 1,
  totalPages: 0,
  totalDocs: 0,
};

// --- Thunks (fetchParkings, addParking, etc. - Leurs appels API restent les mêmes) ---
export const fetchParkings = createAsyncThunk<
  PaginatedParkingResponse, 
  FetchParkingsParams,      
  { rejectValue: string }    
>(
  'parkings/fetchParkings',
  async ({ page, limit, search, sort }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);
      
      // L'appel API est le même, mais on s'attend à recevoir des AirportGroup
      const response = await api.get<PaginatedParkingResponse>(`/api/parkings?${params.toString()}`);
      
      // Validation basique de la nouvelle structure attendue
      if (response.data && Array.isArray(response.data.docs) && typeof response.data.totalDocs !== 'undefined') {
        // On pourrait ajouter une validation plus fine de la structure AirportGroup ici si nécessaire
        return response.data;
      } else {
        return rejectWithValue('Format de réponse invalide (attendait AirportGroup[]) de l\'API parkings.');
      }
    } catch (error: any) {
      // ... gestion erreur ...
      const message = error.response?.data?.message || error.message || 'Erreur inconnue fetchParkings';
      return rejectWithValue(message);
    }
  }
);

// addParking: L'appel API crée un parking, retourne ParkingData
export const addParking = createAsyncThunk<any, Omit<any, '_id'>>(
  'parkings/addParking', 
  // ... async (parking) ... - Logique API inchangée
  async (parking) => {
    const response = await api.post<any>('/api/parkings', parking);
    return response.data;
  }
);

// updateParking: L'appel API met à jour, retourne ParkingData
export const updateParking = createAsyncThunk<
  any,
  { id: string; parking: Omit<any, '_id'> }
>(
  'parkings/updateParking',
  // ... async ({ id, parking }) ... - Logique API inchangée
  async ({ id, parking }) => {
    const response = await api.put<any>(`/api/parkings/${id}`, parking);
    return response.data;
  }
);

// deleteParking: L'appel API supprime, retourne l'ID
export const deleteParking = createAsyncThunk<string, string>(
  'parkings/deleteParking',
  // ... async (id: string) ... - Logique API inchangée
   async (id: string) => {
    await api.delete(`/api/parkings/${id}`);
    return id;
  }
);

// deleteParkings: L'appel API supprime en masse, retourne le compte
export const deleteParkings = createAsyncThunk<
  { deletedCount: number; totalDeleted: number },
  string[],
  { rejectValue: string } 
>(
  'parkings/deleteParkings',
  // ... async (ids: string[]) ... - Logique API inchangée
   async (ids: string[], { rejectWithValue }) => {
    try {
      const response = await api.delete<{ deletedCount: number }>('/api/parkings/bulk', { data: { ids } });
      return { deletedCount: response.data.deletedCount, totalDeleted: ids.length };
    } catch (error: any) {
       const message = error.response?.data?.message || error.message || 'Erreur inconnue deleteParkings';
       return rejectWithValue(message);
    }
  }
);

// bulkImportParkings: L'appel API importe, retourne un résumé et les parkings insérés
export const bulkImportParkings = createAsyncThunk<
  // ... type de retour inchangé ...
  { 
    parkings: any[]; // Remplacé ParkingData[] par any[]
    duplicateDetails?: Array<{ airline: string; airport: string; reason: string }>;
    summary?: { total: number; inserted: number; duplicates: number };
    status?: 'success' | 'partial';
  },
  Omit<any, '_id'>[] // Remplacé ParkingData par any
>(
  'parkings/bulkImport',
  // ... async (parkings) ... - Logique API inchangée
  async (parkings) => {
    const response = await api.post<{ 
      parkings: any[]; // Remplacé ParkingData[] par any[]
      duplicateDetails: Array<{ airline: string; airport: string; reason: string }>;
      summary: { total: number; inserted: number; duplicates: number };
      status: 'success' | 'partial';
    }>('/api/parkings/bulk', { parkings });
    return response.data;
  }
);

// --- Thunk pour fetchAllParkingAirportIcaos --- // Renommé ici
export const fetchAllParkingAirportIcaos = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>(
  'parkings/fetchAllAirportIcaos', // Renommé ici
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<string[]>('/api/parkings/unique-airport-icaos');
      if (!Array.isArray(response.data)) {
        console.warn("API response for /parkings/unique-airport-icaos is not an array:", response.data);
        return rejectWithValue("Invalid API response format (expected string[]).");
      }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Unknown error fetching unique airport ICAOs';
      return rejectWithValue(message);
    }
  }
);

// --- Slice Reducers --- 
const parkingSlice = createSlice({
  name: 'parkingsList',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- fetchParkings --- 
      .addCase(fetchParkings.fulfilled, (state, action: PayloadAction<PaginatedParkingResponse>) => {
        state.parkings = action.payload.docs; 
        state.loading = false;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalDocs = action.payload.totalDocs; 
        state.error = null;
      })
      
      // --- CUD simplifié --- 
      // ... addParking.fulfilled ...
      // ... updateParking.fulfilled ...
      // ... deleteParking.fulfilled ...
      // ... bulkImportParkings.fulfilled ...
      // ... deleteParkings.fulfilled ...
      
      // --- fetchAllParkingAirportIcaos --- 
      .addCase(fetchAllParkingAirportIcaos.pending, (state) => { // Renommé ici
        state.loadingIcaos = true;
        state.errorIcaos = null;
      })
      .addCase(fetchAllParkingAirportIcaos.fulfilled, (state, action: PayloadAction<string[]>) => { // Renommé ici
        state.loadingIcaos = false;
        state.allAirportIcaos = action.payload;
      })
      .addCase(fetchAllParkingAirportIcaos.rejected, (state, action) => { // Renommé ici
        state.loadingIcaos = false;
        state.errorIcaos = action.payload || 'Impossible de charger les ICAO uniques.';
      })

      // ... Matchers pour pending/rejected ...
      // Adapter le matcher pending pour différencier les chargements
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state, action) => {
          if (action.type.startsWith('parkings/fetchParkings')) {
             state.loading = true;
          } else if (action.type.startsWith('parkings/fetchAllAirportIcaos')) { // Renommé ici
             state.loadingIcaos = true; // Utiliser loadingIcaos ici
          }
          // Reset les erreurs spécifiques au début d'un chargement pertinent
          if (action.type.startsWith('parkings/fetchParkings')) state.error = null;
          if (action.type.startsWith('parkings/fetchAllAirportIcaos')) state.errorIcaos = null; // Renommé ici
        }
      )
      // Adapter le matcher rejected pour différencier les erreurs
      .addMatcher(
        isRejectedWithValue,
        (state, action) => {
          const errorMessage = (action.payload as { message?: string })?.message 
                             || (action.error as Error)?.message
                             || 'Une erreur est survenue';
          if (action.type.startsWith('parkings/fetchParkings')) {
             state.loading = false;
             state.error = errorMessage;
          } else if (action.type.startsWith('parkings/fetchAllAirportIcaos')) { // Renommé ici
             state.loadingIcaos = false;
             state.errorIcaos = errorMessage;
          } else {
             // Gérer les rejets des autres thunks (CUD) si nécessaire,
             // pour l'instant on pourrait juste arrêter le loading général
             state.loading = false;
             // Afficher l'erreur principale peut être suffisant ?
             state.error = state.error || errorMessage; 
          }
        }
      );
  },
});

// --- Sélecteurs --- 
export const selectParkings = (state: RootState): AirportGroup[] => state.parkingsList.parkings;
export const selectLoading = (state: RootState): boolean => state.parkingsList.loading;
export const selectError = (state: RootState): string | null => state.parkingsList.error;
export const selectCurrentPage = (state: RootState): number => state.parkingsList.currentPage;
export const selectTotalPages = (state: RootState): number => state.parkingsList.totalPages;
export const selectTotalDocs = (state: RootState): number => state.parkingsList.totalDocs;
// Nouveau sélecteur
export const selectAllParkingAirportIcaos = (state: RootState): string[] => state.parkingsList.allAirportIcaos;
export const selectLoadingIcaos = (state: RootState): boolean => state.parkingsList.loadingIcaos;
export const selectErrorIcaos = (state: RootState): string | null => state.parkingsList.errorIcaos;

export default parkingSlice.reducer; 