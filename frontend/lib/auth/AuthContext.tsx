'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { User, LoginResponse, RegisterData } from '@/types';
import { authApi, getErrorMessage } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const accessToken = Cookies.get('access_token');
    
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      setUser(response.data);
    } catch (error) {
      // Token might be expired - try refresh
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const { access } = await authApi.refreshToken(refreshToken);
          Cookies.set('access_token', access, { expires: 1 });
          const response = await authApi.getMe();
          setUser(response.data);
        } catch (refreshError) {
          // Refresh also failed - clear everything
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const response: LoginResponse = await authApi.login(email, password);
    
    // Store tokens
    Cookies.set('access_token', response.access, { expires: 1 }); // 1 day
    Cookies.set('refresh_token', response.refresh, { expires: 7 }); // 7 days
    
    // Set user
    setUser(response.user);
    
    // Redirect based on role
    switch (response.user.role) {
      case 'super_admin':
        router.push('/super-admin');
        break;
      case 'hospital_admin':
        router.push('/hospital-admin');
        break;
      case 'doctor':
        router.push('/doctor/dashboard');
        break;
      case 'patient':
      default:
        router.push('/dashboard');
        break;
    }
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authApi.register(data);
    
    // Store tokens
    Cookies.set('access_token', response.data.tokens.access, { expires: 1 });
    Cookies.set('refresh_token', response.data.tokens.refresh, { expires: 7 });
    
    // Set user
    setUser(response.data.user);
    
    // Redirect based on role
    switch (response.data.user.role) {
      case 'super_admin':
        router.push('/super-admin');
        break;
      case 'hospital_admin':
        router.push('/hospital-admin');
        break;
      case 'doctor':
        router.push('/doctor/dashboard');
        break;
      case 'patient':
      default:
        router.push('/dashboard');
        break;
    }
  }, [router]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.push('/');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data);
    } catch (error) {
      // Silently fail
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
