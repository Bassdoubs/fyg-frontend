import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { 
  AddCircle, 
  FileUpload, 
  Help, 
  Close as CloseIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList,
  Check as CheckIcon
} from '@mui/icons-material';
import type { ParkingData, ImportResult } from '../../../../types/parking';
import DiscordIcon from '../../../../components/DiscordIcon';
import { LogsDialog } from '../../../../components/DiscordLogsDialog';
// Importer les dialogues d'import dynamiquement
const ImportDialog = lazy(() => import('../../../import/components/ImportDialog').then(module => ({ default: module.ImportDialog })));
const ImportGuideDialog = lazy(() => import('../../../import/components/ImportGuide').then(module => ({ default: module.ImportGuideDialog })));
import { 
  Tooltip, 
  useTheme, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';

interface ToolBarProps {
  onImport: (parkings: Array<Omit<ParkingData, '_id'>>) => Promise<ImportResult>;
  parkings: ParkingData[];
  onAddNew: () => void;
  // Props pour la recherche et le tri
  onSearch?: (query: string) => void;
  onSort?: (sortBy: string) => void;
  sortOptions?: { value: string; label: string }[];
}

export const ToolBar: React.FC<ToolBarProps> = ({ 
  onImport, 
  onAddNew,
  onSearch,
  onSort,
  sortOptions = [
    { value: 'date', label: 'Les plus récents' },
    { value: 'name', label: 'Nom (A-Z)' }
  ]
}) => {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showFileInput, setShowFileInput] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const { isDarkMode, renderKey } = useDarkMode();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour la recherche et le tri
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState(sortOptions[0].value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // États pour le menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Écouter les changements de thème
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      setForceUpdate(prev => prev + 1);
      
      // Forcer un recalcul des styles sur le toolbar
      if (toolbarRef.current) {
        // Ajouter une classe temporaire pour forcer un recalcul
        toolbarRef.current.classList.add('theme-force-update');
        
        // Lire une propriété pour forcer un reflow
        void toolbarRef.current.offsetHeight;
        
        // Retirer la classe après un court délai
        setTimeout(() => {
          if (toolbarRef.current) toolbarRef.current.classList.remove('theme-force-update');
        }, 10);
      }
    };
    
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);
  
  // Réagir au changement de renderKey pour forcer un recalcul
  useEffect(() => {
    if (toolbarRef.current) {
      void toolbarRef.current.offsetHeight;
    }
  }, [renderKey]);

  // Gestionnaires d'événements pour la recherche et le tri
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) onSearch(value);
  };

  // Gestionnaires d'événements pour le menu de tri
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSortSelect = (value: string) => {
    setSortBy(value);
    handleCloseMenu();
    if (onSort) onSort(value);
  };

  // Gestion de l'importation de fichiers
  const handleImportClick = () => {
    setShowFileInput(true);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setIsImportOpen(true);
    }
    // Réinitialiser l'input pour permettre de sélectionner le même fichier plusieurs fois
    e.target.value = '';
  };

  const handleImportClose = () => {
    setImportFile(null);
    setIsImportOpen(false);
  };

  const handleImportSubmit = async (data: Array<Omit<ParkingData, '_id'>>) => {
    const result = await onImport(data);
    handleImportClose();
    return result;
  };

  // Styles dynamiques basés sur le thème
  const toolbarBg = isDarkMode 
    ? 'rgba(31, 41, 55, 0.85)' 
    : 'rgba(255, 255, 255, 0.9)';
  
  const buttonBgBase = isDarkMode 
    ? 'rgba(55, 65, 81, 0.5)' 
    : 'rgba(243, 244, 246, 0.7)';
  
  const buttonBgHover = isDarkMode 
    ? 'rgba(75, 85, 99, 0.6)' 
    : 'rgba(229, 231, 235, 0.8)';

  const primaryColor = isDarkMode 
    ? theme.palette.primary.light 
    : theme.palette.primary.main;

  const primaryBg = isDarkMode 
    ? 'rgba(59, 130, 246, 0.15)' 
    : 'rgba(59, 130, 246, 0.08)';

  return (
    <div 
      ref={toolbarRef}
      className="relative"
      key={`toolbar-${renderKey}-${forceUpdate}`}
    >
      {/* Barre d'outils principale - version une seule ligne */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between p-3 rounded-xl overflow-hidden shadow-lg"
        style={{
          backgroundColor: toolbarBg,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.5)'}`,
        }}
      >
        {/* Barre de recherche */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon 
              fontSize="small" 
              sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }} 
            />
          </div>
          <input
            type="text"
            placeholder="Rechercher un parking..."
            value={searchValue}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)',
              borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.6)',
              color: isDarkMode ? '#fff' : '#000',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              caretColor: primaryColor,
            }}
          />
          {searchValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.9 }}
              className="absolute inset-y-0 right-2 flex items-center"
              onClick={() => {
                setSearchValue('');
                if (onSearch) onSearch('');
              }}
            >
              <CloseIcon 
                fontSize="small" 
                sx={{ 
                  color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                  '&:hover': { color: isDarkMode ? '#fff' : '#000' }
                }} 
              />
            </motion.button>
          )}
        </div>

        {/* Groupe de boutons à droite */}
        <div className="flex items-center ml-3 space-x-2">
          {/* Bouton de tri avec Menu MUI */}
          <Tooltip title="Trier les parkings" arrow placement="top">
            <IconButton
              onClick={handleOpenMenu}
              size="small"
              sx={{
                backgroundColor: buttonBgBase,
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  backgroundColor: buttonBgHover
                }
              }}
            >
              <FilterList
                sx={{
                  color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
                  transform: open ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s ease'
                }}
              />
            </IconButton>
          </Tooltip>
          
          {/* Menu MUI pour le tri */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            MenuListProps={{
              'aria-labelledby': 'sort-button',
            }}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 180,
                overflow: 'visible',
                backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.6)'}`,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                  borderTop: `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.6)'}`,
                  borderLeft: `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.6)'}`,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {sortOptions.map((option) => (
              <MenuItem
                key={option.value}
                selected={sortBy === option.value}
                onClick={() => handleSortSelect(option.value)}
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor: sortBy === option.value
                    ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isDarkMode 
                      ? 'rgba(59, 130, 246, 0.1)' 
                      : 'rgba(59, 130, 246, 0.05)'
                  },
                  color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
                }}
              >
                {sortBy === option.value && (
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckIcon
                      fontSize="small"
                      sx={{ 
                        color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.main 
                      }}
                    />
                  </ListItemIcon>
                )}
                <ListItemText 
                  primary={option.label} 
                  sx={{ 
                    ml: sortBy === option.value ? 0 : 4,
                    '& .MuiTypography-root': {
                      fontWeight: sortBy === option.value ? 500 : 400,
                      color: sortBy === option.value
                        ? (isDarkMode ? theme.palette.primary.light : theme.palette.primary.main)
                        : (isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)')
                    }
                  }}
                />
              </MenuItem>
            ))}
          </Menu>

          {/* Séparateur vertical */}
          <div className="h-8 w-px" style={{ backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.6)' }}></div>

          {/* Bouton logs Discord */}
          <Tooltip title="Logs Discord" arrow placement="top">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton
                onClick={() => setIsLogsOpen(true)}
                size="small"
                sx={{
                  backgroundColor: buttonBgBase,
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    backgroundColor: buttonBgHover
                  }
                }}
              >
                <DiscordIcon 
                  style={{ 
                    color: isDarkMode ? '#5865F2' : '#5865F2',
                    fontSize: '1.2rem'
                  }} 
                />
              </IconButton>
            </motion.div>
          </Tooltip>
          
          {/* Bouton guide d'import */}
          <Tooltip title="Guide d'import" arrow placement="top">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton
                onClick={() => setIsGuideOpen(true)}
                size="small"
                sx={{
                  backgroundColor: buttonBgBase,
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    backgroundColor: buttonBgHover
                  }
                }}
              >
                <Help 
                  sx={{ 
                    color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
                    fontSize: '1.2rem'
                  }} 
                />
              </IconButton>
            </motion.div>
          </Tooltip>

          {/* Séparateur vertical */}
          <div className="h-8 w-px" style={{ backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.6)' }}></div>
          
          {/* Bouton d'import */}
          <Tooltip title="Importer des parkings" arrow placement="top">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton
                onClick={handleImportClick}
                size="medium"
                sx={{
                  backgroundColor: theme.palette.success.main,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: theme.palette.success.dark,
                  },
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                <FileUpload />
              </IconButton>
            </motion.div>
          </Tooltip>
          
          {/* Input pour l'import de fichier (caché) */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {/* Bouton d'ajout */}
          <Tooltip title="Ajouter un parking" arrow placement="top">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton
                onClick={onAddNew}
                size="medium"
                sx={{
                  backgroundColor: primaryColor,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: isDarkMode 
                      ? 'rgba(59, 130, 246, 0.9)' 
                      : theme.palette.primary.dark,
                  },
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                <AddCircle />
              </IconButton>
            </motion.div>
          </Tooltip>
        </div>
      </motion.div>

      {/* Dialogs chargés dynamiquement avec Suspense */}
      <Suspense fallback={<div>Chargement du dialogue...</div>}> {/* Fallback simple */}
        {isImportOpen && importFile && (
          <ImportDialog 
            open={isImportOpen} 
            onClose={handleImportClose} 
            file={importFile}
            onImport={handleImportSubmit}
          />
        )}
      </Suspense>
      
      <Suspense fallback={null}> {/* Pas besoin de fallback visible pour le guide ? */}
        <ImportGuideDialog 
          open={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)} 
        />
      </Suspense>
      
      <LogsDialog 
        open={isLogsOpen} 
        onClose={() => setIsLogsOpen(false)} 
      />
    </div>
  );
}; 