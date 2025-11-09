// User types
export interface User {
  id: string;
  name: string;
  email: string;
  provider?: 'credentials' | 'google';
  apiKeys?: ApiKey[];
  evaluations?: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface ApiKey {
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string | null;
  isActive: boolean;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Visa types
export interface Country {
  code: string;
  name: string;
  flag: string;
  visaTypes: VisaType[];
}

export interface VisaType {
  code: string;
  name: string;
  description: string;
  minSalary?: number | null;
  currency?: string;
  processingTime: string;
  validityPeriod: string;
  requiredDocumentTypes?: string[];
  requiredDocuments?: RequiredDocument[];
}

export interface RequiredDocument {
  type: string;
  displayName: string;
  required: boolean;
  description: string;
}

export interface VisaConfigResponse {
  success: boolean;
  data: {
    countries: Country[];
    totalCountries: number;
    totalVisaTypes: number;
  };
}

export interface CountryVisaResponse {
  success: boolean;
  data: {
    country: Country;
  };
}

export interface VisaTypeDetailResponse {
  success: boolean;
  data: {
    country: {
      code: string;
      name: string;
      flag: string;
    };
    visaType: VisaType;
  };
}

// API error types
export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// Generate API Key types
export interface GenerateApiKeyRequest {
  name: string;
}

export interface GenerateApiKeyResponse {
  success: boolean;
  message: string;
  data: {
    apiKey: ApiKey;
  };
}

export interface ApiKeysResponse {
  success: boolean;
  data: {
    apiKeys: ApiKey[];
  };
}
