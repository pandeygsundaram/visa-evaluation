import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, SignupData } from '@/types';
import { authApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('auth_token', token);
          // Also set cookie for middleware
          document.cookie = `auth_token=${token}; path=/; max-age=604800`; // 7 days
        } else {
          localStorage.removeItem('auth_token');
          // Remove cookie
          document.cookie = 'auth_token=; path=/; max-age=0';
        }
        set({ token });
      },

      setLoading: (isLoading) => set({ isLoading }),

      login: async (credentials) => {
        try {
          set({ isLoading: true });
          const response = await authApi.login(credentials);

          if (response.success) {
            const { user, token } = response.data;
            get().setToken(token);
            set({ user, isAuthenticated: true });
            toast.success('Login successful!');
          }
        } catch (error: any) {
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (data) => {
        try {
          set({ isLoading: true });
          const response = await authApi.signup(data);

          if (response.success) {
            const { user, token } = response.data;
            get().setToken(token);
            set({ user, isAuthenticated: true });
            toast.success('Account created successfully!');
          }
        } catch (error: any) {
          const message = error.response?.data?.message || 'Signup failed';
          toast.error(message);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        get().setToken(null);
        set({ user: null, isAuthenticated: false });
        toast.success('Logged out successfully');
      },

      refreshProfile: async () => {
        try {
          const response = await authApi.getProfile();
          if (response.success) {
            set({ user: response.data.user });
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      },

      initialize: () => {
        // On app initialization, sync token from localStorage to cookie
        const state = get();
        if (state.token && typeof document !== 'undefined') {
          document.cookie = `auth_token=${state.token}; path=/; max-age=604800`;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
