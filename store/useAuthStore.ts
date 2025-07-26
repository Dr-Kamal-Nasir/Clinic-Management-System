// store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'universal-cookie';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'admin' | 'ceo' | 'laboratory' | 'pharmacy';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
}

const cookies = new Cookies();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      
      login: (user, accessToken, refreshToken) => {
        cookies.set('accessToken', accessToken, { 
          path: '/', 
          maxAge: 15 * 60,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        
        cookies.set('refreshToken', refreshToken, {
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        
        set({ 
          user, 
          accessToken, 
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      },
      
      logout: () => {
        cookies.remove('accessToken', { path: '/' });
        cookies.remove('refreshToken', { path: '/' });
        
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },
      
      initialize: async () => {
        const accessToken = cookies.get('accessToken');
        const refreshToken = cookies.get('refreshToken');
        
        if (accessToken) {
          try {
            const decoded = jwtDecode(accessToken) as { exp: number };
            if (decoded.exp * 1000 > Date.now()) {
              const response = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              
              if (response.ok) {
                const user = await response.json();
                set({ 
                  user,
                  accessToken,
                  refreshToken,
                  isAuthenticated: true,
                  isLoading: false
                });
                return;
              }
            }
          } catch (error) {
            console.error('Access token verification failed:', error);
          }
        }
        
        if (refreshToken) {
          try {
            await get().refreshAccessToken();
          } catch (error) {
            console.error('Token refresh failed during initialization:', error);
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },
      
      refreshAccessToken: async () => {
        const refreshToken = cookies.get('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshToken}`
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const { accessToken, user } = data;

            cookies.set('accessToken', accessToken, { 
              path: '/', 
              maxAge: 15 * 60,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });

            set({ 
              user,
              accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null 
            });
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to refresh token');
          }
        } catch (error: any) {
          get().logout();
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
