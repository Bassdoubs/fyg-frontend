import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParsedData } from '../types';
import type { Parking } from '../../../types/parking';

const transformImportData = (data: any[]): Array<Partial<Omit<Parking, '_id'>>> => {
  return data.map(row => {
    // Créer l'objet parking de base
    const parkingData: Partial<Omit<Parking, '_id'>> = {
      airline: row.airline || row.compagnie || '',
      airport: row.airport || row.aeroport || '',
      gate: {
        terminal: row.terminal || '',
        porte: row.porte || row.gate || ''
      }
    };
    
    // Ajouter les informations de carte si présentes
    const hasMapUrl = Boolean(row.mapurl || row.url_carte || row.map_url || row.carte_url);
    const hasMapSource = Boolean(row.mapsource || row.source_carte || row.map_source || row.carte_source || row.source);
    
    if (hasMapUrl || hasMapSource) {
      parkingData.mapInfo = {
        hasMap: hasMapUrl,
        mapUrl: row.mapurl || row.url_carte || row.map_url || row.carte_url || '',
        source: row.mapsource || row.source_carte || row.map_source || row.carte_source || row.source || ''
      };
    }
    
    return parkingData;
  });
};

export const useImportParser = (file: File | null) => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    const parseFile = async () => {
      try {
        if (file.name.endsWith('.csv')) {
          Papa.parse(file, {
            complete: (results) => {
              if (results.errors.length > 0) {
                setError('Erreur lors de la lecture du fichier CSV');
                return;
              }
              setParsedData({
                data: transformImportData(results.data),
                errors: []
              });
            },
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase()
          });
        } else if (file.name.endsWith('.xlsx')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = e.target?.result;
              const workbook = XLSX.read(data, { type: 'binary' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(sheet);
              setParsedData({
                data: transformImportData(jsonData as any[]),
                errors: []
              });
            } catch (err) {
              setError('Erreur lors de la lecture du fichier Excel');
            }
          };
          reader.onerror = () => {
            setError('Erreur lors de la lecture du fichier');
          };
          reader.readAsBinaryString(file);
        }
      } catch (err) {
        setError('Erreur inattendue lors de la lecture du fichier');
      } finally {
        setIsLoading(false);
      }
    };

    parseFile();
  }, [file]);

  return { parsedData, setParsedData, isLoading, error };
}; 