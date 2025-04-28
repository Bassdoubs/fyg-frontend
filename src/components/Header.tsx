import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Tooltip, 
  Avatar, 
  useTheme, 
  Menu, 
  MenuItem, 
  ListItemIcon,
  Fade,
  Button,
  useMediaQuery,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BarChartIcon from '@mui/icons-material/BarChart';
import ChatIcon from '@mui/icons-material/Chat';
import api from '../services/api';

interface HeaderProps {
  currentSection?: string;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  title: string;
  onLogout: () => void;
  isAuthenticated: boolean;
}

// Helper function to generate a color from a string (simple hash)
const stringToColor = (string: string) => {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

// Helper function for Avatar props
const stringAvatar = (name: string) => {
  if (!name || name.length === 0) {
    return {
      children: '?', // Fallback si pas de nom
    };
  }
  const initial = name[0].toUpperCase();
  return {
    sx: {
      bgcolor: stringToColor(name), // Couleur basée sur le nom
      width: 32,
      height: 32,
      fontSize: '0.875rem',
      fontWeight: 'bold'
    },
    children: initial,
  };
};

export const Header = ({ 
  currentSection, 
  isDarkMode, 
  onThemeToggle, 
  title, 
  onLogout, 
  isAuthenticated 
}: HeaderProps) => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const logoSize = isMobile ? 35 : 45;
  const [newFeedbacksCount, setNewFeedbacksCount] = useState(0);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<{ username: string, roles?: string[] } | null>(null);
  
  // Détecter le scroll pour changer l'apparence du header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Charger le nombre de nouveaux feedbacks
  useEffect(() => {
    if (isAuthenticated) {
      // Charger les infos utilisateur depuis localStorage
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          setUserInfo(JSON.parse(storedUserInfo));
        } catch (e) {
          console.error("Erreur parsing userInfo:", e);
          setUserInfo(null); // Reset si erreur
        }
      } else {
        setUserInfo(null); // S'assurer que c'est null si rien n'est stocké
      }
      
      const loadNewFeedbacksCount = async () => {
        try {
          const response = await api.get('/api/discord-feedback/stats');
          const newCount = response.data.byStatus.find((s: any) => s._id === 'NEW')?.count || 0;
          setNewFeedbacksCount(newCount);
        } catch (error) {
          console.error('Erreur lors du chargement des stats de feedback (Header):', error);
        }
      };
      
      loadNewFeedbacksCount();
      
      const interval = setInterval(loadNewFeedbacksCount, 30000);
      return () => clearInterval(interval);
    } else {
      // Reset userInfo si pas authentifié
      setUserInfo(null);
    }
  }, [isAuthenticated]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAdminClick = () => {
    navigate('/admin');
    handleMenuClose();
  };

  // Couleurs dynamiques basées sur le thème
  const logoBackground = isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)';
  const borderColor = isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.8)';
  const headerBg = scrolled 
    ? isDarkMode 
      ? 'rgba(15, 23, 42, 0.95)' 
      : 'rgba(255, 255, 255, 0.95)'
    : isDarkMode 
      ? 'rgba(15, 23, 42, 0.85)' 
      : 'rgba(255, 255, 255, 0.85)';

  // Déterminer quelle page est active
  const activePage = location.pathname === "/stats" 
    ? 1 
    : location.pathname === "/discord-feedback" 
      ? 2 
      : 0;

  // Fonction pour changer de page
  const handlePageChange = (_: React.SyntheticEvent, newValue: number) => {
    // La navigation se fait via les composants Link intégrés dans les Tabs
  };

  // Animations pour les icônes de navigation
  const iconVariants = {
    inactive: { 
      scale: 1,
      opacity: 0.7,
      y: 0
    },
    active: { 
      scale: 1.15, 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    },
    hover: {
      scale: 1.1, 
      opacity: 0.9,
      y: -2
    }
  };

  // Animation pour les indicateurs sous les icônes
  const dotVariants = {
    hidden: { 
      scale: 0,
      opacity: 0
    },
    visible: { 
      scale: [0, 1.2, 1],
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <AppBar 
      position="fixed" 
      color="transparent" 
      elevation={scrolled ? 4 : 0}
      sx={{
        background: headerBg,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${borderColor}`,
        transition: 'all 0.3s ease',
        boxShadow: scrolled 
          ? isDarkMode 
            ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
            : '0 6px 18px rgba(79, 70, 229, 0.12)'
          : 'none'
      }}
    >
      <Toolbar 
        sx={{ 
          justifyContent: 'space-between',
          py: isMobile ? 1 : 1.5
        }}
      >
        {/* Logo et titre */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/">
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mr: 2
                }}
              >
                <img 
                  src="fyg-logo.png" 
                  alt="Find Your Gate" 
                  width={logoSize + 10} 
                  height={logoSize + 10}
                  style={{ 
                    filter: isDarkMode ? 'brightness(1.2) drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))' : 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.2))' 
                  }}
                />
              </Box>
            </Link>
          </motion.div>

          <Box 
            component={motion.div}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              '&::before': isDarkMode ? {
                content: '""',
                position: 'absolute',
                left: -8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 2,
                height: '70%',
                background: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.6), transparent)',
                borderRadius: 4,
              } : {}
            }}
          >
            <Typography 
              variant="h6" 
              component={motion.h6}
              whileHover={{ 
                scale: 1.02, 
                color: isDarkMode ? '#818cf8' : '#4f46e5' 
              }}
              sx={{ 
                fontWeight: 700,
                fontSize: isMobile ? '1rem' : '1.25rem',
                letterSpacing: '0.5px',
                backgroundImage: isDarkMode 
                  ? 'linear-gradient(90deg, #818cf8, #f472b6)' 
                  : 'linear-gradient(90deg, #4f46e5, #db2777)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: isDarkMode 
                  ? '0 0 15px rgba(99, 102, 241, 0.3)' 
                  : 'none',
                cursor: 'default',
              }}
            >
              Find Your Gate
            </Typography>
            
            <Typography 
              variant="subtitle2"
              component={motion.div}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              sx={{ 
                fontWeight: 500,
                color: isDarkMode ? 'grey.400' : 'grey.700',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                pl: 0.5,
              }}
            >
              {title || currentSection || 'Dashboard'}
            </Typography>
          </Box>
        </Box>

        {/* Navigation centrale pour écrans plus larges */}
        {isAuthenticated && !isMobile && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            position: 'absolute', 
            left: '50%', 
            transform: 'translateX(-50%)',
            gap: 3,
            backgroundColor: isDarkMode 
              ? 'rgba(30, 41, 59, 0.4)' 
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            py: 0.75,
            px: 2,
            border: `1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.2)' : 'rgba(241, 245, 249, 0.8)'}`,
            boxShadow: isDarkMode 
              ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
              : '0 4px 12px rgba(0, 0, 0, 0.03)',
          }}>
            <motion.div
              initial="inactive"
              animate={activePage === 0 ? "active" : "inactive"}
              whileHover="hover"
              variants={iconVariants}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Tooltip title="Parkings">
                <Box
                  component={Link}
                  to="/"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activePage === 0 
                      ? (isDarkMode ? '#818cf8' : '#4f46e5')
                      : (isDarkMode ? '#cbd5e1' : '#64748b'),
                    textDecoration: 'none',
                    position: 'relative',
                    p: 1,
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: isDarkMode 
                        ? 'rgba(99, 102, 241, 0.1)' 
                        : 'rgba(79, 70, 229, 0.05)',
                    }
                  }}
                >
                  <LocalParkingIcon 
                    sx={{ 
                      fontSize: '1.5rem', 
                      mb: 0.5,
                    }} 
                  />
                  <Box sx={{ 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    backgroundColor: isDarkMode ? '#818cf8' : '#4f46e5',
                    position: 'absolute',
                    bottom: '0px'
                  }}>
                    <motion.div 
                      variants={dotVariants}
                      initial="hidden"
                      animate={activePage === 0 ? "visible" : "hidden"}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </Box>
                </Box>
              </Tooltip>
            </motion.div>

            <motion.div
              initial="inactive"
              animate={activePage === 1 ? "active" : "inactive"}
              whileHover="hover"
              variants={iconVariants}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Tooltip title="Statistiques">
                <Box
                  component={Link}
                  to="/stats"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activePage === 1 
                      ? (isDarkMode ? '#818cf8' : '#4f46e5')
                      : (isDarkMode ? '#cbd5e1' : '#64748b'),
                    textDecoration: 'none',
                    position: 'relative',
                    p: 1,
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: isDarkMode 
                        ? 'rgba(99, 102, 241, 0.1)' 
                        : 'rgba(79, 70, 229, 0.05)',
                    }
                  }}
                >
                  <BarChartIcon fontSize="small" />
                  <Box sx={{ 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    backgroundColor: isDarkMode ? '#818cf8' : '#4f46e5',
                    position: 'absolute',
                    bottom: '0px'
                  }}>
                    <motion.div 
                      variants={dotVariants}
                      initial="hidden"
                      animate={activePage === 1 ? "visible" : "hidden"}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </Box>
                </Box>
              </Tooltip>
            </motion.div>

            {/* Lien vers les Feedbacks Discord */}
            <motion.div
              initial="inactive"
              animate={activePage === 2 ? "active" : "inactive"}
              whileHover="hover"
              variants={iconVariants}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Tooltip title="Feedbacks Discord">
                <Box
                  component={Link}
                  to="/discord-feedback"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activePage === 2
                      ? (isDarkMode ? '#818cf8' : '#4f46e5')
                      : (isDarkMode ? '#cbd5e1' : '#64748b'),
                    textDecoration: 'none',
                    position: 'relative',
                    p: 1,
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: isDarkMode 
                        ? 'rgba(99, 102, 241, 0.1)' 
                        : 'rgba(79, 70, 229, 0.05)',
                    }
                  }}
                >
                  <Badge 
                    badgeContent={newFeedbacksCount} 
                    color="error"
                    overlap="circular"
                    invisible={newFeedbacksCount === 0}
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -5,
                        top: 2,
                        border: `2px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`,
                        padding: '0 4px',
                        minWidth: '18px',
                        height: '18px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    <ChatIcon fontSize="small" />
                  </Badge>
                  <motion.div 
                    variants={dotVariants}
                    initial="hidden"
                    animate={activePage === 2 ? "visible" : "hidden"}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Box>
              </Tooltip>
            </motion.div>
          </Box>
        )}

        {/* Menu de navigation mobile */}
        {isAuthenticated && isMobile && (
          <Box sx={{ 
            display: 'flex', 
            position: 'absolute', 
            left: '50%', 
            transform: 'translateX(-50%)',
            backgroundColor: isDarkMode 
              ? 'rgba(30, 41, 59, 0.5)' 
              : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            py: 0.75,
            px: 1.5,
            boxShadow: isDarkMode 
              ? '0 4px 12px rgba(0, 0, 0, 0.2)' 
              : '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.2)' : 'rgba(241, 245, 249, 0.8)'}`,
            gap: 1,
            overflow: 'hidden',
          }}>
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: '10px',
                textDecoration: 'none',
                color: activePage === 0 
                  ? (isDarkMode ? '#818cf8' : '#4f46e5')
                  : (isDarkMode ? '#cbd5e1' : '#64748b'),
                backgroundColor: activePage === 0 
                  ? (isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)')
                  : 'transparent',
                transition: 'all 0.2s ease',
                fontWeight: activePage === 0 ? 600 : 500,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: activePage === 0 ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <LocalParkingIcon 
                  fontSize="small" 
                />
                {activePage === 0 && (
                  <Box sx={{ 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    backgroundColor: isDarkMode ? '#818cf8' : '#4f46e5',
                    position: 'absolute',
                    bottom: '0px'
                  }}>
                    <motion.div 
                      variants={dotVariants}
                      initial="hidden"
                      animate={activePage === 0 ? "visible" : "hidden"}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </Box>
                )}
              </motion.div>
            </Box>

            <Box
              component={Link}
              to="/stats"
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: '10px',
                textDecoration: 'none',
                color: activePage === 1 
                  ? (isDarkMode ? '#818cf8' : '#4f46e5')
                  : (isDarkMode ? '#cbd5e1' : '#64748b'),
                backgroundColor: activePage === 1 
                  ? (isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)')
                  : 'transparent',
                transition: 'all 0.2s ease',
                fontWeight: activePage === 1 ? 600 : 500,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: activePage === 1 ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <BarChartIcon fontSize="small" />
                <Typography variant="caption">Stats</Typography>
              </motion.div>

              {activePage === 1 && (
                <Box sx={{ 
                  width: '4px', 
                  height: '4px', 
                  borderRadius: '50%', 
                  backgroundColor: isDarkMode ? '#818cf8' : '#4f46e5',
                  position: 'absolute',
                  bottom: '0px'
                }}>
                  <motion.div 
                    variants={dotVariants}
                    initial="hidden"
                    animate={activePage === 1 ? "visible" : "hidden"}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Box>
              )}
            </Box>

            {/* Lien vers les Feedbacks Discord */}
            <motion.div
              initial="inactive"
              animate={activePage === 2 ? "active" : "inactive"}
              whileHover="hover"
              variants={iconVariants}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Tooltip title="Feedbacks Discord">
                <Box
                  component={Link}
                  to="/discord-feedback"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activePage === 2
                      ? (isDarkMode ? '#818cf8' : '#4f46e5')
                      : (isDarkMode ? '#cbd5e1' : '#64748b'),
                    textDecoration: 'none',
                    position: 'relative',
                    p: 1,
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: isDarkMode 
                        ? 'rgba(99, 102, 241, 0.1)' 
                        : 'rgba(79, 70, 229, 0.05)',
                    }
                  }}
                >
                  <Badge 
                    badgeContent={newFeedbacksCount} 
                    color="error"
                    overlap="circular"
                    invisible={newFeedbacksCount === 0}
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -5,
                        top: 2,
                        border: `2px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`,
                        padding: '0 4px',
                        minWidth: '18px',
                        height: '18px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    <ChatIcon fontSize="small" />
                  </Badge>
                  <motion.div 
                    variants={dotVariants}
                    initial="hidden"
                    animate={activePage === 2 ? "visible" : "hidden"}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Box>
              </Tooltip>
            </motion.div>
          </Box>
        )}

        {/* Droite: boutons et menu utilisateur */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isDarkMode ? 'Passer au thème clair' : 'Passer au thème sombre'}>
            <IconButton 
              onClick={onThemeToggle} 
              color="inherit"
              component={motion.button}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              {isDarkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
          </Tooltip>

          {/* Bouton Avatar/Utilisateur */}
          {isAuthenticated && userInfo && (
            <Tooltip title={`Connecté en tant que ${userInfo.username}`}>
              {/* Utiliser IconButton pour ouvrir le menu */} 
              <IconButton
                onClick={handleMenuOpen} // <-- Ouvre le menu
                size="small"
                sx={{ ml: 1 }} 
                aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
              >
                {/* Passer le username à stringAvatar */} 
                <Avatar {...stringAvatar(userInfo.username || '?')} /> 
              </IconButton>
            </Tooltip>
          )}

          {/* Menu Utilisateur (s'ouvre via IconButton Avatar) */}
          <Menu
            id="account-menu" // <-- Ajouter ID pour aria-controls
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            // ... (reste des props du Menu inchangé) ...
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            {/* Afficher le nom de l'utilisateur dans le menu */}
            <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body1" fontWeight="medium">{userInfo?.username}</Typography>
              <Typography variant="caption" color="text.secondary">
                {/* Afficher le rôle principal (Admin si présent, sinon User) */}
                {userInfo?.roles?.includes('admin') ? 'Admin' : 'Utilisateur'}
              </Typography>
            </Box>
            
            {userInfo?.roles?.includes('admin') && (
              <MenuItem onClick={handleAdminClick}>
                <ListItemIcon>
                  <AdminPanelSettingsIcon fontSize="small" />
                </ListItemIcon>
                Administration
              </MenuItem>
            )}
            <MenuItem onClick={onLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 