import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Paper
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Warning,
  TrendingUp,
  LocationOn,
  Security,
  Assessment,
  NotificationImportant,
  Timeline,
  DataUsage
} from '@mui/icons-material';

interface RealTimePrediction {
  predictions: {
    hotspots: Array<{
      city: string;
      predicted_incidents: number;
      confidence: number;
      risk_level: string;
      coordinates?: { lat: number; lng: number };
      severity?: string;
      eta_minutes?: number;
      recommended_units?: number;
    }>;
    trends: Record<string, {
      percentage: number;
      growth_rate: number;
      status: string;
    }>;
    risk_areas: Array<{
      area: string;
      risk_score: number;
      incidents: number;
      total_amount: number;
      location: { city: string; area: string; latitude: number; longitude: number };
    }>;
  };
  last_update: string;
  status: string;
}

interface MonitoringStatus {
  is_running: boolean;
  last_update: string;
  queue_size: number;
  subscribers: number;
  uptime: string;
}

interface LiveAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  timestamp: string;
  action_required: boolean;
  estimated_impact: number;
}

interface LiveStatistics {
  processing_status: string;
  incidents_in_queue: number;
  predicted_incidents_next_hour: number;
  active_hotspots: number;
  high_risk_areas: number;
  total_risk_amount: number;
  prediction_accuracy: number;
  model_confidence: number;
  trending_fraud_types: number;
  last_prediction_update: string;
  system_uptime: string;
}

const RealTimeDashboard: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [predictions, setPredictions] = useState<RealTimePrediction | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const API_BASE = 'http://127.0.0.1:5000/api/realtime';

  const fetchMonitoringStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/monitoring-status`);
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus(data.status);
        setIsMonitoring(data.status.is_running);
      }
    } catch (error) {
      console.error('Error fetching monitoring status:', error);
    }
  }, []);

  const fetchLivePredictions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/live-predictions`);
      const data = await response.json();
      if (data.success) {
        setPredictions(data);
      }
    } catch (error) {
      console.error('Error fetching live predictions:', error);
    }
  }, []);

  const fetchLiveAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/live-alerts`);
      const data = await response.json();
      if (data.success) {
        setLiveAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching live alerts:', error);
    }
  }, []);

  const fetchLiveStatistics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/live-statistics`);
      const data = await response.json();
      if (data.success) {
        setLiveStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching live statistics:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchMonitoringStatus(),
      fetchLivePredictions(),
      fetchLiveAlerts(),
      fetchLiveStatistics()
    ]);
  }, [fetchMonitoringStatus, fetchLivePredictions, fetchLiveAlerts, fetchLiveStatistics]);

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchAllData]);

  const toggleMonitoring = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = isMonitoring ? 'stop-monitoring' : 'start-monitoring';
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsMonitoring(!isMonitoring);
        await fetchMonitoringStatus();
      } else {
        setError(data.error || 'Failed to toggle monitoring');
      }
    } catch (error) {
      setError('Network error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatLastUpdate = (timestamp: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          🔴 CyberSentinel Live Monitor
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          
          <Button
            variant={isMonitoring ? "outlined" : "contained"}
            color={isMonitoring ? "error" : "primary"}
            startIcon={isMonitoring ? <Stop /> : <PlayArrow />}
            onClick={toggleMonitoring}
            disabled={loading}
          >
            {loading ? 'Processing...' : isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* System Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <DataUsage sx={{ mr: 1, verticalAlign: 'middle' }} />
            System Status
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Chip
                  label={isMonitoring ? 'ACTIVE' : 'INACTIVE'}
                  color={isMonitoring ? 'success' : 'error'}
                  variant="filled"
                />
                <Typography variant="caption" display="block">
                  Monitoring Status
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  {monitoringStatus?.queue_size || 0}
                </Typography>
                <Typography variant="caption">
                  Incidents in Queue
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  {formatLastUpdate(monitoringStatus?.last_update || '')}
                </Typography>
                <Typography variant="caption">
                  Last Update
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  {monitoringStatus?.uptime || '0:00:00'}
                </Typography>
                <Typography variant="caption">
                  System Uptime
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Live Statistics */}
      {liveStats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Live Statistics
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="h4">{liveStats.predicted_incidents_next_hour}</Typography>
                  <Typography variant="subtitle1">Predicted Incidents (Next Hour)</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                  <Typography variant="h4">{liveStats.active_hotspots}</Typography>
                  <Typography variant="subtitle1">Active Hotspots</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                  <Typography variant="h4">{liveStats.high_risk_areas}</Typography>
                  <Typography variant="subtitle1">High Risk Areas</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{formatCurrency(liveStats.total_risk_amount)}</Typography>
                  <Typography variant="caption">Total Risk Amount</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{(liveStats.prediction_accuracy * 100).toFixed(1)}%</Typography>
                  <Typography variant="caption">Prediction Accuracy</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{(liveStats.model_confidence * 100).toFixed(1)}%</Typography>
                  <Typography variant="caption">Model Confidence</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Live Hotspots */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Live Hotspot Predictions
              </Typography>
              
              {predictions?.predictions?.hotspots?.length ? (
                <List>
                  {predictions.predictions.hotspots.map((hotspot, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <Chip
                          label={hotspot.severity || hotspot.risk_level}
                          color={getSeverityColor(hotspot.severity || hotspot.risk_level) as any}
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={hotspot.city}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Predicted: {hotspot.predicted_incidents} incidents
                            </Typography>
                            <Typography variant="caption">
                              Confidence: {(hotspot.confidence * 100).toFixed(1)}%
                              {hotspot.eta_minutes && ` • ETA: ${hotspot.eta_minutes}min`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active hotspots predicted
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Live Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NotificationImportant sx={{ mr: 1, verticalAlign: 'middle' }} />
                Live Alerts
                <Badge badgeContent={liveAlerts.length} color="error" sx={{ ml: 1 }} />
              </Typography>
              
              {liveAlerts.length ? (
                <List>
                  {liveAlerts.slice(0, 5).map((alert) => (
                    <ListItem key={alert.id} divider>
                      <ListItemIcon>
                        <Chip
                          label={alert.severity.toUpperCase()}
                          color={getSeverityColor(alert.severity) as any}
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.title}
                        secondary={
                          <Box>
                            <Typography variant="body2">{alert.message}</Typography>
                            <Typography variant="caption">
                              {alert.location} • {formatLastUpdate(alert.timestamp)}
                              {alert.action_required && ' • ACTION REQUIRED'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active alerts
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Areas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                High Risk Areas
              </Typography>
              
              {predictions?.predictions?.risk_areas?.length ? (
                <List>
                  {predictions.predictions.risk_areas.slice(0, 5).map((area, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={area.area}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Risk Score: {(area.risk_score * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="caption">
                              {area.incidents} incidents • {formatCurrency(area.total_amount)}
                            </Typography>
                          </Box>
                        }
                      />
                      <LinearProgress
                        variant="determinate"
                        value={area.risk_score * 100}
                        color={area.risk_score > 0.7 ? 'error' : 'warning'}
                        sx={{ width: 60, ml: 2 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No high-risk areas identified
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Fraud Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Live Fraud Trends
              </Typography>
              
              {predictions?.predictions?.trends && Object.keys(predictions.predictions.trends).length ? (
                <List>
                  {Object.entries(predictions.predictions.trends).map(([type, data]) => (
                    <ListItem key={type} divider>
                      <ListItemText
                        primary={type}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Current: {data.percentage.toFixed(1)}%
                            </Typography>
                            <Typography variant="caption">
                              Growth Rate: {data.growth_rate.toFixed(1)}% • {data.status}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={data.status}
                        color={data.status === 'increasing' ? 'warning' : 'default'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No trending patterns detected
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Last Update Info */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Last Update: {predictions ? formatLastUpdate(predictions.last_update) : 'Never'} |
          Status: {predictions?.status || 'Unknown'} |
          Auto-refresh: {autoRefresh ? 'Enabled (5s)' : 'Disabled'}
        </Typography>
      </Box>
    </Box>
  );
};

export default RealTimeDashboard;