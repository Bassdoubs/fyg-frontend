import { useState, useEffect, useCallback, useRef } from 'react';

// Création d'un objet global pour la communication entre composants
interface ThemeManager {
  isDarkMode: boolean;
  listeners: Array<(isDark: boolean) => void>;
  subscribe: (listener: (isDark: boolean) => void) => () => void;
  notifyChange: (isDark: boolean) => void;
}

// Singleton pour synchroniser l'état du thème entre les instances du hook
const themeManager: ThemeManager = {
  isDarkMode: false,
  listeners: [],
  subscribe(listener: (isDark: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  notifyChange(isDark: boolean) {
    this.isDarkMode = isDark;
    this.listeners.forEach(listener => listener(isDark));
    // Également envoyer un événement pour les composants qui n'utilisent pas le hook
    window.dispatchEvent(new CustomEvent('themechange', { detail: { isDarkMode: isDark } }));
  }
};

/**
 * Hook qui gère l'état du thème sombre/clair avec des variables CSS
 */
export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const themeChangeEventRef = useRef<CustomEvent | null>(null);

  useEffect(() => {
    // Récupération du mode depuis localStorage
    const savedMode = localStorage.getItem('darkMode');
    const initialMode = savedMode === 'true';
    
    // Vérifier la préférence du système
    if (savedMode === null) {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDarkMode);
      localStorage.setItem('darkMode', prefersDarkMode.toString());
    } else {
      setIsDarkMode(initialMode);
    }

    // Application des classes CSS immédiatement
    document.documentElement.classList.toggle('dark', initialMode);
    document.body.classList.toggle('dark', initialMode);
  }, []);

  // Création d'un événement personnalisé pour le changement de thème
  useEffect(() => {
    // Initialiser l'événement de changement de thème
    themeChangeEventRef.current = new CustomEvent('themechange', {
      detail: { isDarkMode }
    });
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      
      // Mettre à jour localStorage
      localStorage.setItem('darkMode', newMode.toString());
      
      // Mise à jour du DOM en utilisant des transformations CSS pour les transitions
      document.documentElement.classList.toggle('dark', newMode);
      document.body.classList.toggle('dark', newMode);
      
      // Incrémenter le renderKey pour forcer un re-rendu des composants qui en dépendent
      setRenderKey(prev => prev + 1);
      
      // Déclencher l'événement personnalisé
      if (themeChangeEventRef.current) {
        window.dispatchEvent(themeChangeEventRef.current);
      }
      
      return newMode;
    });
  }, []);

  return { isDarkMode, toggleDarkMode, renderKey };
}; 