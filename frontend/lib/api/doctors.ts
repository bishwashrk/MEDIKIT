import api from './client';
import { Doctor, DoctorDetail, ApiResponse, PaginatedResponse } from '@/types';

export interface DoctorFilters {
  hospital?: number;
  department?: number;
  specialization?: number;
  is_accepting_appointments?: boolean;
  search?: string;
  page?: number;
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  max_appointments: number;
}

export interface AvailableSlotsResponse {
  date: string;
  is_available: boolean;
  slot_duration_minutes: number;
  slots: AvailableSlot[];
  message?: string;
}

export interface DoctorsByDiseaseResponse {
  disease: string;
  matched_diseases?: { id: number; name: string }[];
  doctors: Doctor[];
}

export const doctorsApi = {
  // Get paginated doctor list
  async getDoctors(filters?: DoctorFilters): Promise<PaginatedResponse<Doctor>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/doctors/?${params.toString()}`);
    return response.data;
  },

  // Get doctor details
  async getDoctor(id: number): Promise<DoctorDetail> {
    const response = await api.get(`/doctors/${id}/`);
    return response.data;
  },

  // Get doctors by hospital
  async getDoctorsByHospital(hospitalId: number): Promise<ApiResponse<Doctor[]>> {
    const response = await api.get(`/doctors/by_hospital/?hospital_id=${hospitalId}`);
    return response.data;
  },

  // Get doctors by specialization
  async getDoctorsBySpecialization(specializationId: number): Promise<ApiResponse<Doctor[]>> {
    const response = await api.get(`/doctors/by_specialization/?specialization_id=${specializationId}`);
    return response.data;
  },

  // Get doctors by disease (optionally filtered by hospital)
  async getDoctorsByDisease(disease: string, hospitalId?: number): Promise<ApiResponse<DoctorsByDiseaseResponse>> {
    const params = new URLSearchParams({ disease });
    if (hospitalId) params.append('hospital_id', String(hospitalId));
    const response = await api.get(`/doctors/by_disease/?${params.toString()}`);
    return response.data;
  },

  // Get available slots for a doctor on a date
  async getAvailableSlots(doctorId: number, date: string): Promise<ApiResponse<AvailableSlotsResponse>> {
    const response = await api.get(`/doctors/${doctorId}/available_slots/?date=${date}`);
    return response.data;
  },
};
