export interface User {
  id: number;
  username: string;
  role: 'admin' | 'investigator' | 'analyst';
  permissions: string[];
  department: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface HeatmapLocation {
  id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  predicted_incidents: number;
  last_updated: string;
  risk_level: 'high' | 'medium' | 'low';
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  location: string;
  predicted_risk: number;
  alert_type: string;
  message: string;
  status: 'active' | 'investigating' | 'resolved';
  assigned_officers: string[];
  actions_taken: ActionTaken[];
}

export interface ActionTaken {
  action: string;
  timestamp: string;
  officer: string;
}

export interface DashboardStats {
  total_complaints: number;
  today_complaints: number;
  active_alerts: number;
  high_risk_areas: number;
  amount_involved: {
    today: number;
    this_week: number;
    this_month: number;
  };
  recovery_rate: number;
  prediction_accuracy: number;
}

export interface PredictionData {
  location: string;
  risk_score: number;
  predicted_withdrawals: number;
  confidence: number;
  factors: string[];
}

export interface LiveFeedItem {
  id: string;
  timestamp: string;
  location: string;
  category: string;
  amount: number;
  status: string;
  risk_score: number;
}