// Importer le type partagé si nécessaire pour les types restants
import type { ParkingData } from '@fyg/shared';

// Ré-exporter ParkingData pour qu'il soit utilisable par d'autres modules
export type { ParkingData };

// Conserver les types spécifiques à l'import frontend
export interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  // Utiliser ParkingData pour typer les données attendues
  data: Array<Partial<Omit<ParkingData, '_id'>>>;
  onConfirm: (data: Array<Omit<ParkingData, '_id'>>) => Promise<{ // Utiliser ParkingData
    status: 'success' | 'partial';
    summary?: {
      total: number;
      inserted: number;
      duplicates: number;
    };
    duplicateDetails?: any[];
  }>;
  existingParkings?: ParkingData[]; // Utiliser ParkingData
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export type ImportResult = {
  status: 'success' | 'partial';
  summary: { total: number; inserted: number; duplicates: number };
  duplicateDetails: any[];
};