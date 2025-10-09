import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Slider, Stack } from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';

interface DemoEventGeneratorProps {
  onNewAlert: (alert: any) => void;
  center?: { lat: number; lng: number } | null;
}

const randomNearby = (center: { lat: number; lng: number } | null) => {
  const base = center || { lat: 28.6139, lng: 77.2090 }; // default: New Delhi
  const lat = base.lat + (Math.random() - 0.5) * 0.02; // ~±1km
  const lng = base.lng + (Math.random() - 0.5) * 0.02;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
};

const DemoEventGenerator: React.FC<DemoEventGeneratorProps> = ({ onNewAlert, center = null }) => {
  const [running, setRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(4000);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(() => {
        const loc = randomNearby(center);
        const severity = Math.random() > 0.85 ? 'critical' : Math.random() > 0.6 ? 'high' : 'medium';
        const types = ['skimming_attempt', 'suspicious_movement', 'multiple_logins', 'fraudulent_transaction'];
        const type = types[Math.floor(Math.random() * types.length)];
        const alert = {
          alert_id: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type,
          risk_level: severity,
          message: `Simulated ${type.replace('_', ' ')} detected near ${loc.lat}, ${loc.lng}`,
          location: { lat: loc.lat, lng: loc.lng },
          user_id: `sim_user_${Math.floor(Math.random() * 99)}`,
          timestamp: new Date().toISOString(),
          response_time: new Date().toLocaleTimeString(),
          status: 'active'
        };

        onNewAlert(alert);
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running, intervalMs, center, onNewAlert]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          size="small"
          variant={running ? 'contained' : 'outlined'}
          color={running ? 'error' : 'primary'}
          startIcon={running ? <Stop /> : <PlayArrow />}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? 'Stop Demo' : 'Start Demo'}
        </Button>
        <Typography variant="caption" sx={{ ml: 1 }}>Interval (ms)</Typography>
        <Box sx={{ width: 160, pl: 1 }}>
          <Slider
            min={1000}
            max={10000}
            step={500}
            value={intervalMs}
            onChange={(_, v) => setIntervalMs(v as number)}
            size="small"
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default DemoEventGenerator;
