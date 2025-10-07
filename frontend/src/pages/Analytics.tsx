import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  LocationOn,
  Assessment,
  Timeline,
} from '@mui/icons-material';
import { analyticsAPI } from '../services/api';
import { PredictionData } from '../types';

const Analytics: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [patterns, setPatterns] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      const response = await analyticsAPI.analyzePatterns();
      setPatterns(response.patterns);
    } catch (error) {
      console.error('Error fetching patterns:', error);
    }
  };

  const handlePredictHotspots = async () => {
    if (!locationInput.trim()) return;
    
    setLoading(true);
    try {
      const locations = locationInput.split(',').map(loc => loc.trim());
      const response = await analyticsAPI.predictHotspots({ locations });
      setPredictions(response.predictions);
    } catch (error) {
      console.error('Error predicting hotspots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRiskAssessment = async (location: string) => {
    setLoading(true);
    setSelectedLocation(location);
    try {
      const response = await analyticsAPI.assessRisk(location);
      setRiskAssessment(response.risk_assessment);
    } catch (error) {
      console.error('Error assessing risk:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 0.7) return 'error';
    if (score > 0.5) return 'warning';
    return 'success';
  };

  const getRiskLevel = (score: number) => {
    if (score > 0.7) return 'HIGH';
    if (score > 0.5) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🧠 CyberSentinel Intelligence
      </Typography>

      {/* Hotspot Prediction */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
              Cash Withdrawal Hotspot Prediction
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Enter locations (comma-separated)"
                placeholder="e.g. Connaught Place, Karol Bagh, Gurgaon"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handlePredictHotspots}
                disabled={loading || !locationInput.trim()}
              >
                {loading ? <CircularProgress size={24} /> : 'Predict Hotspots'}
              </Button>
            </Box>

            {predictions.length > 0 && (
              <Grid container spacing={2}>
                {predictions.map((prediction, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="h6">{prediction.location}</Typography>
                          <Chip
                            label={getRiskLevel(prediction.risk_score)}
                            color={getRiskColor(prediction.risk_score)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Risk Score: {(prediction.risk_score * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Predicted Withdrawals: {prediction.predicted_withdrawals}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Confidence: {(prediction.confidence * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Key Factors:
                        </Typography>
                        {prediction.factors?.map((factor, idx) => (
                          <Chip
                            key={idx}
                            label={factor}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )) || []}
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            onClick={() => handleRiskAssessment(prediction.location)}
                            disabled={loading}
                          >
                            Detailed Assessment
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Risk Assessment Results */}
      {riskAssessment && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Risk Assessment - {selectedLocation}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Overall Risk Score
                      </Typography>
                      <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h4" color={getRiskColor(riskAssessment.overall_risk).concat('.main')}>
                          {(riskAssessment.overall_risk * 100).toFixed(1)}%
                        </Typography>
                        <Chip
                          label={getRiskLevel(riskAssessment.overall_risk)}
                          color={getRiskColor(riskAssessment.overall_risk)}
                          sx={{ ml: 2 }}
                        />
                      </Box>
                      
                      <Typography variant="subtitle1" gutterBottom>
                        Risk Factors:
                      </Typography>
                      {riskAssessment?.risk_factors?.map((factor: any, index: number) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">{factor.factor}</Typography>
                            <Typography variant="body2">
                              {(factor.score * 100).toFixed(0)}% (Weight: {(factor.weight * 100).toFixed(0)}%)
                            </Typography>
                          </Box>
                          <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1, height: 4 }}>
                            <Box
                              sx={{
                                width: `${factor.score * 100}%`,
                                bgcolor: getRiskColor(factor.score).concat('.main'),
                                borderRadius: 1,
                                height: 4,
                              }}
                            />
                          </Box>
                        </Box>
                      )) || []}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recommended Actions
                      </Typography>
                      <List>
                        {riskAssessment?.recommended_actions?.map((action: string, index: number) => (
                          <ListItem key={index} divider>
                            <ListItemText primary={action} />
                          </ListItem>
                        )) || []}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Pattern Analysis */}
      {patterns && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Historical Pattern Analysis
              </Typography>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Temporal Patterns</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Peak Hours:
                      </Typography>
                      <Box>
                        {patterns?.temporal_patterns?.peak_hours?.map((hour: number) => (
                          <Chip
                            key={hour}
                            label={`${hour}:00`}
                            size="small"
                            color="primary"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )) || []}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Peak Days:
                      </Typography>
                      <Box>
                        {patterns?.temporal_patterns?.peak_days?.map((day: string) => (
                          <Chip
                            key={day}
                            label={day}
                            size="small"
                            color="secondary"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )) || []}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Seasonal Trends:
                      </Typography>
                      <Typography variant="body2">
                        {patterns.temporal_patterns.seasonal_trends}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Geographical Patterns</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        High Risk Areas:
                      </Typography>
                      <List dense>
                        {patterns?.geographical_patterns?.high_risk_areas?.map((area: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={area}
                              secondary="Established hotspot"
                            />
                          </ListItem>
                        )) || []}
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Emerging Hotspots:
                      </Typography>
                      <List dense>
                        {patterns?.geographical_patterns?.emerging_hotspots?.map((area: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={area}
                              secondary="Trending upward"
                            />
                          </ListItem>
                        )) || []}
                      </List>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Modus Operandi Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Top Methods:
                      </Typography>
                      <Box>
                        {patterns?.modus_operandi?.top_methods?.map((method: string, index: number) => (
                          <Chip
                            key={index}
                            label={method}
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )) || []}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Trending Methods:
                      </Typography>
                      <Box>
                        {patterns?.modus_operandi?.trending_methods?.map((method: string, index: number) => (
                          <Chip
                            key={index}
                            label={method}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )) || []}
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;