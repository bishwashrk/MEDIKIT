import api from './client';
import {
  Hospital,
  HospitalDetail,
  Department,
  Disease,
  Specialization,
  ApiResponse,
  PaginatedResponse,
  DiseaseSearchResult,
  MapMarker,
  Doctor,
} from '@/types';

export interface HospitalFilters {
  search?: string;
  city?: string;
  is_emergency?: boolean;
  is_ambulance?: boolean;
  lat?: number;
  lng?: number;
  max_distance?: number;
  page?: number;
}

export const hospitalsApi = {
  // Get paginated hospital list
  async getHospitals(filters?: HospitalFilters): Promise<PaginatedResponse<Hospital>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/hospitals/?${params.toString()}`);
    return response.data;
  },

  // Get hospital details by slug
  async getHospital(slug: string, lat?: number, lng?: number): Promise<HospitalDetail> {
    const params = new URLSearchParams();
    if (lat) params.append('lat', String(lat));
    if (lng) params.append('lng', String(lng));
    
    const response = await api.get(`/hospitals/${slug}/?${params.toString()}`);
    return response.data;
  },

  // Alias for getHospital (for backward compatibility)
  async getHospitalBySlug(slug: string, lat?: number, lng?: number): Promise<HospitalDetail> {
    const params = new URLSearchParams();
    if (lat) params.append('lat', String(lat));
    if (lng) params.append('lng', String(lng));
    
    const response = await api.get(`/hospitals/${slug}/?${params.toString()}`);
    return response.data;
  },

  // Get map markers
  async getMapMarkers(): Promise<ApiResponse<MapMarker[]>> {
    const response = await api.get('/hospitals/map_markers/');
    return response.data;
  },

  // Search hospitals by disease
  async searchByDisease(disease: string, lat?: number, lng?: number): Promise<ApiResponse<DiseaseSearchResult>> {
    const params = new URLSearchParams({ disease });
    if (lat) params.append('lat', String(lat));
    if (lng) params.append('lng', String(lng));
    
    const response = await api.get(`/hospitals/search_by_disease/?${params.toString()}`);
    return response.data;
  },

  // Get nearby hospitals
  async getNearby(lat: number, lng: number, radius: number = 10): Promise<ApiResponse<{ hospitals: Hospital[]; count: number }>> {
    const response = await api.get(`/hospitals/nearby/?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data;
  },

  // Alias for getNearby (for backward compatibility)
  async getNearbyHospitals(params: { lat: number; lng: number; radius?: number }): Promise<ApiResponse<{ hospitals: Hospital[]; count: number }>> {
    const response = await api.get(`/hospitals/nearby/?lat=${params.lat}&lng=${params.lng}&radius=${params.radius || 10}`);
    return response.data;
  },

  // Get departments
  async getDepartments(hospitalId?: number): Promise<PaginatedResponse<Department>> {
    const params = hospitalId ? `?hospital_id=${hospitalId}` : '';
    const response = await api.get(`/hospitals/departments/${params}`);
    return response.data;
  },

  // Create department
  async createDepartment(data: Partial<Department>): Promise<Department> {
    const response = await api.post('/hospitals/departments/', data);
    return response.data;
  },

  // Update department
  async updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    const response = await api.patch(`/hospitals/departments/${id}/`, data);
    return response.data;
  },

  // Delete department
  async deleteDepartment(id: number): Promise<void> {
    await api.delete(`/hospitals/departments/${id}/`);
  },

  // Get specializations
  async getSpecializations(): Promise<PaginatedResponse<Specialization>> {
    const response = await api.get('/hospitals/specializations/');
    return response.data;
  },

  // Get diseases
  async getDiseases(filters?: { hospitalId?: number; departmentId?: number }): Promise<PaginatedResponse<Disease>> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospital_id', String(filters.hospitalId));
    if (filters?.departmentId) params.append('department_id', String(filters.departmentId));
    const query = params.toString();
    const response = await api.get(`/hospitals/diseases/${query ? `?${query}` : ''}`);
    return response.data;
  },

  // Create disease
  async createDisease(data: {
    name: string;
    description?: string;
    symptoms?: string[];
    department_ids: number[];
    specialization_ids?: number[];
    is_active?: boolean;
  }): Promise<Disease> {
    const response = await api.post('/hospitals/diseases/', data);
    return response.data;
  },

  // Update disease
  async updateDisease(id: number, data: {
    name?: string;
    description?: string;
    symptoms?: string[];
    department_ids?: number[];
    specialization_ids?: number[];
    is_active?: boolean;
  }): Promise<Disease> {
    const response = await api.patch(`/hospitals/diseases/${id}/`, data);
    return response.data;
  },

  // Delete disease
  async deleteDisease(id: number): Promise<void> {
    await api.delete(`/hospitals/diseases/${id}/`);
  },

  // Search diseases
  async searchDiseases(query: string): Promise<ApiResponse<Disease[]>> {
    const response = await api.get(`/hospitals/diseases/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
