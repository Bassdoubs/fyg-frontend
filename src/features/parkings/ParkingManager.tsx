import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchParkings, 
  addParking, 
  updateParking, 
  deleteParkings,
  bulkImportParkings,
  selectLoading, 
  selectError, 
  selectParkings,
  selectCurrentPage, 
  selectTotalDocs,
  fetchAllParkingAirportIcaos,
  selectAllParkingAirportIcaos
} from '../../store/parkingSlice';
import { selectAirlines, fetchAirlines } from '../../store/airlinesSlice';
import { selectAirports, fetchAirports } from '../../store/airportsSlice';
import { ParkingDialog } from './components/ParkingDialog';
import { AirportGrid } from './components/AirportGrid';
import { ToolBar } from './components/ToolBar';
import { Alert, Snackbar, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { AppHeader } from './components/AppHeader';
import { AddParking } from './components/ParkingForm/AddParking';
import { EditParking } from './components/ParkingForm/EditParking';
import { ImportSummaryDialog } from '../import/components/ImportSummaryDialog';
import { useParkingActions } from './hooks/useParkingActions';
import { useGlobalStats } from './hooks/useGlobalStats';
import { StatsGrid } from './components/stats/StatsGrid';
import { AirportGlobeDialog } from './components/dialogs/AirportGlobeDialog';
import { AirlineStatsDialog } from './components/dialogs/AirlineStatsDialog';
import { AirlineDetailsDialog } from './components/dialogs/AirlineDetailsDialog';
import { useAirlineStats } from './hooks/useAirlineStats';
import { ParkingData /*, AirlineData, Airport*/ } from '../../../packages/shared/src/types';
import { AppDispatch } from '../../store/store';
import { useDialogManager } from './hooks/useDialogManager';
import { useSnackbarManager } from './hooks/useSnackbarManager';
import { useParkingViewControls } from './hooks/useParkingViewControls';
import { Pagination as CustomPagination } from './components/Pagination';
import { ConfirmDialog } from '../../components/ConfirmDialog';

// Ajouter les imports dynamiques
const CountryStatsDialog = lazy(() => import('./components/dialogs/CountryStatsDialog').then(module => ({ default: module.CountryStatsDialog })));
const CountryDetailsDialog = lazy(() => import('./components/dialogs/CountryDetailsDialog').then(module => ({ default: module.CountryDetailsDialog })));

// Définir une interface pour les objets de tri utilisés par le composant
interface SortOptionObject {
  value: string; // Garde la valeur envoyée au backend (ex: '-updatedAt')
  label: string;
}

// Redéfinir le tableau avec le nouveau type
const sortOptions: SortOptionObject[] = [
  { value: '-updatedAt', label: 'Date MàJ (Récent)' }, 
  { value: 'updatedAt', label: 'Date MàJ (Ancien)' }, 
  { value: 'airport', label: 'Aéroport (A-Z)' },
  { value: '-parkingCount', label: 'Parkings (Décroissant)' }, 
];

// Définir l'option par défaut en utilisant le nouveau type
const defaultSortOption: SortOptionObject = sortOptions[0]; // '-updatedAt'

interface ParkingManagerProps {
  showLogoutButton?: boolean;
}

export const ParkingManager = ({ showLogoutButton = true }: ParkingManagerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const airportGroups = useSelector(selectParkings);
  const currentPageFromStore = useSelector(selectCurrentPage);
  const totalDocs = useSelector(selectTotalDocs);
  const isLoadingParkings = useSelector(selectLoading);
  const errorParkings = useSelector(selectError);
  const airlines = useSelector(selectAirlines);
  const airports = useSelector(selectAirports);
  const allParkingAirportIcaos = useSelector(selectAllParkingAirportIcaos);

  const { processedAirlines, loading: airlineStatsLoadingLocal } = useAirlineStats();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const dialogManager = useDialogManager();
  const { snackbarState, showSnackbar, handleCloseSnackbar } = useSnackbarManager();
  const { 
    searchTerm, 
    viewMode, 
    handleSearch 
  } = useParkingViewControls(undefined, 'grid');

  // Garder l'état local pour l'objet de tri complet
  const [selectedSortObject, setSelectedSortObject] = useState<SortOptionObject>(defaultSortOption);
  
  // Remettre l'état pour importSummary
  const [importSummary, setImportSummary] = useState<{ 
    open: boolean;
    summary: { total: number; inserted: number; duplicates: number };
    duplicateDetails: Array<{ airline: string; airport: string; reason: string }>;
    status: 'success' | 'partial';
  }>({ 
    open: false, 
    summary: { total: 0, inserted: 0, duplicates: 0 }, 
    duplicateDetails: [], 
    status: 'success' 
  });
  
  // Calculer la liste plate des parkings à partir des groupes
  const allParkingsData = useMemo(() => {
    return airportGroups.flatMap(group => group.parkings);
  }, [airportGroups]);

  const parkingsToDisplay = airportGroups;

  const { 
    globalStats, 
    statsLoading, 
    countryStats,
    getCountryGroupCount,
    getTotalUniqueCountries
  } = useGlobalStats();
  const { selectedParkings: derivedSelectedParkings, handleSelect: derivedHandleSelect, handleSelectAll: derivedHandleSelectAll, clearSelection: derivedClearSelection } = useParkingActions();

  // State pour la confirmation de suppression de parkings
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  // Nouvel état pour stocker les détails des parkings à supprimer
  const [parkingsToDeleteDetails, setParkingsToDeleteDetails] = useState<ParkingData[]>([]); 

  // Charger les entités (airlines, airports) ET les ICAO uniques au montage via Redux
  useEffect(() => {
    dispatch(fetchAirlines());
    dispatch(fetchAirports());
    dispatch(fetchAllParkingAirportIcaos());
  }, [dispatch]);

  // triggerFetch utilise selectedSortObject.value (inchangé)
  const triggerFetch = useCallback((pageToFetch = currentPage) => {
    dispatch(fetchParkings({ 
      page: pageToFetch, 
      limit: rowsPerPage,
      search: searchTerm || undefined,
      sort: selectedSortObject.value 
    }));
  }, [dispatch, currentPage, searchTerm, selectedSortObject, rowsPerPage]);

  // Fetch parkings when page, rowsPerPage, searchTerm, or sortBy changes
  useEffect(() => {
    triggerFetch();
  // Add ALL dependencies that should trigger a refetch
  }, [triggerFetch]); 

  // Effect to reset to page 1 when filters change (rowsPerPage is handled separately)
  useEffect(() => {
    // Only reset if search or sort changes and we are not already on page 1
    if ((searchTerm !== undefined) && currentPage !== 1) { 
        setCurrentPage(1);
    }
  }, [searchTerm]); // Removed currentPage from dependencies

  useEffect(() => {
    if (currentPageFromStore !== currentPage) {
      // This sync might cause issues if Redux updates slower than local state
      // Consider if this is strictly necessary
      // setCurrentPage(currentPageFromStore);
    }
  }, [currentPageFromStore]);

  useEffect(() => {
    if (errorParkings) {
      showSnackbar(`Erreur: ${errorParkings}`, 'error');
    }
  }, [errorParkings, showSnackbar]);

  useEffect(() => {
    if (dialogManager.activeDialog !== 'airportDetails' && derivedSelectedParkings.length > 0) {
      derivedClearSelection();
    }
  }, [dialogManager.activeDialog, derivedClearSelection, derivedSelectedParkings.length]);

  const handlePageChange = (newPageZeroBased: number) => {
    setCurrentPage(newPageZeroBased + 1);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    if (currentPage !== 1) {
        setCurrentPage(1);
    }
    setRowsPerPage(newRowsPerPage);
  };

  // Adapter handleSort pour qu'elle prenne l'objet mais stocke la valeur si nécessaire
  // Ou mieux, passer la bonne fonction à ToolBar si elle attend une string
  // Solution: Garder handleSort avec SortOptionObject, mais adapter la prop pour ToolBar
  const handleSortChange = (option: SortOptionObject) => {
      setSelectedSortObject(option);
      if (currentPage !== 1) {
         setCurrentPage(1);
      }
  };

  const handleDeleteSelected = (ids: string[]) => {
    if (!ids.length) return;
    console.log("[handleDeleteSelected] Demande de suppression pour IDs:", ids);
    
    // Trouver les détails des parkings correspondants
    const details = dialogManager.selectedAirportData?.parkings.filter(p => ids.includes(p._id)) || [];
    
    setIdsToDelete(ids);
    setParkingsToDeleteDetails(details); // Stocker les détails
    setConfirmDeleteOpen(true);
  };

  // Nouvelle fonction pour exécuter la suppression après confirmation
  const executeDeleteParkings = async () => {
    setConfirmDeleteOpen(false); 
    console.log("[executeDeleteParkings] Confirmation pour IDs:", idsToDelete);
    try {
      const resultAction = await dispatch(deleteParkings(idsToDelete)).unwrap();
      showSnackbar(`${resultAction.deletedCount} parkings supprimés avec succès`, 'success');
      derivedClearSelection(); // Effacer la sélection dans le ParkingDialog

      // Fermer systématiquement le dialogue de détails après suppression
      if (dialogManager.activeDialog === 'airportDetails') {
          dialogManager.closeDialog();
      }
      
      // Rafraîchir la liste principale (important si le dialogue est fermé)
      // Déclencher un re-fetch pour la page actuelle ou la première page
      triggerFetch(currentPage); // Ou triggerFetch(1) pour revenir à la page 1
      
      /* Ancienne logique de changement de page (peut être redondante si on ferme toujours)
      const fetchAction = await dispatch(fetchParkings({
          page: 1,
          limit: rowsPerPage,
          search: searchTerm || undefined,
          sort: selectedSortObject.value
      })).unwrap();
      const newTotalPages = fetchAction.totalPages;

      if (currentPage > newTotalPages && newTotalPages > 0) {
         setCurrentPage(newTotalPages);
      } else if (currentPage > 1 && fetchAction.docs.length === 0 && parkingsToDisplay.length === idsToDelete.length) {
         setCurrentPage(prev => prev - 1);
      } 
      */
      
      /* Ancienne logique de fermeture conditionnelle
       if (dialogManager.activeDialog === 'airportDetails' &&
           dialogManager.selectedAirportData &&
           dialogManager.selectedAirportData.parkings.length === idsToDelete.length && 
           dialogManager.selectedAirportData.parkings.every(p => idsToDelete.includes(p._id)))
       {
         dialogManager.closeDialog();
       }
       */
    } catch (error) {
      console.error("Erreur lors de la suppression confirmée:", error); // Log l'erreur réelle
      showSnackbar('Erreur lors de la suppression multiple', 'error');
    } finally {
       setIdsToDelete([]); 
       setParkingsToDeleteDetails([]); // Nettoyer aussi les détails
    }
  };

  const handleAddParking = async (parking: Omit<ParkingData, '_id'>) => {
      // === Log de débogage pour les données d'ajout ===
      console.log("[handleAddParking] Données reçues du formulaire:", JSON.stringify(parking, null, 2));
      // ==============================================
      try {
          await dispatch(addParking(parking)).unwrap();
          // Afficher le Snackbar AVANT de fermer le dialogue
          showSnackbar('Parking ajouté avec succès', 'success');
          dialogManager.closeDialog();
          // Utiliser la valeur de l'objet sélectionné
          if (currentPage !== 1) {
            setCurrentPage(1); // Will trigger fetch via useEffect
          } else {
             dispatch(fetchParkings({ 
                page: 1, limit: rowsPerPage, search: searchTerm || undefined, sort: selectedSortObject.value
            }));
          }
      } catch (error: any) { 
          console.error("--- Erreur Attrapée dans handleAddParking ---");
          console.error("Erreur complète:", error);
          console.error("Erreur response:", error?.response);
          console.error("Erreur response data:", error?.response?.data);
          const specificMessage = error.response?.data?.message;
          console.error("Message spécifique extrait:", specificMessage);
          showSnackbar(specificMessage || 'Erreur lors de l\'ajout', 'error');
          console.error("--- Fin Erreur --- ");
      }
  };

  const handleUpdateParking = async (id: string, parkingData: Partial<Omit<ParkingData, '_id' | 'createdAt' | 'updatedAt'>>) => {
      if (!dialogManager.editingParkingData) return; 
      try {
          const completeData = {
              ...dialogManager.editingParkingData,
              ...parkingData,
              gate: { 
                  terminal: parkingData.gate?.terminal ?? dialogManager.editingParkingData.gate?.terminal ?? '',
                  porte: parkingData.gate?.porte ?? dialogManager.editingParkingData.gate?.porte ?? ''
              },
              mapInfo: { 
                  hasMap: parkingData.mapInfo?.hasMap ?? dialogManager.editingParkingData.mapInfo?.hasMap ?? false,
                  mapUrl: parkingData.mapInfo?.mapUrl ?? dialogManager.editingParkingData.mapInfo?.mapUrl ?? '',
                  source: parkingData.mapInfo?.source ?? dialogManager.editingParkingData.mapInfo?.source ?? ''
              },
              updatedAt: new Date().toISOString()
          };
          await dispatch(updateParking({ id, parking: completeData })).unwrap();
          dialogManager.closeDialog();
          showSnackbar('Parking mis à jour avec succès', 'success');
          // Utiliser la valeur de l'objet sélectionné
          dispatch(fetchParkings({ 
                page: currentPage, 
                limit: rowsPerPage,
                search: searchTerm || undefined, 
                sort: selectedSortObject.value
            }));
      } catch (error) {
          showSnackbar('Erreur lors de la mise à jour', 'error');
      }
  };

  const importParkings = async (newParkings: Array<Omit<ParkingData, '_id'>>) => {
    try {
      const result = await dispatch(bulkImportParkings(newParkings)).unwrap();
      
      const importStats = {
        total: newParkings.length,
        inserted: result.summary?.inserted ?? 0,
        duplicates: result.summary?.duplicates ?? 0
      };
      
      setImportSummary({
        open: true,
        summary: importStats,
        duplicateDetails: result.duplicateDetails || [],
        status: result.status || 'success'
      });
      
      showSnackbar(`${result.summary?.inserted ?? 0} parkings importés sur ${newParkings.length}`, 'success');

      // Utiliser la valeur de l'objet sélectionné
      if (currentPage !== 1) {
          setCurrentPage(1); // Will trigger fetch via useEffect
      } else {
           dispatch(fetchParkings({ 
                page: 1, limit: rowsPerPage, search: searchTerm || undefined, sort: selectedSortObject.value
            }));
      }
      
      return {
        status: result.status || 'success',
        summary: importStats,
        duplicateDetails: result.duplicateDetails || []
      };
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      showSnackbar('Erreur lors de l\'importation des parkings', 'error');
      return {
        status: 'success' as const,
        summary: { total: 0, inserted: 0, duplicates: 0 },
        duplicateDetails: []
      };
    }
  };

  const logout = () => {
    console.log("Déconnexion"); 
  };

  return (
    <div className={`w-full transition-colors`}>
      {showLogoutButton && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <AppHeader 
            title="Gestion des Parkings" 
            onLogout={logout} 
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <StatsGrid
          stats={globalStats}
          loading={statsLoading}
          onCountryClick={dialogManager.openCountryStats}
          onAirportClick={dialogManager.openAirportGlobe}
          countryCount={getCountryGroupCount()}
          onAirlineClick={dialogManager.openAirlineStats}
        />
      </motion.div>

      <div className="container mx-auto px-4 pt-8 rounded-xl shadow-lg bg-white/60 dark:bg-gray-800/40 backdrop-blur-md border border-white/50 dark:border-blue-500/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <ToolBar 
          parkings={allParkingsData}
            onImport={importParkings} 
            onAddNew={dialogManager.openAddForm}
            onSearch={handleSearch}
            onSort={(sortByValue: string) => { 
               const foundOption = sortOptions.find(opt => opt.value === sortByValue);
               if (foundOption) {
                 handleSortChange(foundOption);
               } else {
                 console.warn(`Sort option value "${sortByValue}" not found in sortOptions`);
               }
            }}
            sortOptions={sortOptions}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {isLoadingParkings && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />} 
          {errorParkings && <Alert severity="error">{errorParkings}</Alert>}
          {!isLoadingParkings && !errorParkings && parkingsToDisplay && (
            <> 
              {viewMode === 'grid' && (
                 <AirportGrid 
                   parkings={parkingsToDisplay}
                   onAirportSelect={(airportICAO, parkingsInGroup) => {
                       // Chercher le nom de l'aéroport dans la liste chargée
                       const airportInfo = airports.find(a => a.icao === airportICAO);
                       const airportName = airportInfo?.name || airportICAO; // Utiliser le nom trouvé ou ICAO
                       dialogManager.openAirportDetails(airportICAO, airportName, parkingsInGroup);
                   }}
                   isLoading={isLoadingParkings}
                 />
              )}
            </>
          )}
        </motion.div>
        
        {!isLoadingParkings && !errorParkings && totalDocs > 0 && (
          <CustomPagination 
            count={totalDocs}
            page={currentPage - 1}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}

        <ParkingDialog
          open={dialogManager.activeDialog === 'airportDetails'}
          onClose={dialogManager.closeDialog}
          airportICAO={dialogManager.selectedAirportData?.icao ?? ''} 
          airportName={dialogManager.selectedAirportData?.name ?? ''}
          parkings={dialogManager.selectedAirportData?.parkings ?? []}
          onEdit={dialogManager.openEditForm}
          onDelete={handleDeleteSelected}
          onAdd={() => {
              const airportICAO = dialogManager.selectedAirportData?.icao; // Récupérer l'ICAO ici
              if (airportICAO) {
                  dialogManager.openAddForm({ airport: airportICAO }); 
              } else {
                  console.warn("Impossible de récupérer l'ICAO de l'aéroport sélectionné pour l'ajout.");
                  dialogManager.openAddForm();
              }
          }} 
          selectedParkings={derivedSelectedParkings}
          onSelect={derivedHandleSelect}
          onSelectAll={(checked: boolean) => derivedHandleSelectAll(dialogManager.selectedAirportData?.parkings ?? [], checked)}
        />
        
        <AddParking
          open={dialogManager.activeDialog === 'addParking'}
          onClose={dialogManager.closeDialog}
          onSubmit={handleAddParking}
          initialData={dialogManager.addParkingInitialData}
        />

        {dialogManager.activeDialog === 'editParking' && dialogManager.editingParkingData && (
          <EditParking
            open={true}
            onClose={dialogManager.closeDialog}
            parking={dialogManager.editingParkingData}
            onSubmit={handleUpdateParking}
          />
        )}

        <Snackbar
          open={snackbarState.open}
          autoHideDuration={10000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarState.severity} sx={{ width: '100%' }}>
            {snackbarState.message}
          </Alert>
        </Snackbar>

        <ImportSummaryDialog
          open={importSummary.open}
          onClose={() => setImportSummary(prev => ({ ...prev, open: false }))}
          summary={importSummary.summary}
          duplicateDetails={importSummary.duplicateDetails}
          status={importSummary.status}
        />

        {/* Envelopper les dialogues dans Suspense */}
        <Suspense fallback={<CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}>
          {dialogManager.activeDialog === 'countryStats' && (
            <CountryStatsDialog
              open={true} // Ouvert si activeDialog correspond
              onClose={dialogManager.closeDialog}
              countryStats={countryStats}
              totalCountries={getTotalUniqueCountries()}
              onCountryClick={dialogManager.openCountryDetails}
            />
          )}

          {dialogManager.activeDialog === 'countryDetails' && (
             <CountryDetailsDialog
               open={true} // Ouvert si activeDialog correspond
               onClose={dialogManager.closeDialog}
               country={dialogManager.selectedCountryData}
               airportsData={airports}
             />
           )}
        </Suspense>

        <AirportGlobeDialog
          open={dialogManager.activeDialog === 'airportGlobe'}
          onClose={dialogManager.closeDialog}
          airportsData={airports}
          allParkingAirportIcaos={allParkingAirportIcaos}
        />

        <AirlineStatsDialog
          open={dialogManager.activeDialog === 'airlineStats'}
          onClose={dialogManager.closeDialog}
          airlinesData={processedAirlines}
          isLoading={airlineStatsLoadingLocal}
          onAirlineClick={dialogManager.openAirlineDetails}
        />

         <AirlineDetailsDialog
            open={dialogManager.activeDialog === 'airlineDetails'}
            onClose={dialogManager.closeDialog}
            airline={airlines.find(a => a.icao === dialogManager.selectedAirlineData?.icao) || null}
            parkings={allParkingsData}
            airportsData={airports}
          />
      </div>

      {/* Dialogue de confirmation pour la suppression de parkings */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => { 
            setConfirmDeleteOpen(false); 
            setIdsToDelete([]); 
            setParkingsToDeleteDetails([]); // Nettoyer les détails en cas d'annulation
        }}
        onConfirm={executeDeleteParkings}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${idsToDelete.length} parking(s) sélectionné(s) ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        severity="warning" 
        // Passer les détails au dialogue
        parkings={parkingsToDeleteDetails} 
      />

    </div>
  );
};