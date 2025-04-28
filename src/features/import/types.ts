import type { Parking } from '../../types/parking';

export interface ImportResult {
  status: 'success' | 'partial';
  summary: {
    total: number;
    inserted: number;
    duplicates: number;
  };
  duplicateDetails: Array<{
    airline: string;
    airport: string;
    reason: string;
  }>;
}

export interface ValidationError {
  row: number;
  field: keyof Omit<Parking, '_id'>;
  message: string;
}

export interface ParsedData {
  data: Array<Partial<Omit<Parking, '_id'>>>;
  errors?: string[];
} 