import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ParkingData } from '@bassdoubs/fyg-shared';

interface ParkingListProps {
  parkings: ParkingData[];
  onEdit: (parking: ParkingData) => void;
  onDelete: (id: string) => void;
}

export const ParkingList: React.FC<ParkingListProps> = ({
  parkings,
  onEdit,
  onDelete,
}) => {
  if (parkings.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Aucun parking trouvé
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Compagnie</TableCell>
            <TableCell>Aéroport</TableCell>
            <TableCell>Terminal</TableCell>
            <TableCell>Porte</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {parkings.map((parking) => (
            <TableRow key={parking._id}>
              <TableCell>{parking.airline}</TableCell>
              <TableCell>{parking.airport}</TableCell>
              <TableCell>{parking.gate?.terminal ?? 'N/A'}</TableCell>
              <TableCell>{parking.gate?.porte ?? 'N/A'}</TableCell>
              <TableCell>
                <Tooltip title="Modifier">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(parking)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(parking._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 