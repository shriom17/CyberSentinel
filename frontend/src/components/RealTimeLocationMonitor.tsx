import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  Button,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Badge
} from '@mui/material';
import {
  LocationOn,
  Warning,
  Security,
  Speed,
  MyLocation,
  Refresh,
  Timeline,
  Map,
  Notifications,
  GpsFixed,
  GpsNotFixed,
  Phone,
  Email
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationData {
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  device_id: string;
  app_source: string;
  session_id: string;
  transaction_id?: string;
}

interface LocationAlert {
  alert_id: string;
  type: string;
  risk_level: string;
  message: string;
  location: { lat: number; lng: number };
  user_id: string;
  timestamp: string;
  status: string;
  response_time: string;
}

interface GeofenceData {
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  risk_level: string;
  alert_threshold: number;
  current_incidents: number;
  status: string;
}

interface HotspotData {
  location: { latitude: number; longitude: number };
  bank: string;
  recent_incidents: number;
  adjusted_risk_score: number;
  alert_level: string;
  current_time_factor: number;
}

const RealTimeLocationMonitor: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [locationAlerts, setLocationAlerts] = useState<LocationAlert[]>([]);
  const [geofences, setGeofences] = useState<GeofenceData[]>([]);
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<LocationAlert | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [trackingStats, setTrackingStats] = useState({
    active_users: 0,
    total_locations_tracked: 0,
    active_geofences: 0,
    hotspots_monitored: 0
  });

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          if (isTracking) {
            trackLocation(position);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  }, [isTracking]);

  // Start/stop location tracking
  const toggleLocationTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      getCurrentLocation();
      // Start periodic location updates
      const interval = setInterval(() => {
        getCurrentLocation();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  };

  // Send location data to backend
  const trackLocation = async (position: GeolocationPosition) => {
    try {
      const locationData: LocationData = {
        user_id: 'demo_user_001', // In real app, get from auth context
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: position.coords.accuracy,
        device_id: 'device_001',
        app_source: 'web_dashboard',
        session_id: 'session_' + Date.now()
      };

      const response = await fetch('/api/location/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });

      const result = await response.json();
      
      if (result.success && result.data.real_time_alerts?.length > 0) {
        // Add new alerts
        setLocationAlerts(prev => [...result.data.real_time_alerts, ...prev]);
      }

    } catch (error) {
      console.error('Location tracking error:', error);
    }
  };

  // Load live alerts
  const loadLiveAlerts = async () => {
    try {
      const response = await fetch('/api/location/live-alerts?limit=20');
      const result = await response.json();
      
      if (result.success) {
        setLocationAlerts(result.data.alerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  // Load geofences
  const loadGeofences = async () => {
    try {
      const response = await fetch('/api/location/geofences');
      const result = await response.json();
      
      if (result.success) {
        setGeofences(result.data.geofences);
      }
    } catch (error) {
      console.error('Failed to load geofences:', error);
    }
  };

  // Load hotspots
  const loadHotspots = async () => {
    try {
      const response = await fetch('/api/location/hotspots');
      const result = await response.json();
      
      if (result.success) {
        setHotspots(result.data.hotspots);
      }
    } catch (error) {
      console.error('Failed to load hotspots:', error);
    }
  };

  // Load streaming status
  const loadStreamingStatus = async () => {
    try {
      const response = await fetch('/api/location/stream-status');
      const result = await response.json();
      
      if (result.success) {
        setTrackingStats(result.data.statistics);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  // Handle alert click
  const handleAlertClick = (alert: LocationAlert) => {
    setSelectedAlert(alert);
    setAlertDialogOpen(true);
  };

  // Send alert notification
  const sendAlertNotification = async (alertItem: LocationAlert) => {
    try {
      // Send alert to backend SMS/Email service
      const response = await fetch('/api/alerts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert_id: alertItem.alert_id,
          alert_type: alertItem.type,
          severity: alertItem.risk_level,
          title: `${alertItem.type.replace('_', ' ')} Alert`,
          message: alertItem.message,
          location: {
            latitude: alertItem.location.lat,
            longitude: alertItem.location.lng,
            address: `${alertItem.location.lat}, ${alertItem.location.lng}`
          },
          user_id: alertItem.user_id,
          incident_type: 'real_time_location'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        window.alert(`✅ Alert sent successfully!\n📱 SMS: ${result.notifications_sent.sms} recipients\n📧 Email: ${result.notifications_sent.email} recipients`);
      } else {
        window.alert('❌ Failed to send alert: ' + result.message);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      window.alert('❌ Error sending alert notification');
    }
  };

  // Get risk level color
  const getRiskLevelColor = (riskLevel: string) => {
    const colors = {
      critical: '#d32f2f',
      high: '#ff9800',
      medium: '#fbc02d',
      low: '#388e3c'
    };
    return colors[riskLevel as keyof typeof colors] || '#666';
  };

  // Get risk level icon
  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Warning sx={{ color: '#d32f2f' }} />;
      case 'high':
        return <Security sx={{ color: '#ff9800' }} />;
      case 'medium':
        return <Speed sx={{ color: '#fbc02d' }} />;
      default:
        return <LocationOn sx={{ color: '#388e3c' }} />;
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadLiveAlerts();
    loadGeofences();
    loadHotspots();
    loadStreamingStatus();

    // Set up periodic refresh
    const interval = setInterval(() => {
      loadLiveAlerts();
      loadStreamingStatus();
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Set up geolocation watching
  useEffect(() => {
    if (isTracking && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation(position);
          trackLocation(position);
        },
        (error) => console.error('Geolocation watch error:', error),
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isTracking]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🌍 Real-Time Location Monitoring
      </Typography>

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GpsFixed sx={{ mr: 1, color: isTracking ? '#4caf50' : '#f44336' }} />
                <Typography variant="h6">Location Tracking</Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isTracking}
                    onChange={toggleLocationTracking}
                    color="primary"
                  />
                }
                label={isTracking ? 'Active' : 'Inactive'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Security sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6">Active Users</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {trackingStats.active_users}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ mr: 1, color: '#d32f2f' }} />
                <Typography variant="h6">Live Alerts</Typography>
              </Box>
              <Typography variant="h4" color="error">
                {locationAlerts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ mr: 1, color: '#2196f3' }} />
                <Typography variant="h6">Locations Tracked</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {trackingStats.total_locations_tracked}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Location */}
      {currentLocation && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📍 Your Current Location
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography>
                  <strong>Latitude:</strong> {currentLocation.coords.latitude.toFixed(6)}
                </Typography>
                <Typography>
                  <strong>Longitude:</strong> {currentLocation.coords.longitude.toFixed(6)}
                </Typography>
                <Typography>
                  <strong>Accuracy:</strong> ±{currentLocation.coords.accuracy.toFixed(0)}m
                </Typography>
                <Typography>
                  <strong>Timestamp:</strong> {new Date(currentLocation.timestamp).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 200 }}>
                  <MapContainer
                    center={[currentLocation.coords.latitude, currentLocation.coords.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={[currentLocation.coords.latitude, currentLocation.coords.longitude]}>
                      <Popup>Your Current Location</Popup>
                    </Marker>
                  </MapContainer>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Live Alerts */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">🚨 Real-Time Location Alerts</Typography>
            <Button
              startIcon={<Refresh />}
              onClick={loadLiveAlerts}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
          </Box>

          {locationAlerts.length === 0 ? (
            <Alert severity="info">No active location alerts</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locationAlerts.slice(0, 10).map((alert) => (
                    <TableRow
                      key={alert.alert_id}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <TableCell>
                        <Chip
                          icon={getRiskLevelIcon(alert.risk_level)}
                          label={alert.risk_level.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: getRiskLevelColor(alert.risk_level),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>{alert.type.replace('_', ' ')}</TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        {alert.message.length > 50 
                          ? `${alert.message.substring(0, 50)}...` 
                          : alert.message}
                      </TableCell>
                      <TableCell>{alert.user_id}</TableCell>
                      <TableCell>{alert.response_time}</TableCell>
                      <TableCell>
                        <Tooltip title="Send Alert">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendAlertNotification(alert);
                            }}
                          >
                            <Notifications />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Geofences and Hotspots */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🛡️ Active Geofences
              </Typography>
              {geofences.map((geofence, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{geofence.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip
                      label={geofence.status.toUpperCase()}
                      size="small"
                      color={geofence.status === 'active' ? 'error' : 'default'}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {geofence.current_incidents} incidents
                    </Typography>
                  </Box>
                  {index < geofences.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔥 Fraud Hotspots
              </Typography>
              {hotspots.map((hotspot, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{hotspot.bank} ATM</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip
                      label={hotspot.alert_level.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: getRiskLevelColor(hotspot.alert_level),
                        color: 'white'
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Risk Score: {hotspot.adjusted_risk_score}
                    </Typography>
                  </Box>
                  {index < hotspots.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert Detail Dialog */}
      <Dialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🚨 Alert Details
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Alert Information</Typography>
                  <Typography><strong>Alert ID:</strong> {selectedAlert.alert_id}</Typography>
                  <Typography><strong>Type:</strong> {selectedAlert.type.replace('_', ' ')}</Typography>
                  <Typography><strong>Risk Level:</strong> 
                    <Chip
                      label={selectedAlert.risk_level.toUpperCase()}
                      size="small"
                      sx={{
                        ml: 1,
                        backgroundColor: getRiskLevelColor(selectedAlert.risk_level),
                        color: 'white'
                      }}
                    />
                  </Typography>
                  <Typography><strong>User ID:</strong> {selectedAlert.user_id}</Typography>
                  <Typography><strong>Status:</strong> {selectedAlert.status}</Typography>
                  <Typography><strong>Time:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Location</Typography>
                  <Typography><strong>Latitude:</strong> {selectedAlert.location.lat}</Typography>
                  <Typography><strong>Longitude:</strong> {selectedAlert.location.lng}</Typography>
                  <Box sx={{ height: 200, mt: 2 }}>
                    <MapContainer
                      center={[selectedAlert.location.lat, selectedAlert.location.lng]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                      />
                      <Marker position={[selectedAlert.location.lat, selectedAlert.location.lng]}>
                        <Popup>{selectedAlert.message}</Popup>
                      </Marker>
                    </MapContainer>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography>{selectedAlert.message}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Phone />}
            onClick={() => selectedAlert && sendAlertNotification(selectedAlert)}
          >
            Send Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Emergency */}
      <Fab
        color="error"
        aria-label="emergency"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => alert('Emergency alert sent to all units!')}
      >
        <Badge badgeContent={locationAlerts.filter(a => a.risk_level === 'critical').length} color="secondary">
          <Warning />
        </Badge>
      </Fab>
    </Box>
  );
};

export default RealTimeLocationMonitor;