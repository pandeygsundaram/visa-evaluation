import apiClient from './client';
import type {
  LoginCredentials,
  SignupData,
  AuthResponse,
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
  signup: async (data: SignupData) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get<{ success: boolean; data: { user: User } }>(
      '/api/auth/me'
    );
    return response.data;
  },

  generateApiKey: async (data: GenerateApiKeyRequest) => {
    const response = await apiClient.post<GenerateApiKeyResponse>(
      '/api/auth/generate-api-key',
      data
    );
    return response.data;
  },

  getApiKeys: async () => {
    const response = await apiClient.get<ApiKeysResponse>('/api/auth/api-keys');
    return response.data;
  },

  deactivateApiKey: async (key: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/auth/api-keys/${key}`
    );
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
    const response = await apiClient.get<CountryVisaResponse>(
      `/api/visa-config/${countryCode}`
    );
    return response.data;
  },

  getVisaTypeDetails: async (countryCode: string, visaCode: string) => {
    const response = await apiClient.get<VisaTypeDetailResponse>(
      `/api/visa-config/${countryCode}/${visaCode}`
    );
    return response.data;
  },
};
