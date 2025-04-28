import { 
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, TextField, IconButton, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { Parking } from '../../../../types/parking';
import type { ValidationError } from '../../types';
import { useState } from 'react';

interface ImportPreviewProps {
  data: Array<Partial<Omit<Parking, '_id'>>>;
  errors: ValidationError[];
  onUpdateRow: (index: number, updatedData: Partial<Omit<Parking, '_id'>>) => void;
}

type EditableParking = {
  airline?: string;
  airport?: string;
  gate?: {
    terminal?: string;
    porte?: string;
  };
};

export const ImportPreview = ({ data, errors, onUpdateRow }: ImportPreviewProps) => {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditableParking>({});

  const getErrorsForRow = (rowIndex: number) => 
    errors.filter(error => error.row === rowIndex);

  const handleStartEdit = (index: number) => {
    setEditingRow(index);
    setEditData({
      ...data[index],
      gate: {
        terminal: data[index].gate?.terminal || '',
        porte: data[index].gate?.porte || ''
      }
    });
  };

  const handleSaveEdit = () => {
    if (editingRow !== null && editData) {
      const validData: Partial<Omit<Parking, '_id'>> = {
        ...editData,
        gate: editData.gate ? {
          terminal: editData.gate.terminal || '',
          porte: editData.gate.porte || ''
        } : undefined
      };
      onUpdateRow(editingRow, validData);
      setEditingRow(null);
      setEditData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <Typography className="text-gray-700 dark:text-gray-200">
          {data.length} parkings à importer
        </Typography>
      </div>

      <TableContainer className="bg-white dark:bg-gray-800 rounded-lg">
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50 dark:bg-gray-700">
              <TableCell className="font-medium text-gray-700 dark:text-gray-200">#</TableCell>
              <TableCell className="font-medium text-gray-700 dark:text-gray-200">Compagnie</TableCell>
              <TableCell className="font-medium text-gray-700 dark:text-gray-200">Aéroport</TableCell>
              <TableCell className="font-medium text-gray-700 dark:text-gray-200">Terminal</TableCell>
              <TableCell className="font-medium text-gray-700 dark:text-gray-200">Porte</TableCell>
              <TableCell className="font-medium text-gray-700 dark:text-gray-200">Erreurs</TableCell>
              <TableCell className="font-medium text-gray-700 dark:text-gray-200">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => {
              const rowErrors = getErrorsForRow(index);
              const isEditing = editingRow === index;

              return (
                <TableRow 
                  key={index}
                  className={`
                    ${rowErrors.length > 0 ? 'bg-red-50/50 dark:bg-red-900/20' : ''}
                    hover:bg-gray-50 dark:hover:bg-gray-700/50
                  `}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData?.airline || ''}
                        onChange={e => setEditData(prev => prev ? {
                          ...prev,
                          airline: e.target.value.toUpperCase()
                        } : { airline: e.target.value.toUpperCase() })}
                        className="w-24"
                      />
                    ) : row.airline}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData?.airport || ''}
                        onChange={e => setEditData(prev => ({ ...prev, airport: e.target.value.toUpperCase() }))}
                        className="w-24"
                      />
                    ) : row.airport}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData?.gate?.terminal || ''}
                        onChange={e => setEditData(prev => prev ? {
                          ...prev,
                          gate: {
                            ...prev.gate,
                            terminal: e.target.value
                          }
                        } : { gate: { terminal: e.target.value } })}
                        className="w-24"
                      />
                    ) : row.gate?.terminal}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData?.gate?.porte || ''}
                        onChange={e => setEditData(prev => ({
                          ...prev,
                          gate: {
                            terminal: prev?.gate?.terminal || '',
                            porte: e.target.value
                          }
                        }))}
                        className="w-24"
                      />
                    ) : row.gate?.porte}
                  </TableCell>
                  <TableCell>
                    {rowErrors.map((error, i) => (
                      <div key={i} className="text-red-600 dark:text-red-400 text-sm">
                        {error.message}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Tooltip title="Sauvegarder">
                          <IconButton size="small" onClick={handleSaveEdit} className="text-green-600">
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Annuler">
                          <IconButton size="small" onClick={handleCancelEdit} className="text-gray-500">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    ) : (
                      <Tooltip title="Modifier">
                        <IconButton 
                          size="small" 
                          onClick={() => handleStartEdit(index)}
                          className="text-blue-600"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}; 