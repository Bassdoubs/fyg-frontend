import React, { useState, useEffect, useRef } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Button, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, TablePagination } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDarkMode } from '../../hooks/useDarkMode';
import FlightIcon from '@mui/icons-material/Flight';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import api from '../../services/api';
import axios from 'axios';

// Interface pour les logs Discord
interface CommandLog {
  _id: string;
  command: string;
  user: {
    id: string;
    tag: string;
    nickname: string;
  };
  guild: {
    id: string;
    name: string;
  };
  timestamp: string;
  details: {
    airport: string;
    airline: string;
    found: boolean;
    parkingsCount: number;
    responseTime: number;
    // Données ACARS
    acars?: {
      used: boolean;           // Si ACARS a été utilisé
      network: string;         // Réseau utilisé (IVAO, VATSIM, etc.)
      callsign: string;        // Indicatif utilisé
      success: boolean;        // Si l'envoi a réussi
      timestamp: string;       // Moment de l'envoi ACARS
      responseTime: number;    // Temps de réponse de l'envoi ACARS (ms)
    };
  };
}

interface CommandStats {
  totalCommands: number;
  successfulCommands: number;
  averageResponseTime: number;
  uniqueUsers: number;
  uniqueAirports: number;
  uniqueAirlines: number;
  usageByDay: Array<{
    date: string;
    count: number;
    successRate: number;
  }>;
  topAirports: Array<{
    airport: string;
    count: number;
  }>;
  topAirlines: Array<{
    airline: string;
    count: number;
  }>;
  // Nouvelles statistiques ACARS
  acarsStats: {
    totalUsed: number;
    successRate: number;
    averageResponseTime: number;
    topNetworks: Array<{
      network: string;
      count: number;
    }>;
    usageByDay: Array<{
      date: string;
      count: number;
      successRate: number;
    }>;
  };
}

// Couleurs pour les graphiques
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#6b486b', '#a05d56'];

export const StatsManager = () => {
  const { isDarkMode, renderKey } = useDarkMode();
  const [stats, setStats] = useState<CommandStats | null>(null);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30'); // Période par défaut : 30 jours
  const [forceUpdate, setForceUpdate] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  // Pagination des logs
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalLogs, setTotalLogs] = useState(0);
  // Onglet actif : 0 = Commandes Park, 1 = ACARS
  const [activeTab, setActiveTab] = useState(0);

  // Périodes disponibles
  const periodOptions = [
    { value: '7', label: '7 derniers jours' },
    { value: '14', label: '14 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '60', label: '60 derniers jours' },
    { value: '90', label: '90 derniers jours' },
    { value: 'all', label: 'Tout l\'historique' }
  ];

  // Écouter les changements de thème via l'événement personnalisé
  useEffect(() => {
    const handleThemeChange = () => {
      // Force un rafraîchissement immédiat des graphiques
      setForceUpdate(prev => prev + 1);
      
      if (statsRef.current) {
        // Forcer un recalcul des styles
        void statsRef.current.offsetHeight;
        
        // Forcer un recalcul sur tous les composants Paper
        const papers = statsRef.current.querySelectorAll('.MuiPaper-root');
        papers.forEach(paper => {
          paper.classList.add('theme-refreshing');
          setTimeout(() => paper.classList.remove('theme-refreshing'), 10);
        });
      }
    };
    
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);
  
  // Forcer un recalcul des styles quand le thème change via renderKey
  useEffect(() => {
    if (statsRef.current) {
      // Forcer un recalcul
      void statsRef.current.offsetHeight;
      setForceUpdate(prev => prev + 1);
    }
  }, [renderKey]);

  // Générer les statistiques des utilisateurs les plus actifs à partir des logs de la page courante
  const getTopUsers = (logs: CommandLog[], limit = 10) => {
    // Remarque: ces statistiques sont basées uniquement sur les logs de la page actuelle
    // Pour des statistiques plus précises, utiliser une API dédiée côté serveur
    const userCounts: Record<string, { count: number, nickname: string, userId: string }> = {};
    
    logs.forEach(log => {
      const userId = log.user.id;
      if (!userCounts[userId]) {
        userCounts[userId] = { 
          count: 0, 
          nickname: log.user.nickname || log.user.tag, 
          userId 
        };
      }
      userCounts[userId].count += 1;
    });
    
    return Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(user => ({
        user: user.userId,
        nickname: user.nickname,
        count: user.count
      }));
  };

  // Générer les statistiques des utilisateurs ACARS
  const getTopAcarsUsers = (logs: CommandLog[], limit = 10) => {
    const userCounts: Record<string, { count: number, nickname: string, userId: string, successCount: number }> = {};
    
    logs.forEach(log => {
      if (log.details.acars?.used) {
        const userId = log.user.id;
        if (!userCounts[userId]) {
          userCounts[userId] = { 
            count: 0, 
            successCount: 0,
            nickname: log.user.nickname || log.user.tag, 
            userId 
          };
        }
        userCounts[userId].count += 1;
        if (log.details.acars.success) {
          userCounts[userId].successCount += 1;
        }
      }
    });
    
    return Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(user => ({
        user: user.userId,
        nickname: user.nickname,
        count: user.count,
        successRate: user.count > 0 ? (user.successCount / user.count) * 100 : 0
      }));
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error before fetching
      
      // Récupération des statistiques générales
      const statsUrl = `/api/discord-logs/stats?period=${period}`;
      const response = await api.get(statsUrl);
      const data = response.data;
      setStats(data);
      
      // Récupération des logs avec pagination
      const logsUrl = `/api/discord-logs?page=${page}&limit=${rowsPerPage}&period=${period}`;
      const logsResponse = await api.get(logsUrl);
      const logsData = logsResponse.data;
      setLogs(logsData.logs || []);
      setTotalLogs(logsData.total || 0);
      
    } catch (err) {
      // Gérer les erreurs Axios et autres
      console.error("Erreur dans fetchStats:", err);
      let message = 'Une erreur est survenue';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/discord-logs/stats/reset', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation des statistiques');
      }

      const data = await response.json();
      setSnackbar({
        open: true,
        message: data.message,
        severity: 'success'
      });
      
      // Rafraîchir les statistiques
      fetchStats();
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la réinitialisation des statistiques',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchStats();
  }, [period, page, rowsPerPage, forceUpdate]);

  // Générer les données des utilisateurs les plus actifs
  const topUsers = logs.length > 0 ? getTopUsers(logs) : [];

  // Générer les données des utilisateurs ACARS
  const topAcarsUsers = logs.length > 0 ? getTopAcarsUsers(logs) : [];

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fonction pour déterminer si les données ACARS sont disponibles
  const hasAcarsData = stats && stats.acarsStats && stats.acarsStats.totalUsed > 0;

  // Rendu conditionnel en fonction des données ACARS disponibles
  const renderTabs = () => {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="Onglets de statistiques"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6',
            },
            '& .MuiTab-root': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500,
              textTransform: 'none',
              minHeight: '48px',
              transition: 'all 0.2s ease',
            },
            '& .Mui-selected': {
              color: isDarkMode ? '#60a5fa' : '#3b82f6',
              fontWeight: 600,
            },
          }}
        >
          <Tab 
            icon={<FlightIcon />} 
            iconPosition="start" 
            label="Commandes Park" 
            sx={{ fontSize: '0.9rem', py: 1 }} 
          />
          <Tab 
            icon={<SignalCellularAltIcon />} 
            iconPosition="start" 
            label="Statistiques ACARS" 
            sx={{ fontSize: '0.9rem', py: 1 }}
            disabled={!hasAcarsData}
          />
        </Tabs>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box 
      ref={statsRef}
      className={`w-full max-w-[95vw] mx-auto ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}
      key={`stats-manager-${renderKey}-${forceUpdate}`}
      sx={{
        // Force l'application des styles avec des règles importantes
        backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 1) !important' : 'rgba(249, 250, 251, 1) !important',
        color: isDarkMode ? '#fff !important' : '#1f2937 !important',
        '& .MuiPaper-root': {
          backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 1) !important' : '#fff !important',
          color: isDarkMode ? '#fff !important' : 'inherit !important',
        }
      }}
    >
      <Box className="flex justify-between items-center mb-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <Typography variant="h4" className="font-bold text-2xl md:text-3xl">
          Statistiques d'utilisation
        </Typography>
        <Box className="flex gap-2 flex-col sm:flex-row">
          <FormControl size="small" className="min-w-[150px]">
            <InputLabel>Période</InputLabel>
            <Select
              value={period}
              label="Période"
              onChange={(e) => setPeriod(e.target.value)}
              className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}
            >
              <MenuItem value="7">7 derniers jours</MenuItem>
              <MenuItem value="14">14 derniers jours</MenuItem>
              <MenuItem value="30">30 derniers jours</MenuItem>
              <MenuItem value="60">60 derniers jours</MenuItem>
              <MenuItem value="90">90 derniers jours</MenuItem>
              <MenuItem value="all">Tout l'historique</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleResetStats}
            disabled={loading}
            className={`whitespace-nowrap ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}`}
          >
            Réinitialiser
          </Button>
        </Box>
      </Box>

      <div className="mb-8">
        {/* Onglets pour alterner entre stats commandes et ACARS */}
        <Box className="px-4">
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : stats ? (
            <>
              {hasAcarsData && renderTabs()}
              
              {/* ONGLET 1: Statistiques des commandes Park */}
              {activeTab === 0 && (
                <>
                  {/* Carte de statistiques */}
                  <Grid container spacing={3} className="mb-6">
                    {/* Statistiques générales */}
                    <Grid item xs={6} md={3}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 shadow-blue-900/20' : 'bg-white shadow-lg'} transition-all hover:shadow-xl`}>
                        <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 mb-1">Commandes totales</Typography>
                        <Typography variant="h4" className="font-bold text-blue-600 dark:text-blue-400">{stats.totalCommands}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 shadow-green-900/20' : 'bg-white shadow-lg'} transition-all hover:shadow-xl`}>
                        <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 mb-1">Taux de réussite</Typography>
                        <Typography variant="h4" className="font-bold text-green-600 dark:text-green-400">
                          {((stats.successfulCommands / stats.totalCommands) * 100).toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 shadow-purple-900/20' : 'bg-white shadow-lg'} transition-all hover:shadow-xl`}>
                        <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 mb-1">Temps de réponse</Typography>
                        <Typography variant="h4" className="font-bold text-purple-600 dark:text-purple-400">{Math.round(stats.averageResponseTime)}ms</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 shadow-orange-900/20' : 'bg-white shadow-lg'} transition-all hover:shadow-xl`}>
                        <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 mb-1">Utilisateurs uniques</Typography>
                        <Typography variant="h4" className="font-bold text-orange-600 dark:text-orange-400">{stats.uniqueUsers}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Sections de graphiques */}
                  <Grid container spacing={3}>
                    {/* Graphique d'utilisation quotidienne */}
                    <Grid item xs={12}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                        <Typography variant="h6" className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
                          Utilisation quotidienne
                        </Typography>
                        <Box height={300}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.usageByDay}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                              />
                              <YAxis 
                                yAxisId="left" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? "#333" : "#fff",
                                  color: isDarkMode ? "#fff" : "#333",
                                  border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`
                                }} 
                              />
                              <Legend wrapperStyle={{ color: isDarkMode ? "#bbb" : "#666" }} />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                name="Nombre de commandes"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="successRate"
                                stroke="#82ca9d"
                                name="Taux de réussite (%)"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Top aéroports */}
                    <Grid item xs={12} md={6}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full`}>
                        <Typography variant="h6" className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
                          Top 10 des aéroports recherchés
                        </Typography>
                        <Box height={300}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topAirports} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
                              <XAxis 
                                type="number" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                              />
                              <YAxis 
                                dataKey="airport" 
                                type="category" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                                width={80}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? "#333" : "#fff",
                                  color: isDarkMode ? "#fff" : "#333",
                                  border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`
                                }} 
                              />
                              <Bar dataKey="count" name="Nombre de recherches">
                                {stats.topAirports.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Top compagnies */}
                    <Grid item xs={12} md={6}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full`}>
                        <Typography variant="h6" className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
                          Top 10 des compagnies recherchées
                        </Typography>
                        <Box height={300}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topAirlines} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
                              <XAxis 
                                type="number" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                              />
                              <YAxis 
                                dataKey="airline" 
                                type="category" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                                width={80}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? "#333" : "#fff",
                                  color: isDarkMode ? "#fff" : "#333",
                                  border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`
                                }} 
                              />
                              <Bar dataKey="count" name="Nombre de recherches">
                                {stats.topAirlines.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Nouvelle section: Utilisateurs les plus actifs */}
                    <Grid item xs={12} md={6}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full`}>
                        <Typography variant="h6" className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
                          Utilisateurs les plus actifs
                        </Typography>
                        <Box height={300}>
                          {topUsers.length === 0 ? (
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              justifyContent="center" 
                              height="100%" 
                              className="text-gray-500 dark:text-gray-400"
                            >
                              Aucune donnée disponible
                            </Box>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={topUsers} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
                                <XAxis 
                                  type="number" 
                                  tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                                />
                                <YAxis 
                                  dataKey="nickname" 
                                  type="category" 
                                  tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                                  width={120}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: isDarkMode ? "#333" : "#fff",
                                    color: isDarkMode ? "#fff" : "#333",
                                    border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`
                                  }}
                                  formatter={(value, name, props) => {
                                    return [`${value} commandes`, `${props.payload.nickname}`];
                                  }}
                                />
                                <Bar dataKey="count" name="Nombre de commandes" fill="#6366f1">
                                  {topUsers.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Distribution des résultats (réussite/échec) */}
                    <Grid item xs={12} md={6}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full`}>
                        <Typography variant="h6" className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
                          Distribution des résultats
                        </Typography>
                        <Box height={300} display="flex" alignItems="center" justifyContent="center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Succès', value: stats.successfulCommands },
                                  { name: 'Échec', value: stats.totalCommands - stats.successfulCommands }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#4ade80" />
                                <Cell fill="#f87171" />
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? "#333" : "#fff",
                                  color: isDarkMode ? "#fff" : "#333",
                                  border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`
                                }} 
                                formatter={(value) => [`${value} commandes`, '']}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* ONGLET 2: Statistiques ACARS */}
              {activeTab === 1 && stats.acarsStats && (
                <>
                  {/* Cartes de statistiques ACARS */}
                  <Grid container spacing={3} className="mb-6">
                    <Grid item xs={6} md={4}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                        <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 mb-1">
                          Utilisations ACARS
                        </Typography>
                        <Typography variant="h4" className="font-bold text-blue-600 dark:text-blue-400">
                          {stats.acarsStats.totalUsed}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                        <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 mb-1">
                          Taux de succès ACARS
                        </Typography>
                        <Typography variant="h4" className="font-bold text-green-600 dark:text-green-400">
                          {stats.acarsStats.successRate.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                        <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-400 mb-1">
                          Temps réponse ACARS
                        </Typography>
                        <Typography variant="h4" className="font-bold text-purple-600 dark:text-purple-400">
                          {Math.round(stats.acarsStats.averageResponseTime)}ms
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  {/* Graphique d'utilisation ACARS */}
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                        <Typography variant="h6" className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
                          Utilisation ACARS quotidienne
                        </Typography>
                        <Box height={300}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.acarsStats.usageByDay}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                              />
                              <YAxis 
                                yAxisId="left" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? "#333" : "#fff",
                                  color: isDarkMode ? "#fff" : "#333",
                                  border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`
                                }} 
                              />
                              <Legend wrapperStyle={{ color: isDarkMode ? "#bbb" : "#666" }} />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                name="Demande ACARS"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="successRate"
                                stroke="#82ca9d"
                                name="Taux de succès (%)"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    {/* Réseaux ACARS les plus utilisés */}
                    <Grid item xs={12} md={6}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full`}>
                        <Typography variant="h6" className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
                          Réseaux ACARS les plus utilisés
                        </Typography>
                        <Box height={300}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.acarsStats.topNetworks}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="network"
                                label={({ network, percent }) => `${network}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {stats.acarsStats.topNetworks.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value, name, props) => [value, props.payload.network]}
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? "#333" : "#fff",
                                  color: isDarkMode ? "#fff" : "#333",
                                  border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`
                                }} 
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Utilisateurs ACARS */}
                    <Grid item xs={12} md={6}>
                      <Paper className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full`}>
                        <Typography variant="h6" className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
                          Utilisateurs ACARS les plus actifs
                        </Typography>
                        <Box height={300}>
                          {topAcarsUsers.length === 0 ? (
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              justifyContent="center" 
                              height="100%" 
                              className="text-gray-500 dark:text-gray-400"
                            >
                              Aucune donnée disponible
                            </Box>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={topAcarsUsers} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
                                <XAxis 
                                  type="number" 
                                  tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                                />
                                <YAxis 
                                  dataKey="nickname" 
                                  type="category" 
                                  tick={{ fill: isDarkMode ? "#bbb" : "#666" }}
                                  width={120}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: isDarkMode ? "#333" : "#fff",
                                    color: isDarkMode ? "#fff" : "#333",
                                    border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`
                                  }}
                                  formatter={(value, name, props) => {
                                    if (name === "Taux de succès (%)") {
                                      return [`${Number(value).toFixed(1)}%`, name];
                                    }
                                    return [`${value} demandes`, `${props.payload.nickname}`];
                                  }}
                                />
                                <Legend />
                                <Bar dataKey="count" name="Demande ACARS" fill="#8884d8">
                                  {topAcarsUsers.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <Typography variant="h6" color="text.secondary">
                Aucune donnée disponible
              </Typography>
            </Box>
          )}
          
          {/* Snackbar pour les notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          <TablePagination
            component="div"
            count={totalLogs}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Logs par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            className={`${isDarkMode ? 'text-white' : 'text-gray-800'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          />
        </Box>
      </div>
    </Box>
  );
}; 