import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
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
          document.cookie = `auth_token=${token}; path=/; max-age=604800`;
        } else {
          document.cookie = 'auth_token=; path=/; max-age=0';
        }
        set({ token });
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

      initialize: async () => {
        const state = get();
        if (state.token && typeof document !== 'undefined') {
          document.cookie = `auth_token=${state.token}; path=/; max-age=604800`;
          try {
            await get().refreshProfile();
          } catch {
            get().logout();
          }
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
      onRehydrateStorage: () => (state) => {
        if (state?.token && state?.user) {
          state.isAuthenticated = true;
        }
      },
    }
  )
);
