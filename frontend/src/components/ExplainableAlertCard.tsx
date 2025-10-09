import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, Divider } from '@mui/material';
import { HelpOutline, Bolt, PlaylistAddCheck } from '@mui/icons-material';

interface ExplainableAlertCardProps {
  alert: any;
  onInvestigate?: (id: string) => void;
}

const scoreToReasons = (alert: any) => {
  // Lightweight heuristic explainability for demo/hackathon
  const reasons: string[] = [];
  if (!alert) return reasons;
  if (alert.type?.includes('skimming')) reasons.push('Nearby ATM skimming signatures matched');
  if (alert.type?.includes('suspicious')) reasons.push('Unusual movement pattern for user session');
  if (alert.risk_level === 'critical') reasons.push('Multiple corroborating signals across sensors');
  if (alert.user_id?.startsWith('sim')) reasons.push('Simulated user (demo) — use to test workflow');
  if (alert.message && alert.message.length > 80) reasons.push('Detailed message contains keywords matching fraud taxonomy');
  return reasons;
};

const ExplainableAlertCard: React.FC<ExplainableAlertCardProps> = ({ alert, onInvestigate }) => {
  if (!alert) return null;
  const reasons = scoreToReasons(alert);

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Explainable Alert</Typography>
          <Chip label={alert.risk_level?.toUpperCase() || 'N/A'} color={alert.risk_level === 'critical' ? 'error' : 'warning'} size="small" />
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 1 }}>{alert.type?.replace('_', ' ')}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>{alert.message}</Typography>

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle2">Why this alert was raised</Typography>
        {reasons.length === 0 ? (
          <Typography variant="body2" color="textSecondary">No deterministic reasons found — model confidence heuristics apply.</Typography>
        ) : (
          reasons.map((r, i) => (
            <Typography key={i} variant="body2">• {r}</Typography>
          ))
        )}

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle2">Suggested Playbook</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button size="small" startIcon={<Bolt />} variant="contained" color="error" onClick={() => onInvestigate && onInvestigate(alert.alert_id)}>
            Rapid Response
          </Button>
          <Button size="small" startIcon={<PlaylistAddCheck />} variant="outlined" onClick={() => window.open(`https://maps.google.com?q=${alert.location?.lat},${alert.location?.lng}`, '_blank')}>
            Dispatch + Map
          </Button>
          <Button size="small" startIcon={<HelpOutline />} variant="text" onClick={() => alert('Open case notes / forensic checklist')}>
            Forensics Checklist
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExplainableAlertCard;
