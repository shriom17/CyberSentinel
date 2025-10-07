import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  Security,
  AttachMoney,
  LocationOn,
  Notifications,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI } from '../services/api';
import { HeatmapLocation, DashboardStats, LiveFeedItem } from '../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Dashboard: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapLocation[]>([]);
  const [statistics, setStatistics] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heatmapResponse, statsResponse, trendsResponse, feedResponse] = await Promise.all([
          dashboardAPI.getHeatmapData(),
          dashboardAPI.getStatistics(),
          dashboardAPI.getTrends(7),
          dashboardAPI.getLiveFeed(),
        ]);

        setHeatmapData(heatmapResponse.heatmap_data);
        setStatistics(statsResponse.statistics);
        setTrends(trendsResponse.trends);
        setLiveFeed(feedResponse.live_feed);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up auto-refresh for live data
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🛡️ CyberSentinel Command Center
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Complaints
                  </Typography>
                  <Typography variant="h5">
                    {statistics?.total_complaints.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{statistics?.today_complaints} today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Alerts
                  </Typography>
                  <Typography variant="h5">
                    {statistics?.active_alerts}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {statistics?.high_risk_areas} high risk
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Amount (Today)
                  </Typography>
                  <Typography variant="h5">
                    {statistics ? formatCurrency(statistics.amount_involved.today) : '₹0'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {statistics ? `${(statistics.recovery_rate * 100).toFixed(1)}% recovery` : '0%'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Security color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Prediction Accuracy
                  </Typography>
                  <Typography variant="h5">
                    {statistics ? `${(statistics.prediction_accuracy * 100).toFixed(1)}%` : '0%'}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    ML Model Performance
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Risk Heatmap and Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Risk Heatmap - Delhi NCR
            </Typography>
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={10}
              style={{ height: '350px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {heatmapData.map((location) => (
                <CircleMarker
                  key={location.id}
                  center={[location.latitude, location.longitude]}
                  radius={location.risk_score * 20}
                  fillColor={getRiskColor(location.risk_level)}
                  color={getRiskColor(location.risk_level)}
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.6}
                >
                  <Popup>
                    <div>
                      <strong>{location.location_name}</strong><br />
                      Risk Score: {(location.risk_score * 100).toFixed(1)}%<br />
                      Predicted Incidents: {location.predicted_incidents}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Crime Categories
            </Typography>
            {trends?.crime_categories && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trends.crime_categories.categories.map((category: string, index: number) => ({
                      name: category,
                      value: trends.crime_categories.percentages[index],
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {trends.crime_categories.categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Trends and Live Feed */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Complaint Trends
            </Typography>
            {trends?.daily_complaints && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends.daily_complaints.dates.map((date: string, index: number) => ({
                  date,
                  complaints: trends.daily_complaints.values[index],
                  predictions: trends.prediction_trends.values[index],
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="complaints"
                    stroke="#1976d2"
                    strokeWidth={2}
                    name="Actual Complaints"
                  />
                  <Line
                    type="monotone"
                    dataKey="predictions"
                    stroke="#dc004e"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Predictions"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
              Live Feed
            </Typography>
            <List dense>
              {liveFeed.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemIcon>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="body2">
                          {item.category} - {formatCurrency(item.amount)}
                        </Typography>
                        <Chip
                          size="small"
                          label={item.status}
                          color={item.status === 'new' ? 'error' : item.status === 'investigating' ? 'warning' : 'success'}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        {item.location} • {new Date(item.timestamp).toLocaleTimeString()}
                        <br />
                        Risk: {(item.risk_score * 100).toFixed(0)}%
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;