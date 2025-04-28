import { useState, useCallback } from 'react';
import { ParkingData, AirlineData, AirportData } from '@fyg/shared'; // Assuming shared types
import { CountryStats, ProcessedAirline } from '../types'; // Local types if needed

// Define the types for the data each dialog might need
type DialogDataType = {
  parking?: ParkingData | null; // For Add/Edit form
  airportDetails?: { icao: string; name: string; parkings: ParkingData[] }; // For ParkingDialog
  country?: CountryStats | null; // For CountryDetailsDialog
  airline?: ProcessedAirline | null; // For AirlineDetailsDialog
  addFormInitialData?: { airport?: string }; // For AddParking
  // Add other data types if needed (e.g., for import summary)
};

// Define which dialog is currently open
type DialogType =
  | 'addParking'
  | 'editParking'
  | 'airportDetails'
  | 'countryStats'
  | 'countryDetails'
  | 'airportGlobe'
  | 'airlineStats'
  | 'airlineDetails'
  | null;

export const useDialogManager = () => {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [dialogData, setDialogData] = useState<DialogDataType>({});

  const openDialog = useCallback((type: DialogType, data: DialogDataType = {}) => {
    // console.log(`Opening dialog: ${type}`, data); // Debug log
    setDialogData(data);
    setActiveDialog(type);
  }, []);

  const closeDialog = useCallback(() => {
    // console.log('Closing dialog'); // Debug log
    setActiveDialog(null);
    setDialogData({}); // Clear data on close
  }, []);

  // Convenience functions for opening specific dialogs
  const openAddForm = useCallback((initialData?: { airport?: string }) => 
    openDialog('addParking', { addFormInitialData: initialData }), 
    [openDialog]
  );
  const openEditForm = useCallback((parking: ParkingData) => 
    openDialog('editParking', { parking }), 
    [openDialog]
  );
  const openAirportDetails = useCallback((icao: string, name: string, parkings: ParkingData[]) => 
    openDialog('airportDetails', { airportDetails: { icao, name, parkings } }), 
    [openDialog]
  );
  const openCountryStats = useCallback(() => openDialog('countryStats'), [openDialog]);
  const openCountryDetails = useCallback((country: CountryStats) => openDialog('countryDetails', { country }), [openDialog]);
  const openAirportGlobe = useCallback(() => openDialog('airportGlobe'), [openDialog]);
  const openAirlineStats = useCallback(() => openDialog('airlineStats'), [openDialog]);
  const openAirlineDetails = useCallback((airline: ProcessedAirline) => openDialog('airlineDetails', { airline }), [openDialog]);


  // Return state and actions
  return {
    activeDialog,
    dialogData,
    openDialog, // General purpose opener if needed
    closeDialog,

    // Specific openers
    openAddForm,
    openEditForm,
    openAirportDetails,
    openCountryStats,
    openCountryDetails,
    openAirportGlobe,
    openAirlineStats,
    openAirlineDetails,

    // Simplify access to specific data for convenience
    editingParkingData: activeDialog === 'editParking' ? (dialogData.parking ?? null) : null,
    addParkingInitialData: activeDialog === 'addParking' ? (dialogData.addFormInitialData ?? {}) : {},
    selectedAirportData: activeDialog === 'airportDetails' ? (dialogData.airportDetails ?? null) : null,
    selectedCountryData: activeDialog === 'countryDetails' ? (dialogData.country ?? null) : null,
    selectedAirlineData: activeDialog === 'airlineDetails' ? (dialogData.airline ?? null) : null,
  };
}; 