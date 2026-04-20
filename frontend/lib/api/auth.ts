import api, { getErrorMessage } from './client';
import {
  LoginResponse,
  RegisterData,
  User,
  ApiResponse,
} from '@/types';
import Cookies from 'js-cookie';

// Hospital Registration Request Data
export interface HospitalRegistrationRequestData {
  hospital_name: string;
  hospital_email: string;
  hospital_phone: string;
  address: string;
  city: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_phone: string;
  admin_password?: string;
}

export const authApi = {
  // Register new patient
  async register(data: RegisterData): Promise<ApiResponse<{ user: User; tokens: { access: string; refresh: string } }>> {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  // Register hospital request (public - creates pending hospital)
  async registerHospital(data: HospitalRegistrationRequestData): Promise<ApiResponse<{ hospital_name: string; admin_email: string; status: string }>> {
    const response = await api.post('/auth/register/hospital/', data);
    return response.data;
  },

  // Login
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    const refreshToken = Cookies.get('refresh_token');
    if (refreshToken) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        // Ignore logout errors
      }
    }
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  },

  // Get current user
  async getMe(): Promise<ApiResponse<User>> {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  // Update profile
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.patch('/auth/profile/', data);
    return response.data;
  },

  // Change password
  async changePassword(oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
    await api.post('/auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

export { getErrorMessage };
