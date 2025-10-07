import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fab,
  Badge,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  Add,
  Refresh,
  ExpandMore,
  CheckCircle,
  Assignment,
  Notifications,
  Send,
  Person,
} from '@mui/icons-material';
import { alertsAPI } from '../services/api';
import { Alert, ActionTaken } from '../types';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [newAlert, setNewAlert] = useState({
    severity: 'medium',
    location: '',
    message: '',
    type: 'hotspot_prediction',
  });
  const [updateData, setUpdateData] = useState({
    action: '',
    officer: '',
    status: '',
  });

  useEffect(() => {
    fetchAlerts();
    fetchAlertStats();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await alertsAPI.getActiveAlerts();
      setAlerts(response.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertStats = async () => {
    try {
      const response = await alertsAPI.getAlertStatistics();
      setAlertStats(response.statistics);
    } catch (error) {
      console.error('Error fetching alert statistics:', error);
    }
  };

  const handleCreateAlert = async () => {
    try {
      await alertsAPI.createAlert({
        ...newAlert,
        risk_score: Math.random() * 0.4 + 0.6, // Random high risk score
      });
      setOpenCreateDialog(false);
      setNewAlert({
        severity: 'medium',
        location: '',
        message: '',
        type: 'hotspot_prediction',
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleUpdateAlert = async () => {
    if (!selectedAlert) return;
    
    try {
      await alertsAPI.updateAlert(selectedAlert.id, updateData);
      setOpenUpdateDialog(false);
      setUpdateData({ action: '', officer: '', status: '' });
      setSelectedAlert(null);
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'investigating': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const refreshData = () => {
    fetchAlerts();
    fetchAlertStats();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Alert Management
        </Typography>
        <Box>
          <IconButton onClick={refreshData} sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <Fab
            color="primary"
            aria-label="add"
            size="medium"
            onClick={() => setOpenCreateDialog(true)}
          >
            <Add />
          </Fab>
        </Box>
      </Box>

      {/* Alert Statistics */}
      {alertStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Warning color="error" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Alerts Today
                    </Typography>
                    <Typography variant="h5">
                      {alertStats.total_alerts_today}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Notifications color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Alerts
                    </Typography>
                    <Typography variant="h5">
                      {alertStats.active_alerts}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Resolved Today
                    </Typography>
                    <Typography variant="h5">
                      {alertStats.resolved_alerts}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assignment color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Avg Response Time
                    </Typography>
                    <Typography variant="h5">
                      {alertStats.response_time_avg.toFixed(1)}m
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Active Alerts */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Active Alerts
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Typography>

        {alerts.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
            No active alerts
          </Typography>
        ) : (
          alerts.map((alert) => (
            <Accordion key={alert.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <Badge
                        color={getSeverityColor(alert.severity) as any}
                        variant="dot"
                        sx={{ mr: 2 }}
                      >
                        <Warning />
                      </Badge>
                      <Box>
                        <Typography variant="subtitle1">
                          {alert.location}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {alert.alert_type}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid xs={12} sm={3}>
                    <Chip
                      label={alert.severity.toUpperCase()}
                      color={getSeverityColor(alert.severity) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid xs={12} sm={3}>
                    <Chip
                      label={alert.status.toUpperCase()}
                      color={getStatusColor(alert.status) as any}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid xs={12} sm={2}>
                    <Typography variant="body2" color="textSecondary">
                      {formatTimestamp(alert.timestamp)}
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid xs={12} md={8}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Message:</strong> {alert.message}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Risk Score:</strong> {(alert.predicted_risk * 100).toFixed(1)}%
                    </Typography>
                    
                    {alert.assigned_officers.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Assigned Officers:
                        </Typography>
                        {alert.assigned_officers.map((officer, index) => (
                          <Chip
                            key={index}
                            icon={<Person />}
                            label={officer}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}

                    {alert.actions_taken.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Actions Taken:
                        </Typography>
                        <List dense>
                          {alert.actions_taken.map((action: ActionTaken, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckCircle color="success" />
                              </ListItemIcon>
                              <ListItemText
                                primary={action.action}
                                secondary={`${action.officer} - ${formatTimestamp(action.timestamp)}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Grid>
                  <Grid xs={12} md={4}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        setSelectedAlert(alert);
                        setOpenUpdateDialog(true);
                      }}
                      sx={{ mb: 1 }}
                    >
                      Update Alert
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Send />}
                    >
                      Send Notification
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Paper>

      {/* Create Alert Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Alert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={newAlert.location}
                onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={newAlert.severity}
                  label="Severity"
                  onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newAlert.type}
                  label="Type"
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                >
                  <MenuItem value="hotspot_prediction">Hotspot Prediction</MenuItem>
                  <MenuItem value="pattern_anomaly">Pattern Anomaly</MenuItem>
                  <MenuItem value="high_risk_detection">High Risk Detection</MenuItem>
                  <MenuItem value="manual">Manual Alert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message"
                value={newAlert.message}
                onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAlert} variant="contained">
            Create Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Alert Dialog */}
      <Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Alert - {selectedAlert?.location}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateData.status}
                  label="Status"
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                >
                  <MenuItem value="">No Change</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="investigating">Investigating</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Action Taken"
                value={updateData.action}
                onChange={(e) => setUpdateData({ ...updateData, action: e.target.value })}
                placeholder="e.g., Patrol deployed, Banks notified"
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Officer Name"
                value={updateData.officer}
                onChange={(e) => setUpdateData({ ...updateData, officer: e.target.value })}
                placeholder="Enter officer name"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateAlert} variant="contained">
            Update Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;