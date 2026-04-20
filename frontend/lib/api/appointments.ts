import api from './client';
import {
  Appointment,
  AppointmentDetail,
  BookAppointmentData,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export interface AppointmentFilters {
  status?: string;
  time?: 'upcoming' | 'past';
  doctor?: number;
  hospital?: number;
  page?: number;
}

export interface MyAppointmentsResponse {
  upcoming: Appointment[];
  past: Appointment[];
  total_upcoming: number;
  total_past: number;
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  upcoming: number;
}

export const appointmentsApi = {
  // Get paginated appointments
  async getAppointments(filters?: AppointmentFilters): Promise<PaginatedResponse<Appointment>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/appointments/?${params.toString()}`);
    return response.data;
  },

  // Get appointment details
  async getAppointment(id: number): Promise<AppointmentDetail> {
    const response = await api.get(`/appointments/${id}/`);
    return response.data;
  },

  // Get current user's appointments
  async getMyAppointments(): Promise<ApiResponse<MyAppointmentsResponse>> {
    const response = await api.get('/appointments/my/');
    return response.data;
  },

  // Get appointment stats
  async getStats(): Promise<ApiResponse<AppointmentStats>> {
    const response = await api.get('/appointments/stats/');
    return response.data;
  },

  // Book new appointment
  async bookAppointment(data: BookAppointmentData): Promise<ApiResponse<AppointmentDetail>> {
    const response = await api.post('/appointments/', data);
    return response.data;
  },

  // Cancel appointment
  async cancelAppointment(id: number, reason?: string): Promise<ApiResponse<AppointmentDetail>> {
    const response = await api.post(`/appointments/${id}/cancel/`, { reason });
    return response.data;
  },

  // Update appointment status (doctor/admin)
  async updateStatus(id: number, status: string, notes?: string): Promise<ApiResponse<AppointmentDetail>> {
    const response = await api.post(`/appointments/${id}/update_status/`, { status, notes });
    return response.data;
  },
};
