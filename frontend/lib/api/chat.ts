import api from './client';
import { ApiResponse, ChatMessage, ChatThread } from '@/types';

export const chatApi = {
  async getThreads(): Promise<ApiResponse<ChatThread[]>> {
    const response = await api.get('/chat/threads/');
    return response.data;
  },

  async startThread(appointmentId: number): Promise<ApiResponse<ChatThread>> {
    const response = await api.post('/chat/threads/start/', {
      appointment_id: appointmentId,
    });
    return response.data;
  },

  async getMessages(threadId: number): Promise<ApiResponse<ChatMessage[]>> {
    const response = await api.get(`/chat/threads/${threadId}/messages/`);
    return response.data;
  },

  async sendMessage(threadId: number, content: string): Promise<ApiResponse<ChatMessage>> {
    const response = await api.post(`/chat/threads/${threadId}/messages/`, { content });
    return response.data;
  },

  async markThreadRead(threadId: number): Promise<ApiResponse<{ updated: number }>> {
    const response = await api.post(`/chat/threads/${threadId}/mark-read/`);
    return response.data;
  },
};
