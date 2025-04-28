import { configureStore } from '@reduxjs/toolkit';
import parkingReducer from './parkingSlice';
import airlinesReducer from './airlinesSlice';
import airportsReducer from './airportsSlice';

export const store = configureStore({
  reducer: {
    parkingsList: parkingReducer,
    airlines: airlinesReducer,
    airports: airportsReducer,
  }
});

// Types inférés du store pour le typage TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 