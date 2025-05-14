import { Provider, useDispatch } from 'react-redux';
import { store } from './store/store';
import { ParkingManager } from './features/parkings/ParkingManager';
import { Header } from './components/Header';
import { ThemeProvider } from './theme/ThemeProvider';
import { useDarkMode } from './hooks/useDarkMode';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CssBaseline/*, Box*/ } from '@mui/material';
import { LoginDialog } from './components/LoginDialog';
import { RegisterDialog } from './components/RegisterDialog';
import SessionExpiredModal from './components/SessionExpiredModal';
import { StatsManager } from './features/stats/StatsManager';
import { motion } from 'framer-motion';
import DiscordFeedbackManager from './features/discord-feedback/DiscordFeedbackManager';
import AdminPage from './features/admin/pages/AdminPage';
import { fetchAirports } from './store/airportsSlice';

function App() {
  const { isDarkMode, toggleDarkMode, renderKey } = useDarkMode();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const location = useLocation();
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const dispatch = useDispatch<typeof store.dispatch>();

  // Déterminer le titre en fonction de la route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/stats':
        return 'Statistiques';
      case '/discord-feedback':
        return 'Feedbacks Discord';
      case '/admin':
        return 'Administration';
      case '/':
      default:
        return 'Gestion des parkings';
    }
  };

  // Classes CSS dynamiques basées sur le thème
  const themeClasses = isDarkMode 
    ? 'bg-gradient-dark text-slate-100'
    : 'bg-gradient-light text-slate-900';

  useEffect(() => {
    // Vérifier si l'URL contient le paramètre expired=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('expired') === 'true') {
      setShowSessionExpiredModal(true);
    }
    
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      dispatch(fetchAirports());
    } else {
      setIsAuthenticated(false);
      
      // Ne pas montrer automatiquement le login si on vient d'une expiration de session
      if (!urlParams.get('expired')) {
        setShowLoginDialog(true);
      }
      
      setShowRegisterDialog(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [dispatch, location.search]);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
    setShowLoginDialog(!success); 
    if (success) {
      setShowRegisterDialog(false); // S'assurer que RegisterDialog est fermé si login réussi
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Supprimer le token et les infos utilisateur
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    setShowLoginDialog(true); // Rouvrir la boîte de dialogue après déconnexion
    setShowRegisterDialog(false); // S'assurer que RegisterDialog est fermé
  };

  // Fonctions pour basculer entre les dialogues
  const handleSwitchToRegister = () => {
    setShowLoginDialog(false);
    setShowRegisterDialog(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterDialog(false);
    setShowLoginDialog(true);
  };

  const handleCloseRegisterDialog = () => {
    setShowRegisterDialog(false);
    // Optionnel: rouvrir LoginDialog si l'utilisateur ferme Register sans s'inscrire ?
    // if (!isAuthenticated) setShowLoginDialog(true);
  };

  const handleSessionExpiredClose = () => {
    setShowSessionExpiredModal(false);
    
    // Nettoyer l'URL
    const url = new URL(window.location.href);
    url.searchParams.delete('expired');
    window.history.replaceState({}, document.title, url.toString());
    
    // Le dialogue de connexion sera affiché automatiquement par le composant SessionExpiredModal
    // qui appelle navigate('/login')
    // Ne plus afficher automatiquement le login dialog ici
  };

  // Animation de transition entre les routes
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -20,
    }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3
  };

  return (
    <ThemeProvider>
      <CssBaseline />
      <div 
        className={`min-h-screen w-full transition-colors duration-500 ${themeClasses} overflow-hidden relative`}
        key={`app-container-${renderKey}`}
        style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }}
      >
        {/* Arrière-plan avec image et overlay combinés */}
        <div className="airport-background" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          overflow: 'hidden'
        }}>
          {/* Image d'arrière-plan */}
          <img 
            src="/klax_airport.png" 
            alt=""
            onLoad={() => setBgImageLoaded(true)}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isDarkMode ? 'blur(2px) brightness(0.6) saturate(0.7)' : 'blur(3px) brightness(0.9)',
              transform: 'scale(1.1)',
              opacity: bgImageLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease'
            }}
          />
          
          {/* Overlay de couleur */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: isDarkMode 
              ? 'rgba(5, 15, 35, 0.9)'
              : 'rgba(241, 245, 249, 0.5)',
            mixBlendMode: isDarkMode ? 'normal' : 'normal',
            zIndex: 1
          }} />
        </div>
        
        <Header 
          isDarkMode={isDarkMode} 
          onThemeToggle={toggleDarkMode}
          title={getPageTitle()}
          onLogout={handleLogout} 
          isAuthenticated={isAuthenticated}
        />
        
        <motion.div 
          className="relative pt-24 px-4 sm:px-6 lg:px-8 max-w-[95%] xl:max-w-[1400px] mx-auto"
          initial="initial"
          animate="in"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          style={{ position: 'relative', zIndex: 2 }}
        >
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                <ParkingManager showLogoutButton={false} /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/stats" 
              element={
                isAuthenticated ? 
                <StatsManager /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/discord-feedback" 
              element={
                isAuthenticated ? 
                <DiscordFeedbackManager /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/admin" 
              element={
                isAuthenticated ? 
                <AdminPage /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/login"
              element={
                isAuthenticated ? (
                  // If already authenticated, redirect to home
                  <Navigate to="/" replace />
                ) : (
                  // If not authenticated, render nothing here.
                  // LoginDialog is shown based on state outside Routes.
                  null 
                )
              } 
            />
          </Routes>
        </motion.div>
        
        <LoginDialog 
          open={showLoginDialog} 
          onLogin={handleLogin} 
          onSwitchToRegister={handleSwitchToRegister}
        />
        <RegisterDialog 
          open={showRegisterDialog} 
          onClose={handleCloseRegisterDialog}
          onSwitchToLogin={handleSwitchToLogin}
        />
        <SessionExpiredModal 
          open={showSessionExpiredModal}
          onClose={handleSessionExpiredClose}
        />
      </div>
    </ThemeProvider>
  );
}

// Wrapper pour pouvoir utiliser useDispatch dans App
const AppWrapper = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

export default AppWrapper;
