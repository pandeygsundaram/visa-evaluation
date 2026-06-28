import apiClient from './client';
import type {
  VisaConfigResponse,
  CountryVisaResponse,
  VisaTypeDetailResponse,
  GenerateApiKeyRequest,
  GenerateApiKeyResponse,
  ApiKeysResponse,
  User,
} from '@/types';

// Auth endpoints
export const authApi = {
  getProfile: async () => {
    const response = await apiClient.get<{ success: boolean; data: { user: User } }>('/api/auth/me');
    return response.data;
  },

  generateApiKey: async (data: GenerateApiKeyRequest) => {
    const response = await apiClient.post<GenerateApiKeyResponse>('/api/auth/generate-api-key', data);
    return response.data;
  },

  getApiKeys: async () => {
    const response = await apiClient.get<ApiKeysResponse>('/api/auth/api-keys');
    return response.data;
  },

  deactivateApiKey: async (key: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/auth/api-keys/${key}`);
    return response.data;
  },
};

// Visa configuration endpoints
export const visaApi = {
  getAllCountries: async () => {
    const response = await apiClient.get<VisaConfigResponse>('/api/visa-config');
    return response.data;
  },

  getCountryVisas: async (countryCode: string) => {
    const response = await apiClient.get<CountryVisaResponse>(`/api/visa-config/${countryCode}`);
    return response.data;
  },

  getVisaTypeDetails: async (countryCode: string, visaCode: string) => {
    const response = await apiClient.get<VisaTypeDetailResponse>(`/api/visa-config/${countryCode}/${visaCode}`);
    return response.data;
  },
};

// Evaluation endpoints
export const evaluationApi = {
  getEvaluations: async (params?: { status?: string; country?: string; visaType?: string; limit?: number; skip?: number }) => {
    const response = await apiClient.get('/api/evaluations', { params });
    return response.data;
  },

  getEvaluationById: async (id: string) => {
    const response = await apiClient.get(`/api/evaluations/${id}`);
    return response.data;
  },

  createEvaluation: async (formData: FormData) => {
    const response = await apiClient.post('/api/evaluations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteEvaluation: async (id: string) => {
    const response = await apiClient.delete(`/api/evaluations/${id}`);
    return response.data;
  },
};

// Subscription endpoints
export const subscriptionApi = {
  getPlans: async () => {
    const response = await apiClient.get('/api/subscription/plans');
    return response.data;
  },

  createCheckoutSession: async (data: { planId: string; successUrl?: string; cancelUrl?: string }) => {
    const response = await apiClient.post('/api/subscription/checkout', data);
    return response.data;
  },

  getStatus: async () => {
    const response = await apiClient.get('/api/subscription/status');
    return response.data;
  },

  getUsage: async () => {
    const response = await apiClient.get('/api/subscription/usage');
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await apiClient.post('/api/subscription/cancel', {});
    return response.data;
  },

  createBillingPortal: async (returnUrl?: string) => {
    const response = await apiClient.post('/api/subscription/portal', { returnUrl });
    return response.data;
  },
};

// Analytics endpoints
export const analyticsApi = {
  getUsage: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/api/analytics/usage', { params });
    return response.data;
  },

  getSummary: async () => {
    const response = await apiClient.get('/api/analytics/summary');
    return response.data;
  },

  getApiKeyUsage: async (apiKey: string) => {
    const response = await apiClient.get(`/api/analytics/api-keys/${apiKey}`);
    return response.data;
  },
};
