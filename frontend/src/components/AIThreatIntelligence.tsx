import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Avatar
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Warning,
  Security,
  ExpandMore,
  AutoFixHigh,
  Timeline,
  Insights,
  SmartToy
} from '@mui/icons-material';

interface ThreatIntelligence {
  id: string;
  threat_type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  prediction: string;
  indicators: string[];
  countermeasures: string[];
  timeline: string;
  affected_areas: string[];
  source: string;
}

interface PredictiveInsight {
  insight_type: string;
  confidence: number;
  description: string;
  impact_radius: number;
  time_window: string;
  preventive_actions: string[];
}

const AIThreatIntelligence: React.FC = () => {
  const [threats, setThreats] = useState<ThreatIntelligence[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'predicting'>('idle');

  // Simulate AI-powered threat intelligence
  const generateThreatIntelligence = () => {
    setIsAnalyzing(true);
    setAiStatus('analyzing');

    // Simulate AI processing time
    setTimeout(() => {
      const newThreats: ThreatIntelligence[] = [
        {
          id: `ai_threat_${Date.now()}`,
          threat_type: 'Coordinated ATM Skimming Campaign',
          confidence: 0.89,
          severity: 'high',
          prediction: 'High probability of coordinated skimming attacks targeting SBI and HDFC ATMs in Connaught Place area within next 6 hours',
          indicators: [
            'Unusual device attachments detected on 3 ATMs',
            'Spike in declined transactions (42% increase)',
            'Social media chatter mentioning "easy money CP"',
            'Similar MO to Mumbai incident last week'
          ],
          countermeasures: [
            'Deploy security teams to identified ATMs',
            'Increase surveillance monitoring',
            'Alert bank security departments',
            'Issue public awareness notifications'
          ],
          timeline: 'Next 6 hours (Peak risk: 2-4 PM)',
          affected_areas: ['Connaught Place', 'Janpath', 'Barakhamba Road'],
          source: 'AI Pattern Recognition + Social Intelligence'
        },
        {
          id: `ai_threat_${Date.now() + 1}`,
          threat_type: 'Synthetic Identity Fraud Ring',
          confidence: 0.76,
          severity: 'medium',
          prediction: 'Emerging synthetic identity fraud network targeting digital payment platforms',
          indicators: [
            'Anomalous account creation patterns',
            'Shared device fingerprints across accounts',
            'Rapid transaction escalation patterns',
            'Suspicious KYC document similarities'
          ],
          countermeasures: [
            'Enhanced identity verification protocols',
            'Cross-platform account linking analysis',
            'Implement additional biometric checks',
            'Coordinate with financial institutions'
          ],
          timeline: 'Ongoing (Active for 72 hours)',
          affected_areas: ['Delhi NCR', 'Mumbai Metropolitan'],
          source: 'Deep Learning Behavioral Analysis'
        }
      ];

      const newInsights: PredictiveInsight[] = [
        {
          insight_type: 'Temporal Hotspot Prediction',
          confidence: 0.91,
          description: 'AI predicts 73% increase in cyber fraud attempts during Diwali festival period (Oct 31 - Nov 5)',
          impact_radius: 15000, // meters
          time_window: 'Oct 31 - Nov 5, 2025',
          preventive_actions: [
            'Pre-position rapid response teams',
            'Increase ATM surveillance frequency',
            'Launch targeted awareness campaigns',
            'Coordinate with payment processors'
          ]
        },
        {
          insight_type: 'Cross-Platform Attack Vector',
          confidence: 0.84,
          description: 'Machine learning identifies new attack vector: Social engineering via fake festival discount apps',
          impact_radius: 25000,
          time_window: 'Next 14 days',
          preventive_actions: [
            'Monitor app store submissions',
            'Issue public advisories',
            'Coordinate with telecom providers',
            'Deploy honeypot applications'
          ]
        }
      ];

      setThreats(newThreats);
      setInsights(newInsights);
      setIsAnalyzing(false);
      setAiStatus('idle');
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: '#d32f2f',
      high: '#ff9800',
      medium: '#fbc02d',
      low: '#388e3c'
    };
    return colors[severity as keyof typeof colors] || '#666';
  };

  useEffect(() => {
    // Auto-generate initial intelligence
    generateThreatIntelligence();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SmartToy sx={{ mr: 1, color: '#9c27b0' }} />
          🤖 AI Threat Intelligence
        </Typography>
        <Button
          variant="contained"
          startIcon={<AutoFixHigh />}
          onClick={generateThreatIntelligence}
          disabled={isAnalyzing}
          sx={{ background: 'linear-gradient(45deg, #9c27b0, #e91e63)' }}
        >
          {isAnalyzing ? 'AI Analyzing...' : 'Generate Intelligence'}
        </Button>
      </Box>

      {/* AI Status */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Psychology sx={{ mr: 2, fontSize: 40 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">AI Cyber Intelligence Engine</Typography>
              <Typography variant="body2">
                Status: {aiStatus === 'analyzing' ? 'Deep Learning Analysis in Progress...' : 'Ready for Threat Detection'}
              </Typography>
              {isAnalyzing && <LinearProgress sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />}
            </Box>
            <Chip 
              label={`${threats.length} Active Threats`} 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Threat Intelligence Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {threats.map((threat) => (
          <Grid item xs={12} key={threat.id}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar sx={{ bgcolor: getSeverityColor(threat.severity), mr: 2 }}>
                    <Warning />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{threat.threat_type}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={`${threat.severity.toUpperCase()}`}
                        size="small"
                        sx={{ bgcolor: getSeverityColor(threat.severity), color: 'white' }}
                      />
                      <Chip 
                        label={`${(threat.confidence * 100).toFixed(0)}% Confidence`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">AI Prediction</Typography>
                      {threat.prediction}
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>🔍 Threat Indicators</Typography>
                    <List dense>
                      {threat.indicators.map((indicator, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon><TrendingUp fontSize="small" /></ListItemIcon>
                          <ListItemText primary={indicator} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>🛡️ Recommended Countermeasures</Typography>
                    <List dense>
                      {threat.countermeasures.map((measure, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                          <ListItemText primary={measure} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip icon={<Timeline />} label={`Timeline: ${threat.timeline}`} />
                      <Chip icon={<Insights />} label={`Source: ${threat.source}`} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Affected Areas:</strong> {threat.affected_areas.join(', ')}
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Predictive Insights */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Insights sx={{ mr: 1, color: '#2196f3' }} />
            🔮 Predictive Insights
          </Typography>
          
          {insights.map((insight, idx) => (
            <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">{insight.insight_type}</Typography>
                <Chip 
                  label={`${(insight.confidence * 100).toFixed(0)}% Confidence`}
                  size="small"
                  color="primary"
                />
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2 }}>{insight.description}</Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip size="small" label={`Impact Radius: ${(insight.impact_radius/1000).toFixed(1)}km`} />
                <Chip size="small" label={`Window: ${insight.time_window}`} />
              </Box>
              
              <Typography variant="caption" gutterBottom>Preventive Actions:</Typography>
              <List dense>
                {insight.preventive_actions.map((action, actionIdx) => (
                  <ListItem key={actionIdx}>
                    <ListItemText 
                      primary={action}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AIThreatIntelligence;