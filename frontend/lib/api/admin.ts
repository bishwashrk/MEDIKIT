import api from './client';
import {
  ApiResponse,
  Hospital,
  HospitalDetail,
  HospitalRegistrationData,
  HospitalRegistrationResponse,
  HospitalAdmin,
  DoctorRegistrationData,
  Doctor,
  SuperAdminStats,
  HospitalAdminStats,
  Department,
  Specialization,
  User,
} from '@/types';

// ============= SUPER ADMIN API =============

export const superAdminApi = {
  // Get platform-wide stats
  async getStats(): Promise<ApiResponse<SuperAdminStats>> {
    const response = await api.get('/auth/admin/stats/');
    return response.data;
  },

  // Register new hospital with admin
  async registerHospital(data: HospitalRegistrationData): Promise<ApiResponse<HospitalRegistrationResponse>> {
    const response = await api.post('/auth/admin/register-hospital/', data);
    return response.data;
  },

  // List all hospital admins
  async getHospitalAdmins(): Promise<ApiResponse<HospitalAdmin[]> & { count: number }> {
    const response = await api.get('/auth/admin/hospital-admins/');
    return response.data;
  },

  // Get all hospitals (Super Admin endpoint - includes pending, suspended, etc.)
  async getHospitals(status?: string): Promise<ApiResponse<Hospital[]> & { count: number }> {
    const params = status && status !== 'all' ? `?status=${status}` : '';
    const response = await api.get(`/auth/admin/hospitals/${params}`);
    return response.data;
  },

  // Get pending hospitals
  async getPendingHospitals(): Promise<ApiResponse<Hospital[]> & { count: number }> {
    const response = await api.get('/auth/admin/hospitals/pending/');
    return response.data;
  },

  // List patients (newest first)
  async getPatients(params?: { search?: string; limit?: number }): Promise<ApiResponse<User[]> & { count: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));

    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get(`/auth/admin/patients/${suffix}`);
    return response.data;
  },

  // Approve hospital
  async approveHospital(hospitalId: number): Promise<ApiResponse<void>> {
    const response = await api.post(`/auth/admin/hospitals/${hospitalId}/approve/`);
    return response.data;
  },

  // Reject hospital
  async rejectHospital(hospitalId: number): Promise<ApiResponse<void>> {
    const response = await api.post(`/auth/admin/hospitals/${hospitalId}/reject/`);
    return response.data;
  },

  // Suspend hospital
  async suspendHospital(hospitalId: number): Promise<ApiResponse<void>> {
    const response = await api.post(`/auth/admin/hospitals/${hospitalId}/suspend/`);
    return response.data;
  },

  // Get hospital detail
  async getHospital(slug: string): Promise<HospitalDetail> {
    const response = await api.get(`/hospitals/${slug}/`);
    return response.data;
  },

  // Update hospital
  async updateHospital(slug: string, data: Partial<Hospital>): Promise<ApiResponse<Hospital>> {
    const response = await api.patch(`/hospitals/${slug}/`, data);
    return response.data;
  },
};

// ============= HOSPITAL ADMIN API =============

export const hospitalAdminApi = {
  // Get hospital-specific stats
  async getStats(): Promise<ApiResponse<HospitalAdminStats>> {
    const response = await api.get('/auth/hospital-admin/stats/');
    return response.data;
  },

  // Get own hospital profile
  async getHospital(): Promise<ApiResponse<HospitalDetail>> {
    const response = await api.get('/auth/hospital-admin/hospital/');
    return response.data;
  },

  // Update own hospital profile
  async updateHospital(data: Partial<Hospital>): Promise<ApiResponse<Hospital>> {
    const response = await api.put('/auth/hospital-admin/hospital/', data);
    return response.data;
  },

  // Register a new doctor
  async registerDoctor(data: DoctorRegistrationData): Promise<ApiResponse<{ user: any; doctor_profile: Doctor }>> {
    const response = await api.post('/auth/hospital-admin/register-doctor/', data);
    return response.data;
  },

  // Get doctors in my hospital
  async getDoctors(): Promise<ApiResponse<Doctor[]> & { count: number }> {
    const response = await api.get('/auth/hospital-admin/doctors/');
    return response.data;
  },

  // Get departments in my hospital
  async getDepartments(): Promise<{ results: Department[] }> {
    const response = await api.get('/hospitals/departments/');
    return response.data;
  },

  // Create department in my hospital
  async createDepartment(data: Partial<Department>): Promise<Department> {
    const response = await api.post('/hospitals/departments/', data);
    return response.data;
  },

  // Update department in my hospital
  async updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    const response = await api.patch(`/hospitals/departments/${id}/`, data);
    return response.data;
  },

  // Delete department in my hospital
  async deleteDepartment(id: number): Promise<void> {
    await api.delete(`/hospitals/departments/${id}/`);
  },

  // Get all specializations
  async getSpecializations(): Promise<{ results: Specialization[] }> {
    const response = await api.get('/hospitals/specializations/');
    return response.data;
  },

  // Get appointments for my hospital (if endpoint exists)
  async getAppointments(): Promise<ApiResponse<any[]>> {
    const response = await api.get('/appointments/');
    return {
      success: true,
      data: response.data?.results || [],
    };
  },

  // Update doctor profile in current hospital
  async updateDoctor(doctorId: number, data: Partial<Doctor>): Promise<ApiResponse<Doctor>> {
    const response = await api.patch(`/doctors/${doctorId}/`, data);
    return {
      success: true,
      data: response.data,
    };
  },
};
