import { useMemo } from 'react';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { NavigateBefore, NavigateNext, FirstPage, LastPage } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface PaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

export const Pagination = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) => {
  const { isDarkMode } = useDarkMode();
  const totalPages = Math.ceil(count / rowsPerPage);
  
  // Options pour le nombre d'éléments par page
  const rowsPerPageOptions = [12, 24, 36, 48];
  
  // Calculer l'intervalle d'éléments affichés
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(count, (page + 1) * rowsPerPage);

  // Générer les boutons de pages
  const pageButtons = useMemo(() => {
    const buttons = [];
    const maxVisiblePages = 5; // Nombre max de boutons de pages visibles
    
    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    // Ajuster la page de départ si on est proche de la fin
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    // Ajouter le bouton pour la première page avec ellipsis si nécessaire
    if (startPage > 0) {
      buttons.push(
        <motion.button
          key="first-page"
          onClick={() => onPageChange(0)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-200 ${
            isDarkMode 
              ? 'hover:bg-slate-700/50 text-gray-400 hover:text-gray-200'
              : 'hover:bg-blue-100 text-gray-600 shadow-sm'
          }`}
        >
          1
        </motion.button>
      );
      
      if (startPage > 1) {
        buttons.push(
          <span key="ellipsis-start" className="px-1 text-gray-400 flex items-center">•••</span>
        );
      }
    }
    
    // Ajouter les boutons pour les pages visibles
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <motion.button
          key={`page-${i}`}
          onClick={() => onPageChange(i)}
          whileHover={page !== i ? { scale: 1.05 } : {}}
          whileTap={page !== i ? { scale: 0.95 } : {}}
          className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-200 ${
            page === i 
              ? isDarkMode 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
              : isDarkMode 
                ? 'hover:bg-slate-700/50 text-gray-400 hover:text-gray-200'
                : 'hover:bg-blue-100 text-gray-600 shadow-sm'
          }`}
        >
          {i + 1}
        </motion.button>
      );
    }
    
    // Ajouter le bouton pour la dernière page avec ellipsis si nécessaire
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        buttons.push(
          <span key="ellipsis-end" className="px-1 text-gray-400 flex items-center">•••</span>
        );
      }
      
      buttons.push(
        <motion.button
          key="last-page"
          onClick={() => onPageChange(totalPages - 1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-200 ${
            isDarkMode 
              ? 'hover:bg-slate-700/50 text-gray-400 hover:text-gray-200'
              : 'hover:bg-blue-100 text-gray-600 shadow-sm'
          }`}
        >
          {totalPages}
        </motion.button>
      );
    }
    
    return buttons;
  }, [page, totalPages, isDarkMode, onPageChange]);
  
  return (
    <div className={`
      flex flex-col sm:flex-row justify-between items-center gap-4 py-4 px-4
      rounded-b-xl
      ${isDarkMode 
        ? 'text-gray-300'
        : 'text-gray-600'}
    `}>
      {/* Contrôles principaux de pagination */}
      <div className="flex items-center gap-2">
        <motion.button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          whileHover={page !== 0 ? { scale: 1.05 } : {}}
          whileTap={page !== 0 ? { scale: 0.95 } : {}}
          className={`p-1.5 rounded-md disabled:opacity-40 transition-all duration-200 ${
            isDarkMode
              ? 'text-gray-400 hover:bg-slate-700/50 hover:text-gray-200 disabled:text-gray-600'
              : 'text-gray-600 hover:bg-gray-100 disabled:text-gray-400'
          }`}
          aria-label="Première page"
        >
          <FirstPage className="h-5 w-5" />
        </motion.button>
        
        <motion.button
          onClick={() => page > 0 && onPageChange(page - 1)}
          disabled={page === 0}
          whileHover={page !== 0 ? { scale: 1.05 } : {}}
          whileTap={page !== 0 ? { scale: 0.95 } : {}}
          className={`p-1.5 rounded-md disabled:opacity-40 transition-all duration-200 ${
            isDarkMode
              ? 'text-gray-400 hover:bg-slate-700/50 hover:text-gray-200 disabled:text-gray-600'
              : 'text-gray-600 hover:bg-gray-100 disabled:text-gray-400'
          }`}
          aria-label="Page précédente"
        >
          <NavigateBefore className="h-5 w-5" />
        </motion.button>
        
        <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden hide-scrollbar px-1 h-11">
          {pageButtons}
        </div>
        
        <motion.button
          onClick={() => page < totalPages - 1 && onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          whileHover={page < totalPages - 1 ? { scale: 1.05 } : {}}
          whileTap={page < totalPages - 1 ? { scale: 0.95 } : {}}
          className={`p-1.5 rounded-md disabled:opacity-40 transition-all duration-200 ${
            isDarkMode
              ? 'text-gray-400 hover:bg-slate-700/50 hover:text-gray-200 disabled:text-gray-600'
              : 'text-gray-600 hover:bg-gray-100 disabled:text-gray-400'
          }`}
          aria-label="Page suivante"
        >
          <NavigateNext className="h-5 w-5" />
        </motion.button>
        
        <motion.button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          whileHover={page < totalPages - 1 ? { scale: 1.05 } : {}}
          whileTap={page < totalPages - 1 ? { scale: 0.95 } : {}}
          className={`p-1.5 rounded-md disabled:opacity-40 transition-all duration-200 ${
            isDarkMode
              ? 'text-gray-400 hover:bg-slate-700/50 hover:text-gray-200 disabled:text-gray-600'
              : 'text-gray-600 hover:bg-gray-100 disabled:text-gray-400'
          }`}
          aria-label="Dernière page"
        >
          <LastPage className="h-5 w-5" />
        </motion.button>
      </div>
      
      {/* Sélecteur d'éléments par page et indicateur */}
      <div className="flex items-center text-sm gap-3">
        <div className="flex items-center">
          <label htmlFor="rowsPerPage" className="mr-2 text-sm whitespace-nowrap">
            Par page:
          </label>
          <select
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
              onPageChange(0);
            }}
            className={`px-3 py-1.5 rounded-md border appearance-none focus:outline-none focus:ring-2 transition-all duration-200 ${
              isDarkMode 
                ? 'bg-slate-700 border-slate-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-600 focus:border-blue-600'
            }`}
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option} className={isDarkMode ? 'bg-slate-700' : 'bg-white'}>
                {option}
              </option>
            ))}
          </select>
        </div>
        
        <div className={`px-3 py-1.5 rounded-md font-medium ${
          isDarkMode ? 'bg-slate-700/60 text-gray-300' : 'bg-gray-100/80 text-gray-600'
        }`}>
          <span>{from}-{to}</span>
          <span className="mx-1 text-gray-400">/</span>
          <span>{count}</span>
        </div>
      </div>
    </div>
  );
}; 