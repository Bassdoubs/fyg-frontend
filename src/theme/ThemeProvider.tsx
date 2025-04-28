import React, { createContext, useContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { useDarkMode } from '../hooks/useDarkMode';

// Définir le contexte du thème
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

// Hook custom pour utiliser le contexte de thème
export const useThemeContext = () => useContext(ThemeContext);

/**
 * Provider de thème pour Material-UI qui s'accorde avec le thème sombre/clair de l'application.
 * Englobe l'application pour fournir des styles cohérents.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  // Création du thème MUI basé sur le mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: isDarkMode ? 'dark' : 'light',
        primary: {
          main: isDarkMode ? '#6366f1' : '#4f46e5', // Indigo plus vif
          light: isDarkMode ? '#818cf8' : '#6366f1',
          dark: isDarkMode ? '#4338ca' : '#3730a3',
        },
        secondary: {
          main: isDarkMode ? '#ec4899' : '#db2777', // Rose/Magenta moderne
          light: isDarkMode ? '#f472b6' : '#ec4899',
          dark: isDarkMode ? '#be185d' : '#9d174d',
        },
        background: {
          default: isDarkMode ? '#0f172a' : '#f8fafc', // Slate/blue plus profond pour le dark mode
          paper: isDarkMode ? '#1e293b' : '#ffffff',
        },
        text: {
          primary: isDarkMode ? '#f1f5f9' : '#0f172a',
          secondary: isDarkMode ? '#cbd5e1' : '#475569',
        },
        error: {
          main: isDarkMode ? '#f87171' : '#ef4444',
        },
        warning: {
          main: isDarkMode ? '#fbbf24' : '#f59e0b',
        },
        info: {
          main: isDarkMode ? '#38bdf8' : '#0ea5e9',
        },
        success: {
          main: isDarkMode ? '#4ade80' : '#22c55e',
        },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontWeight: 700,
          letterSpacing: '-0.025em',
        },
        h2: {
          fontWeight: 700,
          letterSpacing: '-0.025em',
        },
        h3: {
          fontWeight: 600,
          letterSpacing: '-0.025em',
        },
        h4: {
          fontWeight: 600,
        },
        h5: {
          fontWeight: 600,
        },
        h6: {
          fontWeight: 600,
        },
        subtitle1: {
          fontWeight: 500,
        },
        subtitle2: {
          fontWeight: 500,
        },
        body1: {
          lineHeight: 1.6,
        },
        button: {
          fontWeight: 600,
          textTransform: 'none',
        },
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: isDarkMode 
                ? '0 8px 16px rgba(0, 0, 0, 0.4)' 
                : '0 4px 12px rgba(59, 130, 246, 0.12)',
              transition: 'background-color 0.3s, box-shadow 0.3s',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              transition: 'background-color 0.3s, box-shadow 0.3s',
              ...(isDarkMode && {
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
              }),
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
              boxShadow: isDarkMode 
                ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                : '0 2px 8px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDarkMode 
                  ? '0 10px 20px rgba(0, 0, 0, 0.4)' 
                  : '0 8px 16px rgba(59, 130, 246, 0.12)',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              padding: '8px 16px',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDarkMode 
                  ? '0 6px 12px rgba(0, 0, 0, 0.3)' 
                  : '0 4px 8px rgba(59, 130, 246, 0.12)',
              },
            },
            containedPrimary: {
              background: isDarkMode 
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)' 
                : 'linear-gradient(135deg, #4f46e5, #4338ca)',
            },
            containedSecondary: {
              background: isDarkMode 
                ? 'linear-gradient(135deg, #ec4899, #db2777)' 
                : 'linear-gradient(135deg, #db2777, #be185d)',
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                backgroundColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.04)',
              },
            },
          },
        },
      },
      shape: {
        borderRadius: 10,
      },
    }),
    [isDarkMode]
  );

  // Valeur du contexte
  const themeContextValue = useMemo(() => ({
    isDarkMode,
    toggleTheme: toggleDarkMode,
  }), [isDarkMode, toggleDarkMode]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 