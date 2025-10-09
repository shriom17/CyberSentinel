import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Security as SecurityIcon, Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      // Initialize Google OAuth
      if (typeof window !== 'undefined' && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '1234567890-abcdefg.apps.googleusercontent.com',
          callback: handleGoogleCallback,
        });

        (window as any).google.accounts.id.prompt(); // Show One Tap dialog
      } else {
        // Fallback: simulate Google login for demo
        await simulateGoogleLogin();
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleGoogleCallback = async (response: any) => {
    try {
      // Send the Google token to backend
      const backendResponse = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await backendResponse.json();
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError('Google authentication failed');
      }
    } catch (err) {
      console.error('Google callback error:', err);
      setError('Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const simulateGoogleLogin = async () => {
    // Demo mode: simulate Google login
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const success = await login('admin', 'admin123'); // Auto-login as admin
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Demo Google login failed');
        }
        setGoogleLoading(false);
        resolve();
      }, 1500);
    });
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
             CyberSentinel
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Predictive Intelligence Platform
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || googleLoading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="textSecondary">
                OR
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={googleLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              sx={{
                mb: 2,
                borderColor: '#4285f4',
                color: '#4285f4',
                '&:hover': {
                  borderColor: '#357ae8',
                  backgroundColor: 'rgba(66, 133, 244, 0.04)',
                },
              }}
            >
              {googleLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;