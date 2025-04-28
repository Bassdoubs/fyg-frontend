import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  Badge,
  Tabs,
  Tab,
  Container,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  AddCircle as AddCircleIcon,
  SortByAlpha as SortByAlphaIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { AddParking } from '../parkings/components/ParkingForm/AddParking';
import { EditParking } from '../parkings/components/ParkingForm/EditParking';
import discordFeedbackService from '../../services/discordFeedbackService';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';

// Utilisation de 'any' pour simplifier les types après séparation
// interface FeedbackItem { ... }
// interface FeedbackStats { ... }

// Composant principal de gestion des feedbacks Discord
const DiscordFeedbackManager: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // États
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Fonction pour charger les feedbacks
  const loadFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      let relativeUrl = `/discord-feedback?page=${page}&limit=10`;
      if (statusFilter) relativeUrl += `&status=${statusFilter}`;
      if (searchQuery) relativeUrl += `&search=${searchQuery}`;

      const response = await api.get(`/api${relativeUrl}`);
      setFeedbacks(response.data.feedbacks);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Erreur lors du chargement des feedbacks:', err);
      setError('Impossible de charger les feedbacks. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les statistiques
  const loadStats = async () => {
    try {
      const response = await api.get('/api/discord-feedback/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      // On ne définit pas d'erreur ici car ce n'est pas critique
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      // Déterminer le statut à filtrer selon l'onglet sélectionné
      let status = '';
      if (tabValue === 1) status = 'NEW';
      else if (tabValue === 2) status = 'IN_PROGRESS';

      setStatusFilter(status);
    };

    loadInitialData();
  }, [tabValue]);

  // Charger les feedbacks lorsque les filtres changent
  useEffect(() => {
    loadFeedbacks();
    loadStats();
  }, [page, statusFilter, searchQuery]);

  // Configuration du rafraîchissement automatique
  useEffect(() => {
    // Ne pas rafraîchir automatiquement si désactivé
    if (!autoRefreshEnabled) return;
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      loadFeedbacks();
      loadStats();
    }, 30000);
    
    // Nettoyage de l'intervalle lorsque le composant est démonté
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, page, statusFilter, searchQuery]);

  // Gérer le changement d'onglet
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Gérer la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Retour à la première page
    loadFeedbacks();
  };

  // Gérer le changement de statut d'un feedback
  const updateFeedbackStatus = async (id: string, newStatus: string, notes?: string) => {
    try {
      await api.patch(`/api/discord-feedback/${id}/status`, {
        status: newStatus,
        adminNotes: notes
      });
      
      loadFeedbacks();
      loadStats();
      
      if (selectedFeedback && selectedFeedback._id === id) {
        setSelectedFeedback({
          ...selectedFeedback,
          status: newStatus as any,
          adminNotes: notes || selectedFeedback.adminNotes
        });
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Impossible de mettre à jour le statut. Veuillez réessayer.');
    }
  };

  // Gérer la suppression d'un feedback
  const deleteFeedback = async (id: string) => {
    try {
      // Confirmer la suppression
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce feedback ? Cette action est irréversible.")) {
        return;
      }
      
      await discordFeedbackService.deleteFeedback(id);
      
      // Si c'est le feedback sélectionné, fermer le modal
      if (selectedFeedback && selectedFeedback._id === id) {
        setSelectedFeedback(null);
      }
      
      // Recharger la liste des feedbacks
      loadFeedbacks();
      loadStats();
      
    } catch (err) {
      console.error('Erreur lors de la suppression du feedback:', err);
      setError('Impossible de supprimer le feedback. Veuillez réessayer.');
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Obtenir la couleur pour un statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return theme.palette.info.main;
      case 'PENDING':
        return theme.palette.warning.main;
      case 'IN_PROGRESS':
        return theme.palette.secondary.main;
      case 'COMPLETED':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Obtenir le libellé pour un statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'Nouveau';
      case 'PENDING':
        return 'En attente';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'COMPLETED':
        return 'Complété';
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
      <Box component={motion.div} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Feedbacks Discord
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.secondary' }}>
          Gérez les signalements de parkings manquants envoyés par les utilisateurs Discord
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Panneau des statistiques */}
          <Grid item xs={12} md={3}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Statistiques
                </Typography>
                <Tooltip title={autoRefreshEnabled ? "Désactiver l'actualisation automatique" : "Activer l'actualisation automatique"}>
                  <FormControlLabel
                    control={
                      <Switch 
                        size="small" 
                        checked={autoRefreshEnabled} 
                        onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Auto"
                    sx={{ m: 0 }}
                  />
                </Tooltip>
              </Box>
              {!stats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Par statut
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {stats.byStatus.map((stat: any) => (
                      <Chip
                        key={stat._id}
                        label={`${getStatusLabel(stat._id)}: ${stat.count}`}
                        sx={{
                          backgroundColor: `${getStatusColor(stat._id)}20`,
                          color: getStatusColor(stat._id),
                          fontWeight: 'medium'
                        }}
                        onClick={() => setStatusFilter(stat._id)}
                      />
                    ))}
                  </Box>

                  {stats.byAirport.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                        Top aéroports
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {stats.byAirport.map((stat: any) => (
                          <Box key={stat._id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{stat._id}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {stat.count}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}

                  {stats.byAirline.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                        Top compagnies
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {stats.byAirline.map((stat: any) => (
                          <Box key={stat._id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{stat._id}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {stat.count}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Liste des feedbacks */}
          <Grid item xs={12} md={9}>
            <Paper elevation={2} sx={{ p: 0 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab label="Tous les feedbacks" />
                  <Tab
                    label={
                      <Badge
                        badgeContent={
                          stats?.byStatus.find((s: any) => s._id === 'NEW')?.count || 0
                        }
                        color="info"
                        showZero={false}
                      >
                        Nouveaux
                      </Badge>
                    }
                  />
                  <Tab
                    label={
                      <Badge
                        badgeContent={
                          stats?.byStatus.find((s: any) => s._id === 'IN_PROGRESS')?.count || 0
                        }
                        color="secondary"
                        showZero={false}
                      >
                        En cours
                      </Badge>
                    }
                  />
                </Tabs>
              </Box>

              {/* Barre de recherche et filtres */}
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <form onSubmit={handleSearch} style={{ flexGrow: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Rechercher un parking..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchQuery('')}>
                            &times;
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    fullWidth
                  />
                </form>
                <Tooltip title="Actualiser les données">
                  <IconButton 
                    onClick={() => {
                      loadFeedbacks();
                      loadStats();
                    }} 
                    sx={{ ml: 1 }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <IconButton>
                  <FilterListIcon />
                </IconButton>
              </Box>

              <Divider />

              {/* Liste des feedbacks */}
              <Box sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : feedbacks.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                      Aucun feedback trouvé
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {feedbacks.map((feedback) => (
                      <Box
                        key={feedback._id}
                        component={motion.div}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        sx={{
                          p: 2,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          },
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedFeedback(feedback)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {feedback.parkingName || 
                              `${feedback.airline || ''} ${feedback.airport || ''}`}
                          </Typography>
                          <Chip
                            size="small"
                            label={getStatusLabel(feedback.status || '')}
                            sx={{
                              backgroundColor: `${getStatusColor(feedback.status || '')}20`,
                              color: getStatusColor(feedback.status || ''),
                              fontWeight: 'medium'
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            Par {feedback.username}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(feedback.timestamp || '')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {feedback.hasInformation ? (
                            <Chip
                              size="small"
                              icon={<InfoIcon fontSize="small" />}
                              label="A des informations"
                              variant="outlined"
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              icon={<WarningIcon fontSize="small" />}
                              label="N'a pas d'informations"
                              variant="outlined"
                              color="error"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {feedback.parsedDetails?.terminal && (
                            <Chip
                              size="small"
                              label={`Terminal ${feedback.parsedDetails.terminal}`}
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {feedback.parsedDetails?.stands && (
                            <Chip
                              size="small"
                              label={`Porte ${feedback.parsedDetails.stands}`}
                              variant="outlined"
                              sx={{ mr: 1 }}
                              color="secondary"
                            />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Pagination */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 2
                }}
              >
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  sx={{ mx: 1 }}
                >
                  Précédent
                </Button>
                <Typography sx={{ alignSelf: 'center', mx: 2 }}>
                  Page {page} / {totalPages}
                </Typography>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  sx={{ mx: 1 }}
                >
                  Suivant
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Modal détaillé pour un feedback */}
        {selectedFeedback && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1300
            }}
            onClick={() => setSelectedFeedback(null)}
          >
            <DiscordFeedbackDetail
              feedback={selectedFeedback}
              onClose={() => setSelectedFeedback(null)}
              onUpdateStatus={updateFeedbackStatus}
              onDelete={deleteFeedback}
            />
          </Box>
        )}
      </Box>
    </Container>
  );
};

// Composant pour afficher le détail d'un feedback
interface DiscordFeedbackDetailProps {
  feedback: any;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string, notes?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const DiscordFeedbackDetail: React.FC<DiscordFeedbackDetailProps> = ({
  feedback,
  onClose,
  onUpdateStatus,
  onDelete
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState<string>(feedback.status || 'NEW');
  const [adminNotes, setAdminNotes] = useState<string>(feedback.adminNotes || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [selectedParking, setSelectedParking] = useState<any | null>(null);
  const [existingParkings, setExistingParkings] = useState<any[]>([]);
  const [searchingParkings, setSearchingParkings] = useState<boolean>(false);
  
  // Préparer les données initiales pour le nouveau parking
  const defaultNewParking = {
    airline: feedback.airline || '',
    airport: feedback.airport || '',
    gate: {
      terminal: feedback.parsedDetails?.terminal || '',
      porte: feedback.parsedDetails?.stands || ''
    },
    mapInfo: {
      hasMap: false,
      mapUrl: '',
      source: ''
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Charger les parkings similaires lors de l'ouverture du modal
  useEffect(() => {
    const loadSimilarParkings = async () => {
      try {
        setSearchingParkings(true);
        // Rechercher des parkings similaires par aéroport ou terminal
        const query = encodeURIComponent(
          feedback.airport || 
          feedback.parsedDetails?.terminal || 
          ''
        );
        if (!query) return;
        
        const response = await api.get(`/api/parkings?search=${query}&limit=5`);
        
        let parkingsToShow: any[] = [];

        // Correction: Extraire le tableau `parkings` imbriqué si la structure est celle attendue
        if (response.data && response.data.docs && Array.isArray(response.data.docs) && response.data.docs.length > 0 && response.data.docs[0].parkings && Array.isArray(response.data.docs[0].parkings)) {
          parkingsToShow = response.data.docs[0].parkings; // On prend le tableau imbriqué
        } else {
          // Fallback pour d'autres structures ou si vide (ne devrait pas arriver avec la réponse vue)
          console.warn("[DiscordFeedbackDetail] Could not extract nested parkings array from response:", response.data);
          parkingsToShow = [];
        }
        
        setExistingParkings(parkingsToShow);

      } catch (error) {
        console.error('Erreur lors de la recherche de parkings similaires:', error);
        setExistingParkings([]); // Réinitialiser en cas d'erreur
      } finally {
        setSearchingParkings(false);
      }
    };
    
    loadSimilarParkings();
  }, [feedback]);
  
  // Sélectionner un parking existant pour édition
  const handleSelectParking = (parking: any) => {
    // Mettre à jour certaines propriétés avec les informations du feedback si elles sont disponibles
    const updatedParking = {
      ...parking,
      gate: {
        ...parking.gate,
        // Mettre à jour le terminal uniquement s'il est vide et que le feedback a cette information
        terminal: parking.gate?.terminal || feedback.parsedDetails?.terminal || '',
        // Mettre à jour la porte uniquement si elle est vide et que le feedback a cette information
        porte: parking.gate?.porte || feedback.parsedDetails?.stands || ''
      }
    };
    
    setSelectedParking(updatedParking);
    setOpenEditDialog(true);
  };
  
  // Ouvrir le formulaire d'ajout de parking
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };
  
  // Gérer l'ajout d'un nouveau parking
  const handleAddParking = async (parkingData: Omit<any, '_id'>) => {
    try {
      setLoading(true);
      
      // Envoyer les données au serveur
      const response = await api.post('/api/parkings', parkingData);
      
      // Mettre à jour le statut du feedback en COMPLETED
      await onUpdateStatus(feedback._id, 'COMPLETED', 
        `Parking ajouté avec succès. ID: ${response.data._id}`
      );
      
      // Fermer le modal et rediriger vers le parking créé
      setOpenAddDialog(false);
      onClose();
      navigate(`/parkings/${response.data._id}`);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du parking:', error);
      alert('Une erreur est survenue lors de la sauvegarde du parking');
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer la mise à jour d'un parking existant
  const handleUpdateParking = async (id: string, parkingData: Partial<Omit<any, '_id'>>) => {
    try {
      setLoading(true);
      
      // Envoyer les données au serveur
      const response = await api.put(`/api/parkings/${id}`, parkingData);
      
      // Mettre à jour le statut du feedback en COMPLETED
      await onUpdateStatus(feedback._id, 'COMPLETED', 
        `Parking mis à jour avec succès. ID: ${response.data._id}`
      );
      
      // Fermer le modal et rediriger vers le parking modifié
      setOpenEditDialog(false);
      onClose();
      navigate(`/parkings/${response.data._id}`);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du parking:', error);
      alert('Une erreur est survenue lors de la mise à jour du parking');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour le statut
  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      await onUpdateStatus(feedback._id, currentStatus, adminNotes);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer le feedback
  const handleDeleteFeedback = async () => {
    try {
      setLoading(true);
      await onDelete(feedback._id);
    } catch (error) {
      console.error('Erreur lors de la suppression du feedback:', error);
      alert('Une erreur est survenue lors de la suppression du feedback');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Obtenir la couleur pour un statut
  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'NEW': return theme.palette.info.main;
      case 'PENDING': return theme.palette.warning.main;
      case 'IN_PROGRESS': return theme.palette.secondary.main;
      case 'COMPLETED': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  // Obtenir le libellé pour un statut
  const getStatusLabel = (statusValue: string) => {
    switch (statusValue) {
      case 'NEW': return 'Nouveau';
      case 'PENDING': return 'En attente';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Complété';
      default: return statusValue;
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => e.stopPropagation()}
      sx={{
        width: '90%',
        maxWidth: 700,
        maxHeight: '90vh',
        overflowY: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 0
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {feedback.parkingName || 
            `${feedback.airline || ''} ${feedback.airport || ''}`}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={getStatusLabel(feedback.status || '')}
            sx={{
              backgroundColor: `${getStatusColor(feedback.status || '')}20`,
              color: getStatusColor(feedback.status || ''),
              fontWeight: 'medium'
            }}
          />
          <Typography variant="body2" color="textSecondary">
            ID: {feedback.feedbackId}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Utilisateur
            </Typography>
            <Typography variant="body1" gutterBottom>
              {feedback.username} (ID: {feedback.userId})
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Date du signalement
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(feedback.timestamp || '')}
            </Typography>
          </Grid>
          {feedback.airport && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Aéroport
              </Typography>
              <Typography variant="body1" gutterBottom>
                {feedback.airport}
              </Typography>
            </Grid>
          )}
          {feedback.airline && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Compagnie
              </Typography>
              <Typography variant="body1" gutterBottom>
                {feedback.airline}
              </Typography>
            </Grid>
          )}
          {feedback.hasInformation && (
            <Grid item xs={12}>
              <Alert
                severity="info"
                icon={<InfoIcon />}
                sx={{ mb: 2 }}
              >
                L'utilisateur a indiqué avoir des informations sur ce parking
              </Alert>
            </Grid>
          )}
          {!feedback.hasInformation && (
            <Grid item xs={12}>
              <Alert
                severity="warning"
                icon={<WarningIcon />}
                sx={{ mb: 2 }}
              >
                L'utilisateur n'a pas d'informations supplémentaires sur ce parking
              </Alert>
            </Grid>
          )}
          {feedback.parsedDetails && Object.values(feedback.parsedDetails).some(Boolean) && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Informations détaillées
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {feedback.parsedDetails.stands && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Stands/Gates:
                    </Typography>
                    <Typography variant="body2">{feedback.parsedDetails.stands}</Typography>
                  </Box>
                )}
                {feedback.parsedDetails.terminal && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Terminal:
                    </Typography>
                    <Typography variant="body2">{feedback.parsedDetails.terminal}</Typography>
                  </Box>
                )}
                {feedback.parsedDetails.additionalInfo && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Informations additionnelles:
                    </Typography>
                    <Typography variant="body2">{feedback.parsedDetails.additionalInfo}</Typography>
                  </Box>
                )}
                {feedback.parsedDetails.email && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Email de contact:
                    </Typography>
                    <Typography variant="body2">{feedback.parsedDetails.email}</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
          <Grid item xs={12}>
            <Accordion 
              expanded={expanded} 
              onChange={() => setExpanded(!expanded)}
              sx={{ 
                mt: 2, 
                boxShadow: 'none', 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                '&:before': {
                  display: 'none',
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(99, 102, 241, 0.1)' 
                    : 'rgba(79, 70, 229, 0.05)',
                  borderRadius: expanded ? '4px 4px 0 0' : 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AddIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Ajouter/Modifier un parking
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Suggestions de parkings existants */}
                {Array.isArray(existingParkings) && existingParkings.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Parkings similaires existants
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {searchingParkings ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        existingParkings.filter(p => p && p._id).map(parking => (
                          <Box 
                            key={parking._id}
                            sx={{ 
                              p: 1, 
                              mb: 1, 
                              borderRadius: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              },
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onClick={() => handleSelectParking(parking)}
                          >
                            <Box>
                              <Typography variant="body1">{parking.airline} - {parking.airport}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Terminal {parking.gate?.terminal || ''} - Porte {parking.gate?.porte || ''}
                              </Typography>
                            </Box>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectParking(parking);
                              }}
                            >
                              Modifier
                            </Button>
                          </Box>
                        ))
                      )}
                    </Paper>
                  </Box>
                )}
                
                {/* Bouton pour ajouter un nouveau parking */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddDialog}
                    sx={{ px: 4 }}
                  >
                    Ajouter un nouveau parking
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Informations de suivi
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Statut actuel
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {['NEW', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((statusValue) => (
                  <Chip
                    key={statusValue}
                    label={getStatusLabel(statusValue)}
                    onClick={() => setCurrentStatus(statusValue)}
                    sx={{
                      backgroundColor:
                        currentStatus === statusValue
                          ? getStatusColor(statusValue)
                          : `${getStatusColor(statusValue)}20`,
                      color:
                        currentStatus === statusValue
                          ? 'white'
                          : getStatusColor(statusValue),
                      fontWeight: 'medium',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Box>
            </Box>
            <TextField
              label="Notes administratives"
              multiline
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteFeedback}
                disabled={loading}
              >
                Supprimer
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={onClose}>
                  Fermer
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckIcon />}
                  onClick={handleStatusUpdate}
                  disabled={loading || (currentStatus === feedback.status && adminNotes === feedback.adminNotes)}
                >
                  {loading ? <CircularProgress size={24} /> : 'Mettre à jour'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Dialogs pour ajouter/modifier un parking */}
      <AddParking 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)} 
        defaultAirport={feedback.airport || ''} 
        onSubmit={handleAddParking}
        initialData={{
          airline: feedback.airline || '',
          airport: feedback.airport || '',
          terminal: feedback.parsedDetails?.terminal || '',
          porte: feedback.parsedDetails?.stands || ''
        }}
      />
      
      {selectedParking && (
        <EditParking 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)} 
          parking={selectedParking} 
          onSubmit={handleUpdateParking} 
        />
      )}
    </Box>
  );
};

export default DiscordFeedbackManager; 