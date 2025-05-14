import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface SessionExpiredModalProps {
  // Si vous préférez contrôler l'ouverture depuis le parent
  open?: boolean;
  onClose?: () => void;
}

/**
 * Composant Modal pour informer l'utilisateur que sa session a expiré
 * Compatible avec Material UI et le système d'authentification existant
 */
const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ open: propOpen, onClose }) => {
  const [open, setOpen] = useState(propOpen || false);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'URL contient le paramètre expired=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('expired') === 'true') {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    // Synchroniser avec la prop si fournie
    if (propOpen !== undefined) {
      setOpen(propOpen);
    }
  }, [propOpen]);

  // Fonction intentionnellement vide pour empêcher la fermeture en cliquant en dehors
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Empêcher la propagation de l'événement
    event.stopPropagation();
  };

  const handleClose = () => {
    // Cette fonction est désormais réservée pour le bouton "Se reconnecter"
    // et n'est plus appelée lors d'un clic sur l'arrière-plan
    setOpen(false);
    
    // Supprimer le paramètre de l'URL sans recharger la page
    const url = new URL(window.location.href);
    url.searchParams.delete('expired');
    window.history.replaceState({}, document.title, url.toString());
    
    // Callback parent si fourni
    if (onClose) {
      onClose();
    }
  };

  const handleLogin = () => {
    // Nettoyer le localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Rediriger vers la page de login
    navigate('/login');
    
    // Fermer le modal
    handleClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        // Désactiver complètement la fermeture automatique
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return; // Ne rien faire
        }
      }}
      aria-labelledby="session-expired-dialog-title"
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      {/* Utiliser une div au lieu de DialogTitle pour éviter la hiérarchie de titre */}
      <div
        style={{ 
          backgroundColor: '#f44336', 
          color: 'white',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography 
          component="div" 
          sx={{ 
            fontSize: '1.25rem',
            fontWeight: 500,
            lineHeight: 1.6
          }}
          id="session-expired-dialog-title"
        >
          Session expirée
        </Typography>
      </div>
      
      <DialogContent sx={{ py: 3, px: 3 }}>
        <Typography sx={{ mb: 2 }}>
          Votre session a expiré pour des raisons de sécurité.
        </Typography>
        <Typography>
          Veuillez vous reconnecter pour continuer à utiliser l'application.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button 
          onClick={handleLogin}
          variant="contained" 
          color="primary"
          fullWidth
          size="large"
        >
          Se reconnecter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionExpiredModal; 