import api from './api';

interface ImportSummary {
  total: number;
  inserted: number;
  duplicates: number;
}

/**
 * Service pour la gestion des parkings
 */
export const parkingService = {
  /**
   * Importe une liste de parkings en masse
   */
  async bulkImport(parkings: Array<Omit<any, '_id'>>): Promise<{
    status: 'partial' | 'success';
    summary: ImportSummary;
    duplicateDetails: any[];
  }> {
    try {
      const response = await api.post<{
        summary: ImportSummary;
        duplicateDetails: Array<{ airline: string; airport: string }>;
      }>('/parkings/bulk', { parkings });
      
      return {
        status: response.status === 207 ? 'partial' : 'success',
        summary: response.data.summary,
        duplicateDetails: response.data.duplicateDetails
      };
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      throw error;
    }
  },

  /**
   * Supprime un ou plusieurs parkings
   */
  async deleteParkings(ids: string[]): Promise<void> {
    try {
      await api.delete('/api/parkings', { data: { ids } });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },

  async getParkings(page: number, limit: number, filters: any = {}): Promise<any> {
    const response = await api.get('/api/parkings', { params: { page, limit, ...filters } });
    return response.data;
  },

  async addParking(parking: Omit<any, '_id'>): Promise<any> {
    const response = await api.post('/api/parkings', parking);
    return response.data;
  },

  async updateParking(id: string, parking: Omit<any, '_id'>): Promise<any> {
    const response = await api.put(`/api/parkings/${id}`, parking);
    return response.data;
  },

  async deleteParking(id: string): Promise<void> {
    await api.delete(`/api/parkings/${id}`);
  },

  // Récupérer tous les parkings (simple, non paginé pour l'instant, pour les besoins initiaux des stats/cartes)
  async getAllParkingsSimple(): Promise<any[]> {
    try {
      // TODO: Gérer la pagination ou un limit très élevé si nécessaire
      const response = await api.get('/api/parkings');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des parkings:', error);
      throw error;
    }
  }
}; 