import { useState, useCallback } from 'react';

export type SortOption = 'updatedAt' | 'airport' | 'parkingCount';
export type ViewModeOption = 'grid' | 'list';

interface UseParkingViewControlsReturn {
  searchTerm: string;
  sortBy: SortOption;
  viewMode: ViewModeOption;
  handleSearch: (query: string) => void;
  handleSort: (sortField: SortOption) => void;
  handleViewModeChange: (event: React.MouseEvent<HTMLElement>, newViewMode: ViewModeOption | null) => void;
}

export const useParkingViewControls = (
  initialSortBy: SortOption = 'updatedAt',
  initialViewMode: ViewModeOption = 'grid'
): UseParkingViewControlsReturn => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [viewMode, setViewMode] = useState<ViewModeOption>(initialViewMode);

  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  const handleSort = useCallback((sortField: SortOption) => {
    setSortBy(sortField);
  }, []);

  const handleViewModeChange = useCallback((event: React.MouseEvent<HTMLElement>, newViewMode: ViewModeOption | null) => {
    // Material UI ToggleButton passes null if the button is clicked again when exclusive=true
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  }, []);

  return {
    searchTerm,
    sortBy,
    viewMode,
    handleSearch,
    handleSort,
    handleViewModeChange,
  };
}; 