import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CurrentUserReturn } from '../use-user/types';
import { User } from '../../../types/user/userTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeAuthError = (error: any) => {
  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    return new Error('Your session has expired. Please log in again.');
  }
  return new Error(error?.response?.data?.error || error?.message || 'Request failed.');
};

export const useCurrentUser = (enabled = true): CurrentUserReturn => {
  return useQuery<User>({
    queryKey: ['currentUser'],
    enabled,
    retry: false,
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        return response.data;
      } catch (error: any) {
        throw normalizeAuthError(error);
      }
    },
  }) as CurrentUserReturn;
};

export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { username: string; password?: string }) => {
      try {
        const response = await axios.put(`${API_BASE_URL}/api/users/me`, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });
        return response.data;
      } catch (error: any) {
        throw normalizeAuthError(error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};
