import api from './client';
import { ApiResponse } from '@/types';

export interface EsewaInitiateResponse {
  payment_id: number;
  transaction_id: string;
  payment_url: string;
  form_fields: Record<string, string>;
}

export interface EsewaVerifyResponse {
  payment_status: string;
  appointment_status?: string;
  reference_number?: string;
  gateway_status?: string;
}

export interface PaymentHistoryItem {
  id: number;
  transaction_id: string;
  gateway: string;
  status: string;
  amount: string;
  created_at: string;
  completed_at?: string | null;
  invoice_number: string;
  appointment_reference: string;
  hospital_name?: string;
  appointment_date: string;
  patient_name?: string;
  patient_email?: string;
}

export const paymentsApi = {
  async initiateEsewaPayment(appointmentId: number): Promise<ApiResponse<EsewaInitiateResponse>> {
    const response = await api.post('/payments/esewa/initiate/', {
      appointment_id: appointmentId,
    });
    return response.data;
  },

  async verifyEsewaPayment(payload: {
    data?: string;
    transaction_uuid?: string;
    total_amount?: string;
    product_code?: string;
  }): Promise<ApiResponse<EsewaVerifyResponse>> {
    const response = await api.post('/payments/esewa/verify/', payload);
    return response.data;
  },

  async getMyPayments(): Promise<ApiResponse<PaymentHistoryItem[]> & { count: number }> {
    const response = await api.get('/payments/my/');
    return response.data;
  },

  async getHospitalPayments(): Promise<ApiResponse<PaymentHistoryItem[]> & { count: number }> {
    const response = await api.get('/payments/hospital/');
    return response.data;
  },
};
