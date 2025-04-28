import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './store';
import api from '../services/api'; // Importer l'instance api

// --- Définition de l'action asynchrone --- 
export const fetchAirports = createAsyncThunk<
  any[], // Remplacé AirportData[] par any[]
  void, // Type de l'argument passé au thunk (aucun ici)
  { rejectValue: string } // Type de la valeur retournée en cas d'échec
>(
  'airports/fetchAirports', // Nom de l'action
  async (_, { rejectWithValue }) => {
    try {
      // Ask for a very large limit to effectively get all airports
      // Update expected response type AND remove /api prefix
      const response = await api.get<{ docs: any[], totalDocs: number }>('/api/airports?limit=10000'); 
      
      // Check if the 'docs' array exists
      if (!Array.isArray(response.data?.docs)) {
        // Keep this important warning
        console.warn("API response for /airports lacks 'docs' array. Received:", response.data);
        return rejectWithValue("Invalid airport API response format.");
      }
      
      // Optional: Check using totalDocs if necessary
      if (response.data.totalDocs > 10000) {
          // Keep this important warning
          console.warn(`Fetched 10000 airports, but totalDocs is ${response.data.totalDocs}. Some airports might be missing.`);
      }

      return response.data.docs; // Return the 'docs' array
    } catch (error: any) {
      // Gérer les erreurs (ex: erreur réseau, erreur serveur)
      const message = error.response?.data?.message || error.message || 'Unknown error fetching airports';
      return rejectWithValue(message);
    }
  }
);

// --- Interface d'état --- 
export interface AirportsState {
  airports: any[]; // Remplacé AirportData[] par any[]
  loading: boolean;
  error: string | null;
}

// --- État initial --- 
const initialState: AirportsState = {
  airports: [],
  loading: false,
  error: null,
};

// --- Définition du Slice --- 
const airportsSlice = createSlice({
  name: 'airports',
  initialState,
  reducers: {
    // Pas de reducers synchrones nécessaires pour le moment
  },
  extraReducers: (builder) => {
    builder
      // Cas où le chargement commence
      .addCase(fetchAirports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Cas où le chargement réussit
      .addCase(fetchAirports.fulfilled, (state, action) => {
        state.loading = false;
        state.airports = action.payload; // Mettre à jour la liste des aéroports
      })
      // Cas où le chargement échoue
      .addCase(fetchAirports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Impossible de charger les aéroports.'; // Utiliser le message d'erreur du rejectWithValue
      });
  },
});

// --- Exportations --- 
export default airportsSlice.reducer; // Exporter le reducer

// Exporter les sélecteurs
export const selectAirports = (state: RootState): any[] => state.airports?.airports || []; // Remplacé AirportData[] par any[]
export const selectAirportsLoading = (state: RootState): boolean => state.airports?.loading || false;
export const selectAirportsError = (state: RootState): string | null => state.airports?.error || null; // Décommenter et exporter le sélecteur d'erreur

// Pas d'actions synchrones à exporter pour l'instant
// export const { } = airportsSlice.actions; 