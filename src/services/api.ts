import axios from 'axios';

// baseURL ne contient que l'adresse du serveur
const baseURL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_BASE_URL // Ex: https://fyg-backend-prod...app
  : 'http://localhost:3000';          // Ex: http://localhost:3000 (sans /api)

// ----> SUPPRESSION DIAGNOSTIC <----
// console.log("[api.ts] Détection environnement PROD:", import.meta.env.PROD);
// console.log("[api.ts] Valeur VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
// console.log("[api.ts] baseURL effective utilisée pour Axios:", baseURL);
// ----> FIN SUPPRESSION <----

// Code de diagnostic supprimé :
// // !! DIAGNOSTIC TEMPORAIRE : URL Backend en dur !!
// const baseURL = 'https://fyg-backend-production.up.railway.app'; 
// 
// // Ligne originale commentée :
// // const baseURL = import.meta.env.PROD 
// //   ? import.meta.env.VITE_API_BASE_URL // Utiliser la variable d'env en production
// //   : 'http://localhost:3000/api';      // Utiliser localhost en développement

const api = axios.create({ 
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// --- Intercepteur pour ajouter le token JWT --- 
api.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      // Si le token existe, l'ajouter à l'en-tête Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Retourner la configuration modifiée ou originale
  },
  (error) => {
    // Gérer les erreurs de configuration de requête
    return Promise.reject(error);
  }
);

// Intercepteur principal pour gérer les réponses et erreurs
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Erreur 401
      if (error.response.status === 401) {
        console.warn('Erreur 401 détectée: Token invalide ou expiré');
        
        // Vérifier si c'est spécifiquement une erreur d'expiration
        const isExpired = error.response.data.expired || 
                          error.response.data.message === 'Token expiré' ||
                          error.response.data.message?.includes('expiré');
        
        // 1. Nettoyer le localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        
        // 2. Redirection basée sur le type d'erreur
        if (isExpired) {
          // Rediriger vers login avec le paramètre expired=true
          window.location.href = '/login?expired=true';
        } else {
          // Redirection standard vers login
          window.location.href = '/login';
        }
        
        // 3. Stopper la propagation de l'erreur
        return new Promise(() => {}); 
      }
      
      // Erreur 403
      if (error.response.status === 403) {
        console.warn('Erreur 403 détectée: Accès refusé.');
        // On pourrait afficher un message à l'utilisateur ici via un système de notification global
        // store.dispatch(showGlobalNotification('Vous n\'avez pas les droits pour effectuer cette action.', 'error'));
      }
    }
    
    // Rejeter les autres erreurs
    return Promise.reject(error);
  }
);

// Intercepteurs supplémentaires pour le debug - uniquement en développement
if (!import.meta.env.PROD) {
  api.interceptors.request.use(request => {
    // Ce log montrera maintenant les en-têtes, y compris Authorization si présent
    // console.log('Starting Request:', request); // <-- Commenter ou supprimer ce log
    return request;
  });

  api.interceptors.response.use(
    response => response,
    error => {
      // Laisser passer l'erreur vers l'intercepteur principal ci-dessus
      return Promise.reject(error);
    }
  );
}

export default api; 