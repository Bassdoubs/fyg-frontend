import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './store';
import api from '../services/api';

// --- Thunk pour fetchAirlines --- 
export const fetchAirlines = createAsyncThunk<
  any[], // Remplacé Airline[] par any[]
  void,
  { rejectValue: string }
>(
  'airlines/fetchAirlines',
  async (_, { rejectWithValue }) => {
    try {
      // Attendre la structure { docs: ..., totalDocs: ... }
      const response = await api.get<{ docs: any[], totalDocs: number }>('/api/airlines?limit=10000'); // Ajout /api, Remplacé Airline[] par any[]
      if (!Array.isArray(response.data?.docs)) {
        console.warn("API response for /airlines lacks 'docs' array. Received:", response.data);
        return rejectWithValue("Invalid airline API response format.");
      }
       if (response.data.totalDocs > 10000) {
           console.warn(`Fetched 10000 airlines, but totalDocs is ${response.data.totalDocs}.`);
       }
      return response.data.docs;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Unknown error fetching airlines';
      return rejectWithValue(message);
    }
  }
);

// Exporter l'interface d'état
export interface AirlinesState {
  airlines: any[]; // Remplacé Airline[] par any[]
  loading: boolean;
  error: string | null;
}

const initialState: AirlinesState = {
  airlines: [],
  loading: false,
  error: null,
};

const airlinesSlice = createSlice({
  name: 'airlines',
  initialState,
  reducers: {},
  // Gérer les états du thunk
  extraReducers: (builder) => {
    builder
      .addCase(fetchAirlines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAirlines.fulfilled, (state, action) => {
        state.loading = false;
        state.airlines = action.payload;
      })
      .addCase(fetchAirlines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Impossible de charger les compagnies.';
      });
  },
});

// Exporter le reducer
export default airlinesSlice.reducer;

// Exporter les sélecteurs (même s'ils retournent des valeurs par défaut pour l'instant)
export const selectAirlines = (state: RootState): any[] => state.airlines?.airlines || []; // Remplacé Airline[] par any[]
export const selectAirlinesLoading = (state: RootState): boolean => state.airlines?.loading || false;
// export const selectAirlinesError = (state: RootState): string | null => state.airlines?.error || null;

// Exporter les actions si nécessaire
// export const { /* actions */ } = airlinesSlice.actions; 