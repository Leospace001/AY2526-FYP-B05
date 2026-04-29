import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export interface FlowerRecommendationRequest {
  species: string;
  color: string;
  usage: string;
  traits: string[];
}

export interface FlowerRecommendationResponse {
  flower_name: string;
  scientific_name: string;
  recommendation_reason: string;
  care_instructions: string;
  demo_mode?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const buildDemoRecommendation = (): FlowerRecommendationResponse => ({
  flower_name: 'Iceberg Rose',
  scientific_name: "Rosa 'Iceberg'",
  recommendation_reason:
    'Demo mode is active because Gemini is temporarily unavailable. This safe fallback keeps the app working smoothly.',
  care_instructions:
    'Water deeply once or twice weekly, keep in full sun, and prune lightly after flowering to encourage healthy growth.',
  demo_mode: true,
});

const shouldFallbackToDemoMode = (error: unknown) => {
  if (!axios.isAxiosError(error)) return true;

  const status = error.response?.status;
  const errorText = JSON.stringify(error.response?.data ?? '').toLowerCase();

  return (
    status === 400 ||
    status === 429 ||
    status === 503 ||
    status === 502 ||
    status === 504 ||
    errorText.includes('user location is not supported') ||
    errorText.includes('gemini api error') ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED'
  );
};

export const useFlowerRecommendation = () => {
  return useMutation({
    mutationFn: async (payload: FlowerRecommendationRequest): Promise<FlowerRecommendationResponse> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/recommend/flower`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        });

        return response.data;
      } catch (error) {
        if (shouldFallbackToDemoMode(error)) {
          return buildDemoRecommendation();
        }

        throw error;
      }
    },
  });
};
