import reducer, { 
    fetchParkings, 
    addParking,      // Importer l'action
    updateParking,   // Importer l'action
    deleteParking,    // Importer l'action
    bulkImportParkings,
    deleteParkings    // Importer l'action
    // Importer d'autres actions au besoin
} from './parkingSlice';
import type { ParkingState } from './parkingSlice';
// Importer initialState séparément si ce n'est pas un export nommé
// ou l'obtenir via une action/selector si nécessaire.
// Pour l'instant, on le redéfinit ici si non exporté
const initialStateTest: ParkingState = {
  parkings: [],
  loading: false,
  error: null,
  status: 'idle'
};

import type { ParkingData } from '@fyg/shared';
import { describe, it, expect } from 'vitest';

// Données mockées pour les tests
const mockParking1: ParkingData = {
  _id: '1', 
  airline: 'BAW', 
  airport: 'EGLL', 
  gate: { terminal: 'T5', porte: '510' },
  mapInfo: { hasMap: false, mapUrl: undefined, source: undefined }, // Utiliser undefined au lieu de null
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
const mockParking2: ParkingData = {
  _id: '2', 
  airline: 'AFR', 
  airport: 'LFPG', 
  gate: { terminal: '2E', porte: 'K41' },
  mapInfo: { hasMap: false, mapUrl: undefined, source: undefined }, // Utiliser undefined au lieu de null
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('parkingSlice reducer', () => {
  it('should return the initial state', () => {
    // Utiliser notre état initial local pour le test
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialStateTest);
  });

  // --- Tests pour fetchParkings --- 
  it('should set loading to true when fetchParkings is pending', () => {
    const action = { type: fetchParkings.pending.type };
    const state = reducer(initialStateTest, action);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle fetchParkings.fulfilled', () => {
    const parkings = [mockParking1, mockParking2];
    const action = { type: fetchParkings.fulfilled.type, payload: parkings };
    const previousState: ParkingState = { ...initialStateTest, loading: true }; 
    const state = reducer(previousState, action);
    
    expect(state.loading).toBe(false);
    expect(state.parkings).toEqual(parkings);
    expect(state.error).toBeNull();
  });

  it('should set error when fetchParkings is rejected', () => {
    const errorMessage = 'Échec de la récupération';
    const action = { type: fetchParkings.rejected.type, error: { message: errorMessage } };
    const previousState: ParkingState = { ...initialStateTest, loading: true };
    const state = reducer(previousState, action);

    expect(state.loading).toBe(false);
    expect(state.error).toEqual(errorMessage);
    expect(state.parkings).toEqual([]);
  });

  // --- Tests pour addParking --- 
  it('should handle addParking.fulfilled', () => {
    const newParking = mockParking2;
    const action = { type: addParking.fulfilled.type, payload: newParking };
    const previousState: ParkingState = { ...initialStateTest, parkings: [mockParking1] };
    const state = reducer(previousState, action);

    expect(state.parkings.length).toBe(2);
    expect(state.parkings[1]).toEqual(newParking);
  });
  
  // --- Tests pour updateParking --- 
  it('should handle updateParking.fulfilled', () => {
    const updatedParking: ParkingData = {
      ...mockParking1,
      gate: { terminal: 'T5A', porte: '511' },
      updatedAt: new Date(Date.now() + 1000).toISOString()
    };
    const action = { type: updateParking.fulfilled.type, payload: updatedParking };
    const previousState: ParkingState = { ...initialStateTest, parkings: [mockParking1, mockParking2] };
    const state = reducer(previousState, action);

    expect(state.parkings.length).toBe(2);
    const foundParking = state.parkings.find(p => p._id === updatedParking._id);
    expect(foundParking).toEqual(updatedParking);
    expect(state.parkings.find(p => p._id === mockParking2._id)).toEqual(mockParking2);
  });

  // --- Tests pour deleteParking --- 
  it('should handle deleteParking.fulfilled', () => {
    const parkingIdToDelete = mockParking1._id;
    const action = { type: deleteParking.fulfilled.type, payload: parkingIdToDelete };
    const previousState: ParkingState = { ...initialStateTest, parkings: [mockParking1, mockParking2] };
    const state = reducer(previousState, action);

    expect(state.parkings.length).toBe(1);
    expect(state.parkings.find(p => p._id === parkingIdToDelete)).toBeUndefined();
    expect(state.parkings[0]).toEqual(mockParking2);
  });

  // --- Tests pour bulkImportParkings --- 
  it('should handle bulkImportParkings.fulfilled', () => {
    const importedParkings = [mockParking2]; // Simuler l'import d'un parking
    const action = { 
      type: bulkImportParkings.fulfilled.type, 
      payload: { parkings: importedParkings } // La réponse contient un objet avec une clé parkings
    };
    // Partir d'un état initial qui contient déjà un parking différent
    const previousState: ParkingState = { ...initialStateTest, parkings: [mockParking1] };
    const state = reducer(previousState, action);

    expect(state.loading).toBe(false); // Géré par le matcher
    expect(state.parkings.length).toBe(2);
    expect(state.parkings).toContainEqual(mockParking1); // L'ancien doit toujours être là
    expect(state.parkings).toContainEqual(mockParking2); // Le nouveau doit être ajouté
  });

  // --- Tests pour deleteParkings --- 
  it('should handle deleteParkings.fulfilled', () => {
    const remainingParkings = [mockParking2]; // Simuler la réponse qui contient les parkings restants
    const action = { 
      type: deleteParkings.fulfilled.type, 
      payload: { parkings: remainingParkings } // La réponse contient un objet avec la nouvelle liste
    };
     // Partir d'un état qui contient les deux parkings
    const previousState: ParkingState = { ...initialStateTest, parkings: [mockParking1, mockParking2] };
    const state = reducer(previousState, action);

    expect(state.loading).toBe(false); // Géré par le matcher
    expect(state.parkings.length).toBe(1);
    expect(state.parkings).toEqual(remainingParkings); // La liste doit être remplacée
  });
}); 