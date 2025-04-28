import { useState, useEffect } from 'react';
import axios from 'axios';
import { Parking } from '../types';

export const useParkings = () => {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParkings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/parkings');
      setParkings(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des parkings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createParking = async (parking: Partial<Parking>) => {
    try {
      const response = await axios.post('/api/parkings', parking);
      setParkings((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError('Erreur lors de la création du parking');
      console.error(err);
      throw err;
    }
  };

  const updateParking = async (id: string, parking: Partial<Parking>) => {
    try {
      const response = await axios.put(`/api/parkings/${id}`, parking);
      setParkings((prev) =>
        prev.map((p) => (p._id === id ? response.data : p))
      );
      return response.data;
    } catch (err) {
      setError('Erreur lors de la mise à jour du parking');
      console.error(err);
      throw err;
    }
  };

  const deleteParking = async (id: string) => {
    try {
      await axios.delete(`/api/parkings/${id}`);
      setParkings((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError('Erreur lors de la suppression du parking');
      console.error(err);
      throw err;
    }
  };

  useEffect(() => {
    fetchParkings();
  }, []);

  return {
    parkings,
    loading,
    error,
    createParking,
    updateParking,
    deleteParking,
    refreshParkings: fetchParkings,
  };
}; 