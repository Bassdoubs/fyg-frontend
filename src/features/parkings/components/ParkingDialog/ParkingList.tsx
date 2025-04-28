import { motion } from 'framer-motion';
import { Checkbox, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MapIcon from '@mui/icons-material/Map';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from 'react';
import type { Parking } from '../../../../types/parking';

interface ParkingListProps {
  parkings: Parking[];
  selectedParkings: string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (parking: Parking) => void;
}

export const ParkingList = ({
  parkings,
  selectedParkings,
  onSelect,
  onSelectAll,
  onEdit
}: ParkingListProps) => {
  // État pour gérer les messages de copie
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fonction pour copier l'URL dans le presse-papiers
  const copyMapUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  // Fonction pour formater et raccourcir l'URL pour l'affichage
  const formatUrl = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url.length > 15 ? `${url.substring(0, 15)}...` : url;
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        <Checkbox
          checked={selectedParkings.length === parkings.length}
          indeterminate={selectedParkings.length > 0 && selectedParkings.length < parkings.length}
          onChange={(e) => onSelectAll(e.target.checked)}
        />
        <div className="grid grid-cols-4 flex-1 gap-4 font-medium text-sm text-gray-600 dark:text-gray-300">
          <span>Compagnie</span>
          <span>Terminal</span>
          <span>Porte</span>
          <span>Carte</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {parkings.map((parking, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={parking._id}
            className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Checkbox
              checked={selectedParkings.includes(parking._id)}
              onChange={(e) => onSelect(parking._id, e.target.checked)}
            />
            <div className="grid grid-cols-4 flex-1 gap-4">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {parking.airline}
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                {parking.gate.terminal || '-'}
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                {parking.gate.porte || '-'}
              </span>
              <span className="text-gray-600 dark:text-gray-300 flex items-center">
                {parking.mapInfo?.hasMap ? (
                  <div className="flex items-center">
                    <Tooltip title="Ce parking a une carte" arrow>
                      <MapIcon className="text-green-500 mr-1" fontSize="small" />
                    </Tooltip>
                    
                    {parking.mapInfo.mapUrl && (
                      <>
                        <Tooltip title="Ouvrir la carte" arrow>
                          <IconButton 
                            size="small" 
                            onClick={() => window.open(parking.mapInfo?.mapUrl, '_blank')}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={copiedId === parking._id ? "Copié !" : "Copier l'URL"} arrow>
                          <IconButton 
                            size="small" 
                            onClick={() => copyMapUrl(parking._id, parking.mapInfo?.mapUrl || '')}
                            className={copiedId === parking._id ? "text-green-500" : "text-gray-400 hover:text-gray-600"}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={parking.mapInfo.mapUrl} arrow>
                          <span className="text-xs ml-1 text-gray-500 truncate max-w-[100px] inline-block">
                            {formatUrl(parking.mapInfo.mapUrl)}
                            {parking.mapInfo.source ? ` (${parking.mapInfo.source})` : ''}
                          </span>
                        </Tooltip>
                      </>
                    )}
                  </div>
                ) : (
                  <Tooltip title="Aucune carte disponible" arrow>
                    <MapIcon className="text-gray-300 dark:text-gray-600" fontSize="small" />
                  </Tooltip>
                )}
              </span>
            </div>
            <IconButton 
              size="small"
              onClick={() => onEdit(parking)}
              className="text-gray-400 hover:text-gray-600"
            >
              <EditIcon />
            </IconButton>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 