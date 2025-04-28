import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogActions, 
  TextField, 
  Button, 
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyIcon from '@mui/icons-material/Key';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useThemeContext } from '../theme/ThemeProvider';
import api from '../services/api';
import axios from 'axios';

interface LoginDialogProps {
  open: boolean;
  onLogin: (success: boolean) => void;
  onSwitchToRegister: () => void;
}

export const LoginDialog = ({ open, onLogin, onSwitchToRegister }: LoginDialogProps) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useThemeContext();

  useEffect(() => {
    if (open) {
      setIdentifier('');
      setPassword('');
      setError('');
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', { 
        identifier,
        password 
      });

      const { token, user } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userInfo', JSON.stringify(user));

      console.log('Connexion réussie, token stocké.', user);
      onLogin(true);

    } catch (err: any) {
      let errorMessage = 'Erreur de connexion inconnue. Veuillez réessayer.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || 'Identifiants incorrects ou erreur serveur.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Erreur réseau ou autre:', err);
      }
      setError(errorMessage);
      onLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const inputVariants = {
    focused: { scale: 1.02, boxShadow: isDarkMode ? "0 0 10px rgba(99, 102, 241, 0.3)" : "0 0 15px rgba(79, 70, 229, 0.2)" },
    blur: { scale: 1, boxShadow: "none" },
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.03, boxShadow: "0 6px 15px rgba(79, 70, 229, 0.3)" },
    pressed: { scale: 0.98 }
  };

  const gradientBackground = isDarkMode 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))' 
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.95))';

  return (
    <Dialog 
      open={open} 
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: "hidden",
        animate: "visible",
        variants: dialogVariants,
        style: {
          borderRadius: '16px',
          background: gradientBackground,
          boxShadow: isDarkMode 
            ? '0 20px 40px rgba(0, 0, 0, 0.4)' 
            : '0 20px 40px rgba(15, 23, 42, 0.15)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(241, 245, 249, 0.8)'}`,
          overflow: 'hidden',
        },
      }}
    >
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: 3,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #4f46e5, #ec4899)',
            zIndex: 1,
          }
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Box 
              component="img"
              src="fyg-logo.png"
              alt="Find Your Gate"
              sx={{ 
                width: 80, 
                height: 80,
                mb: 2,
                filter: isDarkMode ? 'brightness(1.2)' : 'none' 
              }}
            />
          </motion.div>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              letterSpacing: '0.5px',
              backgroundImage: isDarkMode 
                ? 'linear-gradient(90deg, #818cf8, #f472b6)' 
                : 'linear-gradient(90deg, #4f46e5, #db2777)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            Find Your Gate
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Connectez-vous pour accéder à l'application
          </Typography>
        </Box>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          </motion.div>
        )}

        <Box sx={{ mb: 3 }}>
          <motion.div
            whileFocus="focused"
            variants={inputVariants}
          >
            <TextField
              autoFocus
              margin="dense"
              id="identifier"
              label="Nom d'utilisateur ou Email"
              type="text"
              fullWidth
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  transition: 'all 0.3s ease',
                },
                mb: 2,
              }}
            />
          </motion.div>

          <motion.div
            whileFocus="focused"
            variants={inputVariants}
          >
            <TextField
              margin="dense"
              id="password"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  transition: 'all 0.3s ease',
                },
              }}
            />
          </motion.div>
        </Box>

        <DialogActions>
          <motion.div
            whileHover="hover"
            whileTap="pressed"
            variants={buttonVariants}
          >
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              component={motion.button}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="pressed"
              sx={{ 
                py: 1.5,
                borderRadius: '10px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                boxShadow: isDarkMode ? '0 8px 20px rgba(79, 70, 229, 0.4)' : '0 8px 20px rgba(79, 70, 229, 0.25)',
                background: 'linear-gradient(90deg, #4f46e5, #a855f7)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #6366f1, #c084fc)',
                  boxShadow: isDarkMode ? '0 10px 25px rgba(79, 70, 229, 0.5)' : '0 10px 25px rgba(79, 70, 229, 0.35)',
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Connexion'}
            </Button>
          </motion.div>
        </DialogActions>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button 
            variant="text"
            onClick={onSwitchToRegister}
            sx={{ 
              textTransform: 'none', 
              color: 'text.secondary', 
              '&:hover': { 
                color: 'primary.main', 
                textDecoration: 'underline' 
              }
            }}
          >
            Pas encore de compte ? Créez-en un
          </Button>
        </Box>

        <Typography 
          variant="caption" 
          align="center" 
          sx={{ 
            display: 'block', 
            mt: 3, 
            color: 'text.secondary',
            opacity: 0.7
          }}
        >
          © {new Date().getFullYear()} Find Your Gate - Tous droits réservés
        </Typography>
      </Box>
    </Dialog>
  );
}; 