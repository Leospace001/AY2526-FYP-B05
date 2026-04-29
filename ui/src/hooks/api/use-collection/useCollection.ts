import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface FlowerCollectionAddRequest {
  flowerName: string;
  scientificName?: string;
  careInstructionsSummary?: string;
}

export interface FlowerCollectionItem {
  id: string;
  flowerName: string;
  scientificName?: string | null;
  collectedAt: string;
  careInstructionsSummary?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const COLLECTION_QUERY_KEY = ['collections'];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeCollectionError = (error: any) => {
  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    return new Error('Your session has expired. Please log in again.');
  }
  const backendError = error?.response?.data?.error;
  const responseMessage = typeof error?.response?.data === 'string' ? error.response.data : undefined;
  return new Error(backendError || responseMessage || error?.message || 'Collection request failed.');
};

export const useCollections = () => {
  return useQuery({
    queryKey: COLLECTION_QUERY_KEY,
    queryFn: async (): Promise<FlowerCollectionItem[]> => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/collection`, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        return response.data;
      } catch (error: any) {
        throw normalizeCollectionError(error);
      }
    },
  });
};

export const useAddCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FlowerCollectionAddRequest): Promise<FlowerCollectionItem> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/collection/add`, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });
        return response.data;
      } catch (error: any) {
        throw normalizeCollectionError(error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEY });
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await axios.delete(`${API_BASE_URL}/api/collection/${id}`, {
          headers: {
            ...getAuthHeaders(),
          },
        });
      } catch (error: any) {
        throw normalizeCollectionError(error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEY });
    },
  });
};
