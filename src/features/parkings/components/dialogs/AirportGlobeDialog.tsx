import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, Public as PublicIcon, Search as SearchIcon, RestartAlt as RestartAltIcon } from '@mui/icons-material';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { AirportData /*, ParkingData */ } from '../../../../../packages/shared/src/types';
import countries from "i18n-iso-countries";
import frLocale from "i18n-iso-countries/langs/fr.json";
import { useDebounce } from '../../../../hooks/useDebounce';

// Enregistrer la locale
countries.registerLocale(frLocale);

// --- Configuration Cesium --- 
// Définir le token d'accès Cesium Ion
// Vite remplacera `import.meta.env.VITE_CESIUM_TOKEN` par sa valeur réelle lors du build.
// S'il n'est pas défini pendant le build, cela résultera en `undefined`, ce qui est préférable au fallback.
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

// Couleurs des points
const defaultPointColor = Cesium.Color.ORANGE;
// const highlightedPointColor = Cesium.Color.YELLOW; // On retire pour l'instant

interface AirportGlobeDialogProps {
  open: boolean;
  onClose: () => void;
  airportsData: AirportData[];
  allParkingAirportIcaos: string[];
}

export const AirportGlobeDialog: React.FC<AirportGlobeDialogProps> = ({
  open,
  onClose,
  airportsData,
  allParkingAirportIcaos
}) => {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [cesiumInitialized, setCesiumInitialized] = useState(false);
  const [tooltipReady, setTooltipReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour définir la vue initiale/reset (Europe/France)
  const setInitialView = useCallback(() => {
    if (!viewerRef.current) return;
    console.log("[AirportGlobe] Setting initial/reset view (Europe/France).");
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(10, 45, 15000000), // Lon, Lat, Altitude (~15000km)
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-90.0), // Vue du dessus
        roll: 0.0
      },
      duration: 1.5 // Durée de l'animation
    });
  }, []);

  // ---- LOGGING PROPS ON RENDER ----
  useEffect(() => {
    console.log(`[AirportGlobe] Props reçues - airportsData: ${airportsData?.length}, allParkingAirportIcaos: ${allParkingAirportIcaos?.length}`);
  }, [airportsData, allParkingAirportIcaos]);

  // Calculer parkingIcaos à partir de la prop allParkingAirportIcaos
  const parkingIcaos = useMemo(() => {
    // Créer un Set directement depuis la prop
    const icaos = new Set(allParkingAirportIcaos || []); 
    console.log(`[AirportGlobe] parkingIcaos créé depuis prop. Taille: ${icaos.size}`);
    return icaos;
  }, [allParkingAirportIcaos]);

  // Filtrer les données des aéroports
  const relevantAirports = useMemo(() => {
    if (!Array.isArray(airportsData) || airportsData.length === 0 || parkingIcaos.size === 0) {
      return [];
    }
    const filtered = airportsData.filter(airport => {
      const hasIcao = !!airport.icao;
      const icaoInParkings = hasIcao && parkingIcaos.has(airport.icao);
      const hasCoords = airport.latitude != null && airport.longitude != null;
      // Log pour chaque aéroport pendant le filtrage (peut être verbeux)
      // console.log(`[AirportGlobe] Filtre pour ${airport.icao}: inParkings=${icaoInParkings}, hasCoords=${hasCoords}`);
      return hasIcao && icaoInParkings && hasCoords;
    });
    console.log(`[AirportGlobe] relevantAirports calculé. Taille: ${filtered.length}`); // Log taille
    if(filtered.length === 0 && airportsData.length > 0 && parkingIcaos.size > 0) {
        console.warn("[AirportGlobe] Le filtre a supprimé TOUS les aéroports pertinents. Vérifiez les ICAO/coordonnées.");
    }
    return filtered;
  }, [airportsData, parkingIcaos]);

  // Filtrer les aéroports pertinents en fonction de la recherche
  const searchedAirports = useMemo(() => {
    if (!debouncedSearchTerm) {
      return relevantAirports;
    }
    const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
    const filteredSearch = relevantAirports.filter(airport =>
      airport.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      airport.icao?.toLowerCase().includes(lowerCaseSearchTerm) ||
      airport.city?.toLowerCase().includes(lowerCaseSearchTerm) ||
      airport.country?.toLowerCase().includes(lowerCaseSearchTerm)
    );
    return filteredSearch;
  }, [relevantAirports, debouncedSearchTerm]);

  // Callback Ref pour le conteneur Cesium
  const cesiumContainerRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node && open && !viewerRef.current) {
      try {
        const viewer = new Cesium.Viewer(node, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          // requestRenderMode: true, // << COMMENTER TEMPORAIREMENT
          maximumRenderTimeChange: Infinity
        });
        // Optionnel: Changer la couche de base après l'initialisation si besoin
        // viewer.imageryLayers.removeAll();
        // viewer.imageryLayers.addImageryProvider(new Cesium.TileMapServiceImageryProvider({
        //   url : Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        // }));

        viewerRef.current = viewer;
        setCesiumInitialized(true);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de Cesium:", error);
      }
    }
  }, [open]);

  // Effet pour le nettoyage
  useEffect(() => {
    if (!open && viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        setCesiumInitialized(false);
    }
  }, [open]);

  // Ajouter les points des aéroports
  useEffect(() => {
    if (!cesiumInitialized || !viewerRef.current) return;

    const viewer = viewerRef.current;
    viewer.entities.removeAll(); 

    setIsLoading(true); 
    
    try { 
      let addedCount = 0;
      searchedAirports.forEach(airport => {
        if (airport.latitude != null && airport.longitude != null) {
          try {
            const position = Cesium.Cartesian3.fromDegrees(airport.longitude, airport.latitude);
            viewer.entities.add({
              id: airport.icao,
              position: position,
              point: {
                pixelSize: 10,
                color: defaultPointColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1
              },
              properties: {
                name: airport.name,
                icao: airport.icao,
                city: airport.city || 'N/A',
                country: airport.country,
                parkingCount: airport.parkingCount ?? 0
              }
            });
            addedCount++;
          } catch (e) {
            console.warn(`Erreur lors de l'ajout de l'aéroport ${airport.icao}:`, e);
          }
        }
      });
      console.log(`[AirportGlobe] Boucle d'ajout terminée. ${addedCount} entités ajoutées.`);

      // --- LOGIQUE DE ZOOM MISE À JOUR --- 
      if (debouncedSearchTerm && searchedAirports.length === 1) {
        // Zoom sur résultat unique (inchangé)
        const targetIcao = searchedAirports[0].icao;
        const targetEntity = viewer.entities.getById(targetIcao);
        if (targetEntity) {
          console.log(`[AirportGlobe] Recherche unique pour ${targetIcao}, zoom sur l'entité.`);
          viewer.flyTo(targetEntity, { 
             duration: 1.5,
             offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 50000) 
          });
        } else {
          console.warn(`[AirportGlobe] Impossible de trouver l'entité pour ${targetIcao} pour le zoom.`);
          // Fallback sur la vue initiale si l'entité n'est pas trouvée
          setInitialView(); 
        }
      } else if (!debouncedSearchTerm && viewer.entities.values.length > 0) {
        // Si PAS de recherche et des points existent: Vue initiale Europe/France
        setInitialView();
      } else if (debouncedSearchTerm && viewer.entities.values.length > 0) {
        // Si recherche avec PLUSIEURS résultats: Zoom sur l'étendue des résultats
        console.log(`[AirportGlobe] Zoom sur l'étendue des ${viewer.entities.values.length} résultats.`);
         viewer.flyTo(viewer.entities, { 
           duration: 1.5,
           offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-60), 0)
         });
      } else {
        // Si aucun résultat (avec ou sans recherche): Vue initiale Europe/France
        setInitialView();
      }
      // --- FIN LOGIQUE DE ZOOM --- 

    } catch (err) {
        console.error("Error during entity processing or flyTo:", err);
    } finally {
        setIsLoading(false); 
    }

  }, [cesiumInitialized, searchedAirports, debouncedSearchTerm, setInitialView]);

  // Effacer la recherche quand le dialogue se ferme
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      // Optionnel: remettre la vue initiale si elle avait été zoomée
      // setInitialView(); // Décommenter si besoin
    }
  }, [open]);

  // Callback Ref pour le div du Tooltip
  const tooltipRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      tooltipRef.current = node;
      setTooltipReady(true);
    } else {
      tooltipRef.current = null;
      setTooltipReady(false);
    }
  }, []); 

  // Effet pour gérer le handler MOUSE_MOVE
  useEffect(() => {
    if (!cesiumInitialized || !viewerRef.current?.scene?.canvas || !tooltipReady) return;
    
    const viewer = viewerRef.current;
    const tooltipElement = tooltipRef.current; 
    if (!tooltipElement) return;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const pickedObject = viewer.scene.pick(movement.endPosition);
      if (tooltipElement) { 
          if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id) && Cesium.defined(pickedObject.id.properties)) {
              const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
              if (cartesian) {
                   const properties = pickedObject.id.properties;
                   const name = properties.name?.getValue() || 'N/A';
                   const icao = properties.icao?.getValue() || 'N/A';
                   const city = properties.city?.getValue() || 'N/A';
                   const country = properties.country?.getValue() || 'N/A';
                   const parkingCount = properties.parkingCount?.getValue() ?? 'N/A';
                   const countryName = countries.getName(country, "fr", { select: "official" }) || country;
                   const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                   const longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
                   const latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);

                  tooltipElement.style.left = `${movement.endPosition.x + 10}px`;
                  tooltipElement.style.top = `${movement.endPosition.y + 10}px`;
                  tooltipElement.style.display = 'block';
                  tooltipElement.innerHTML = `
                    <span style="background-color: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px; font-size: 0.95em;">${icao}</span>
                    <strong style="font-size: 1.05em;">${name}</strong><br/>
                    <span style="color: #cbd5e1; margin-left: 5px;">Ville:</span> ${city}<br/>
                    <span style="color: #cbd5e1; margin-left: 5px;">Pays:</span> ${countryName}<br/>
                    <span style="color: #a5b4fc; margin-left: 5px;">Parkings:</span> <strong style="color: #4caf50;">${parkingCount}</strong><br/>
                    <span style="color: #9ca3af; font-size: 0.9em; margin-left: 5px;">Lat: ${latitudeString}, Lon: ${longitudeString}</span>
                  `;
                  viewer.scene.requestRender();
              } else {
                  tooltipElement.style.display = 'none';
                  viewer.scene.requestRender();
              }
          } else {
              tooltipElement.style.display = 'none';
              viewer.scene.requestRender();
          }
      } 
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => { handler.destroy(); };
  }, [cesiumInitialized, tooltipReady]); 

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { height: '85vh', bgcolor: '#111827', color: '#d1d5db' } }}>
      <DialogTitle sx={{ bgcolor: '#374151', color: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '12px 24px' }}>
        {/* Partie Gauche: Titre */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PublicIcon />
          <Typography variant="h6" component="div">Visualisation Globale des Aéroports</Typography>
        </Box>

        {/* Partie Droite: Recherche et Reset */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
           <TextField
             id="airport-search-field"
             variant="outlined"
             size="small"
             placeholder="Rechercher (Nom, ICAO, Ville, Pays)..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             sx={{
               mr: 1,
               width: '300px', // Ajuster la largeur
               '& .MuiInputBase-root': {
                 backgroundColor: 'rgba(17, 24, 39, 0.5)', // Fond sombre semi-transparent
                 borderRadius: 1,
               },
               input: { color: '#e5e7eb' }, 
               '& .MuiOutlinedInput-root': {
                 '& fieldset': { borderColor: '#4b5563' },
                 '&:hover fieldset': { borderColor: '#6b7280' },
                 '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
               },
               '& .MuiInputAdornment-root': { color: '#9ca3af' }
             }}
             InputProps={{
               startAdornment: (
                 <InputAdornment position="start">
                   <SearchIcon fontSize="small"/>
                 </InputAdornment>
               ),
             }}
           />
           <IconButton 
             aria-label="Réinitialiser la vue"
             onClick={() => {
               setSearchTerm('');
               setInitialView();
             }} 
             size="small"
             sx={{ 
               color: '#9ca3af',
               bgcolor: 'rgba(75, 85, 99, 0.5)',
               '&:hover': {
                  bgcolor: 'rgba(107, 114, 128, 0.5)' 
               }
             }}
             title="Réinitialiser la vue"
           >
             <RestartAltIcon fontSize="small" />
           </IconButton>
         </Box>
      </DialogTitle>
      <DialogContent sx={{ 
        p: 0, 
        overflow: 'hidden', 
        position: 'relative',
        '& .cesium-widget-credits': { 
            display: 'block',
            '& img': { display: 'inline !important'},
            '& a, & span': { display: 'none !important' }
        }
      }}> 
        {(isLoading || !cesiumInitialized) && (
           <Box sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              backgroundColor: 'rgba(17, 24, 39, 0.8)',
              zIndex: 10
            }}>
              <CircularProgress color="inherit" sx={{ mb: 2 }}/>
              <Typography color="inherit">
                {isLoading ? "Chargement des données des aéroports..." : "Initialisation du globe..."}
              </Typography>
           </Box>
        )}
        <div ref={cesiumContainerRefCallback} style={{ width: '100%', height: '100%' }} />

        <div
          ref={tooltipRefCallback}
          style={{
            position: 'absolute',
            display: 'none',
            backgroundColor: 'rgba(30, 41, 59, 0.92)',
            color: '#e5e7eb',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(75, 85, 99, 0.6)',
            fontSize: '13px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
            lineHeight: '1.4',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)'
          }}
        />

      </DialogContent>
      <DialogActions sx={{ p: 1, bgcolor: '#1f2937', borderTop: '1px solid #374151' }}>
        <Button onClick={onClose} startIcon={<CloseIcon />} variant="outlined" sx={{ color: '#9ca3af', borderColor: '#4b5563', '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' }}}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 