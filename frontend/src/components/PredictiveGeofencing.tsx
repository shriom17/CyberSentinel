import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  LinearProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Add,
  Shield,
  Timeline,
  LocationOn,
  Warning,
  AutoFixHigh,
  Visibility,
  Settings,
  TrendingUp,
  Psychology
} from '@mui/icons-material';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface PredictiveGeofence {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  predictionType: 'risk_hotspot' | 'crowd_density' | 'crime_pattern' | 'fraud_zone';
  aiConfidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  autoAdjust: boolean;
  triggers: string[];
  createdBy: 'ai' | 'manual';
  isActive: boolean;
  alerts: number;
  lastPrediction: string;
  futureRisk: {
    next1hour: number;
    next6hour: number;
    next24hour: number;
  };
}

interface GeofenceEvent {
  id: string;
  geofenceId: string;
  eventType: 'entry' | 'exit' | 'risk_spike' | 'prediction_update';
  userId: string;
  timestamp: string;
  riskScore: number;
  details: string;
}

const PredictiveGeofencing: React.FC = () => {
  const [geofences, setGeofences] = useState<PredictiveGeofence[]>([]);
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [aiPredictionActive, setAiPredictionActive] = useState(true);
  const [autoGeofencing, setAutoGeofencing] = useState(true);
  const [sensitivityLevel, setSensitivityLevel] = useState(75);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGeofence, setNewGeofence] = useState({ name: '', lat: 28.6139, lng: 77.2090, radius: 500 });
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);

  // Generate AI-powered geofences
  const generateAIPredictiveGeofences = async () => {
    setIsGeneratingPredictions(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const aiGeofences: PredictiveGeofence[] = [
        {
          id: `ai_geo_${Date.now()}`,
          name: 'Connaught Place High-Risk Zone',
          center: { lat: 28.6315, lng: 77.2167 },
          radius: 800,
          predictionType: 'fraud_zone',
          aiConfidence: 0.94,
          riskLevel: 'high',
          autoAdjust: true,
          triggers: ['ATM skimming patterns', 'Social engineering hotspot', 'Tourist targeting zone'],
          createdBy: 'ai',
          isActive: true,
          alerts: 0,
          lastPrediction: new Date().toISOString(),
          futureRisk: { next1hour: 0.82, next6hour: 0.91, next24hour: 0.76 }
        },
        {
          id: `ai_geo_${Date.now() + 1}`,
          name: 'Cyber City Dynamic Risk Perimeter',
          center: { lat: 28.4595, lng: 77.0266 },
          radius: 1200,
          predictionType: 'crime_pattern',
          aiConfidence: 0.87,
          riskLevel: 'medium',
          autoAdjust: true,
          triggers: ['Office hour correlations', 'Digital payment surge', 'Workspace fraud patterns'],
          createdBy: 'ai',
          isActive: true,
          alerts: 0,
          lastPrediction: new Date().toISOString(),
          futureRisk: { next1hour: 0.45, next6hour: 0.68, next24hour: 0.89 }
        },
        {
          id: `ai_geo_${Date.now() + 2}`,
          name: 'Festival Crowd Risk Zone',
          center: { lat: 28.6562, lng: 77.2410 },
          radius: 600,
          predictionType: 'crowd_density',
          aiConfidence: 0.91,
          riskLevel: 'critical',
          autoAdjust: true,
          triggers: ['Festival crowd patterns', 'Pickpocketing surge', 'Mobile theft hotspot'],
          createdBy: 'ai',
          isActive: true,
          alerts: 0,
          lastPrediction: new Date().toISOString(),
          futureRisk: { next1hour: 0.95, next6hour: 0.88, next24hour: 0.65 }
        }
      ];

      setGeofences(prev => [...aiGeofences, ...prev]);
      setIsGeneratingPredictions(false);

      // Generate sample events
      const sampleEvents: GeofenceEvent[] = aiGeofences.map((geo, idx) => ({
        id: `event_${Date.now() + idx}`,
        geofenceId: geo.id,
        eventType: 'prediction_update',
        userId: 'ai_system',
        timestamp: new Date().toISOString(),
        riskScore: geo.futureRisk.next1hour,
        details: `AI detected ${geo.predictionType.replace('_', ' ')} pattern with ${(geo.aiConfidence * 100).toFixed(0)}% confidence`
      }));

      setEvents(prev => [...sampleEvents, ...prev]);
    }, 2500);
  };

  const createManualGeofence = () => {
    const manualGeofence: PredictiveGeofence = {
      id: `manual_geo_${Date.now()}`,
      name: newGeofence.name || 'Custom Geofence',
      center: { lat: newGeofence.lat, lng: newGeofence.lng },
      radius: newGeofence.radius,
      predictionType: 'risk_hotspot',
      aiConfidence: 0.0,
      riskLevel: 'medium',
      autoAdjust: false,
      triggers: ['Manual creation'],
      createdBy: 'manual',
      isActive: true,
      alerts: 0,
      lastPrediction: new Date().toISOString(),
      futureRisk: { next1hour: 0.3, next6hour: 0.4, next24hour: 0.5 }
    };

    setGeofences(prev => [manualGeofence, ...prev]);
    setCreateDialogOpen(false);
    setNewGeofence({ name: '', lat: 28.6139, lng: 77.2090, radius: 500 });
  };

  const toggleGeofence = (id: string) => {
    setGeofences(prev =>
      prev.map(geo =>
        geo.id === id ? { ...geo, isActive: !geo.isActive } : geo
      )
    );
  };

  const getRiskColor = (level: string) => {
    const colors = {
      critical: '#d32f2f',
      high: '#ff9800',
      medium: '#fbc02d',
      low: '#388e3c'
    };
    return colors[level as keyof typeof colors] || '#666';
  };

  const getPredictionTypeIcon = (type: string) => {
    const icons = {
      fraud_zone: <Warning />,
      crime_pattern: <Timeline />,
      crowd_density: <Visibility />,
      risk_hotspot: <LocationOn />
    };
    return icons[type as keyof typeof icons] || <Shield />;
  };

  useEffect(() => {
    // Auto-generate initial predictions
    generateAIPredictiveGeofences();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Psychology sx={{ mr: 1, color: '#9c27b0' }} />
        🧠 Predictive Geofencing System
      </Typography>

      {/* Control Panel */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ color: 'white' }}>
                <Typography variant="h6">AI Prediction Engine</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={aiPredictionActive}
                        onChange={(e) => setAiPredictionActive(e.target.checked)}
                        sx={{ '& .MuiSwitch-thumb': { bgcolor: 'white' } }}
                      />
                    }
                    label="AI Predictions"
                    sx={{ color: 'white' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoGeofencing}
                        onChange={(e) => setAutoGeofencing(e.target.checked)}
                        sx={{ '& .MuiSwitch-thumb': { bgcolor: 'white' } }}
                      />
                    }
                    label="Auto Geofencing"
                    sx={{ color: 'white', ml: 2 }}
                  />
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ color: 'white' }}>
                <Typography variant="subtitle2">AI Sensitivity Level: {sensitivityLevel}%</Typography>
                <Slider
                  value={sensitivityLevel}
                  onChange={(_, value) => setSensitivityLevel(value as number)}
                  min={0}
                  max={100}
                  sx={{ color: 'white', mt: 1 }}
                />
                {isGeneratingPredictions && <LinearProgress sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AutoFixHigh />}
          onClick={generateAIPredictiveGeofences}
          disabled={isGeneratingPredictions}
          sx={{ background: 'linear-gradient(45deg, #9c27b0, #e91e63)' }}
        >
          {isGeneratingPredictions ? 'AI Analyzing...' : 'Generate AI Geofences'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Manual Geofence
        </Button>
      </Box>

      {/* Map and Geofences */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>🗺️ Predictive Geofence Map</Typography>
              <Box sx={{ height: 500 }}>
                <MapContainer
                  center={[28.6139, 77.2090]}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {geofences.filter(geo => geo.isActive).map((geofence) => (
                    <React.Fragment key={geofence.id}>
                      <Circle
                        center={[geofence.center.lat, geofence.center.lng]}
                        radius={geofence.radius}
                        color={getRiskColor(geofence.riskLevel)}
                        fillColor={getRiskColor(geofence.riskLevel)}
                        fillOpacity={0.3}
                      />
                      <Marker position={[geofence.center.lat, geofence.center.lng]}>
                        <Popup>
                          <Box>
                            <Typography variant="subtitle2">{geofence.name}</Typography>
                            <Typography variant="caption">
                              Risk Level: {geofence.riskLevel.toUpperCase()}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              AI Confidence: {(geofence.aiConfidence * 100).toFixed(0)}%
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              Type: {geofence.predictionType.replace('_', ' ')}
                            </Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  ))}
                </MapContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Active Geofences */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>🎯 Active Geofences</Typography>
              <List dense>
                {geofences.slice(0, 5).map((geofence) => (
                  <ListItem key={geofence.id}>
                    <ListItemIcon>
                      {getPredictionTypeIcon(geofence.predictionType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={geofence.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {geofence.predictionType.replace('_', ' ')} • {geofence.radius}m radius
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip
                              label={geofence.riskLevel.toUpperCase()}
                              size="small"
                              sx={{ bgcolor: getRiskColor(geofence.riskLevel), color: 'white' }}
                            />
                            {geofence.createdBy === 'ai' && (
                              <Chip
                                label="AI"
                                size="small"
                                sx={{ bgcolor: '#9c27b0', color: 'white' }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <Switch
                      checked={geofence.isActive}
                      onChange={() => toggleGeofence(geofence.id)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Future Risk Predictions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>🔮 Risk Predictions</Typography>
              {geofences.slice(0, 3).map((geofence) => (
                <Box key={geofence.id} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2">{geofence.name}</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption">Next Hour: {(geofence.futureRisk.next1hour * 100).toFixed(0)}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={geofence.futureRisk.next1hour * 100}
                      sx={{ mt: 0.5, mb: 0.5 }}
                    />
                    <Typography variant="caption">Next 6 Hours: {(geofence.futureRisk.next6hour * 100).toFixed(0)}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={geofence.futureRisk.next6hour * 100}
                      sx={{ mt: 0.5, mb: 0.5 }}
                    />
                    <Typography variant="caption">Next 24 Hours: {(geofence.futureRisk.next24hour * 100).toFixed(0)}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={geofence.futureRisk.next24hour * 100}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Events */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>📊 Recent Geofence Events</Typography>
          {events.length === 0 ? (
            <Alert severity="info">No recent geofence events</Alert>
          ) : (
            <List>
              {events.slice(0, 5).map((event) => {
                const geofence = geofences.find(g => g.id === event.geofenceId);
                return (
                  <ListItem key={event.id}>
                    <ListItemIcon>
                      <TrendingUp sx={{ color: getRiskColor(geofence?.riskLevel || 'medium') }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.details}
                      secondary={`${geofence?.name} • ${new Date(event.timestamp).toLocaleTimeString()} • Risk Score: ${(event.riskScore * 100).toFixed(0)}%`}
                    />
                    <Chip
                      label={event.eventType.replace('_', ' ').toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Create Geofence Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Manual Geofence</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Geofence Name"
            value={newGeofence.name}
            onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Latitude"
            type="number"
            value={newGeofence.lat}
            onChange={(e) => setNewGeofence(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Longitude"
            type="number"
            value={newGeofence.lng}
            onChange={(e) => setNewGeofence(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Radius (meters)"
            type="number"
            value={newGeofence.radius}
            onChange={(e) => setNewGeofence(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={createManualGeofence} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Settings Button */}
      <Fab
        color="primary"
        aria-label="settings"
        sx={{ position: 'fixed', bottom: 140, right: 16 }}
        onClick={() => alert('Geofencing settings opened!')}
      >
        <Settings />
      </Fab>
    </Box>
  );
};

export default PredictiveGeofencing;