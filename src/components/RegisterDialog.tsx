import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
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
import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/Key';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useThemeContext } from '../theme/ThemeProvider';
import api from '../services/api'; // Utiliser l'instance api configurée

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void; // Pour revenir au dialogue de connexion
}

export const RegisterDialog = ({ open, onClose, onSwitchToLogin }: RegisterDialogProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useThemeContext();

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    // TODO: Ajouter une validation plus robuste (longueur mdp, format email, etc.)

    setIsLoading(true);

    try {
      await api.post('/api/users/register', { 
        username,
        email,
        password 
      });

      setSuccessMessage('Compte créé avec succès ! Votre compte est en attente de validation par un administrateur.');
      // Optionnel : vider le formulaire après succès ? Garder ouvert pour le message.
      // Optionnel : fermer automatiquement après X secondes ?

    } catch (err: any) {
      let errorMessage = 'Erreur lors de la création du compte.';
      // Assurez-vous que l'erreur vient bien de l'instance api (qui utilise axios)
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Erreur réseau ou autre:', err);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // --- Styles et Animations (similaires à LoginDialog) ---
  const dialogVariants = { /* ... */ }; // Copier de LoginDialog si nécessaire
  const inputVariants = { /* ... */ };  // Copier de LoginDialog si nécessaire
  const buttonVariants = { /* ... */ }; // Copier de LoginDialog si nécessaire
  const gradientBackground = isDarkMode ? '...' : '...'; // Copier de LoginDialog si nécessaire

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} // Utiliser handleClose pour reset le formulaire
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: motion.div,
        // initial, animate, variants, style... (copier de LoginDialog)
        style: {
          borderRadius: '16px',
          // background: gradientBackground, // Décommenter après copie
          // ... autres styles
        }
      }}
    >
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: 3,
          // ... styles du form (copier de LoginDialog)
        }}
      >
        {/* --- Header (Titre, Logo) --- */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          {/* <motion.div> ... </motion.div> */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Créer un compte
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rejoignez Find Your Gate
          </Typography>
        </Box>

        {/* --- Messages d'erreur et de succès --- */}
        {error && (
          <motion.div /* ... animation ... */>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          </motion.div>
        )}
        {successMessage && (
          <motion.div /* ... animation ... */>
            <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
          </motion.div>
        )}

        {/* --- Champs du formulaire --- */}
        {!successMessage && ( // Masquer les champs après succès ?
          <>
            <Box sx={{ mb: 2 }}>
              <TextField /* Username */ 
                required 
                fullWidth 
                label="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccountCircleIcon /></InputAdornment> }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField /* Email */ 
                required 
                fullWidth 
                label="Adresse Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField /* Password */ 
                required 
                fullWidth 
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{ 
                  startAdornment: <InputAdornment position="start"><KeyIcon /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <TextField /* Confirm Password */ 
                required 
                fullWidth 
                label="Confirmer le mot de passe"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={password !== confirmPassword && confirmPassword !== ''}
                helperText={password !== confirmPassword && confirmPassword !== '' ? 'Les mots de passe ne correspondent pas' : ''}
                InputProps={{ 
                  startAdornment: <InputAdornment position="start"><KeyIcon /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleToggleConfirmPassword} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </>
        )}

        {/* --- Actions (Boutons) --- */}
        <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 0 }}>
          {!successMessage && (
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              sx={{ py: 1.5, borderRadius: '10px' }} // Adapter les styles
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Créer le compte'}
            </Button>
          )}
          <Button 
            fullWidth
            variant="text"
            onClick={onSwitchToLogin} 
            sx={{ textTransform: 'none' }}
          >
            {successMessage ? 'Aller à la connexion' : 'Déjà un compte ? Connectez-vous'}
          </Button>
        </DialogActions>

      </Box>
    </Dialog>
  );
};

// Ajouter les styles/animations manquants en s'inspirant de LoginDialog.tsx
// Remplacer les commentaires /* ... */ par le code copié de LoginDialog.tsx
// (dialogVariants, inputVariants, buttonVariants, gradientBackground, PaperProps style, form sx) 