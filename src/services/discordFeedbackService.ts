// import axios from 'axios'; // <-- Supprimer l'import direct
import api from './api'; // Importer l'export par défaut
// import { DiscordFeedbackData } from '@fyg/shared'; // Commenté

// Base URL pour les routes de feedback Discord
const baseURL = '/api/discord-feedback'; // Ajout /api

export const getAll = async (params = {}) => {
  const response = await api.get(baseURL, { params }); // <-- Utiliser api.get
  return response.data;
};

export const getById = async (id: string) => {
  const response = await api.get(`${baseURL}/${id}`); // <-- Utiliser api.get
  return response.data;
};

export const getStats = async () => {
  const response = await api.get(`${baseURL}/stats`); // <-- Utiliser api.get
  return response.data;
};

export const updateStatus = async (id: string, status: string, adminNotes?: string) => {
  const response = await api.patch(`${baseURL}/${id}/status`, { // <-- Utiliser api.patch
    status,
    adminNotes
  });
  return response.data;
};

export const deleteFeedback = async (id: string): Promise<void> => {
  try {
    // Utiliser api.delete avec le chemin relatif + BASEURL ou préfixe /api
    // await api.delete(`/discord-feedback/${id}`); 
    await api.delete(`${baseURL}/${id}`); // Utilisation de la baseURL corrigée
  } catch (error: any) { 
    console.error("Erreur lors de la suppression du feedback:", error.response?.data || error.message);
    throw error; 
  }
};

// Interface pour la réponse paginée des feedbacks
interface PaginatedFeedbacksResponse {
  docs: any[]; // Remplacé DiscordFeedbackData[] par any[]
  totalDocs: number;
}

// Récupérer les feedbacks (paginés)
export const getFeedbacks = async (page: number = 1, limit: number = 10): Promise<PaginatedFeedbacksResponse> => {
  try {
    const response = await api.get<PaginatedFeedbacksResponse>(`${baseURL}?page=${page}&limit=${limit}`);
    // Validation basique
    if (response.data && Array.isArray(response.data.docs) && typeof response.data.totalDocs !== 'undefined') {
      return response.data;
    } else {
      throw new Error('Format de réponse invalide pour les feedbacks.');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des feedbacks:', error);
    throw error; // Relancer pour gestion dans le composant
  }
};

// Ajouter un feedback
export const addFeedback = async (feedbackData: Omit<any, '_id' | 'createdAt' | 'updatedAt'>): Promise<any> => { // Remplacé DiscordFeedbackData par any
  try {
    const response = await api.post<any>(baseURL, feedbackData); // Remplacé DiscordFeedbackData par any
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du feedback:', error);
    throw error;
  }
};

const discordFeedbackService = {
  getAll,
  getById,
  getStats,
  updateStatus,
  deleteFeedback,
  getFeedbacks,
  addFeedback
};

export default discordFeedbackService; 