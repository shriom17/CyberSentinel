import axios from 'axios';
import { LoginResponse, HeatmapLocation, Alert, DashboardStats, PredictionData, LiveFeedItem } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  verifyToken: async (token: string) => {
    const response = await api.post('/auth/verify-token', { token });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getHeatmapData: async (): Promise<{ heatmap_data: HeatmapLocation[] }> => {
    const response = await api.get('/dashboard/heatmap-data');
    return response.data;
  },
  
  getStatistics: async (): Promise<{ statistics: DashboardStats }> => {
    const response = await api.get('/dashboard/statistics');
    return response.data;
  },
  
  getTrends: async (days: number = 30) => {
    const response = await api.get(`/dashboard/trends?days=${days}`);
    return response.data;
  },
  
  getLiveFeed: async (): Promise<{ live_feed: LiveFeedItem[] }> => {
    const response = await api.get('/dashboard/live-feed');
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  predictHotspots: async (data: { locations: string[] }): Promise<{ predictions: PredictionData[] }> => {
    const response = await api.post('/analytics/predict', data);
    return response.data;
  },
  
  analyzePatterns: async () => {
    const response = await api.get('/analytics/patterns');
    return response.data;
  },
  
  assessRisk: async (location: string, timeRange: string = '24h') => {
    const response = await api.post('/analytics/risk-assessment', { location, time_range: timeRange });
    return response.data;
  },
};

// Alerts API
export const alertsAPI = {
  getActiveAlerts: async (): Promise<{ alerts: Alert[] }> => {
    const response = await api.get('/alerts/active');
    return response.data;
  },
  
  createAlert: async (alertData: any) => {
    const response = await api.post('/alerts/create', alertData);
    return response.data;
  },
  
  updateAlert: async (alertId: string, updateData: any) => {
    const response = await api.put(`/alerts/${alertId}/update`, updateData);
    return response.data;
  },
  
  getAlertStatistics: async () => {
    const response = await api.get('/alerts/statistics');
    return response.data;
  },
  
  sendNotification: async (notificationData: any) => {
    const response = await api.post('/alerts/send-notification', notificationData);
    return response.data;
  },
};

export default api;