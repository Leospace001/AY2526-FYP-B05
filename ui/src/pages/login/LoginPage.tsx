import { Alert, Box, Button, Card, CardContent, FormControl, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../../contants/routes';
import { WelcomeContent } from '../../content/welcome-content/WelcomeContent';
import { HalfLayout } from '../../layouts/half-layout/HalfLayout';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const presetUsername = location.state?.username;
    if (typeof presetUsername === 'string' && presetUsername.trim()) {
      setUsername(presetUsername.trim());
      setErrorMessage('');
    }
  }, [location.state]);

  const canSubmit = useMemo(() => username.trim().length > 0 && password.trim().length > 0, [username, password]);

  const handleLogin = async () => {
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/login`,
        {
          username: username.trim(),
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const token = response.data.token;

      if (token) {
        localStorage.setItem('token', token);
        navigate('/', { replace: true });
        return;
      }

      setErrorMessage('Login succeeded but token was missing from the response.');
    } catch (error: any) {
      console.error('Login error:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const backendMessage =
          error.response?.data?.error || (typeof error.response?.data === 'string' ? error.response.data : undefined);

        if (status === 401 || status === 403) {
          setErrorMessage(backendMessage || 'Invalid username or password.');
        } else if (status === 404) {
          setErrorMessage('Login endpoint not found. Please check that the backend is running.');
        } else if (status && status >= 500) {
          setErrorMessage(backendMessage || 'Server error. Please try again later.');
        } else if (error.code === 'ERR_NETWORK') {
          setErrorMessage('Cannot reach server. Please make sure the backend is running.');
        } else {
          setErrorMessage(backendMessage || 'An unexpected error occurred. Please try again later.');
        }
      } else {
        setErrorMessage('Network error. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <HalfLayout>
      <WelcomeContent />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 480,
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Stack spacing={3} alignItems='stretch'>
              <Box textAlign='center'>
                <Typography variant='h4' component='h1' sx={{ fontWeight: 800, mb: 1 }}>
                  Sign In
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Welcome back to Plant AI Analysis
                </Typography>
              </Box>

              {errorMessage ? (
                <Alert severity='error' sx={{ width: '100%' }}>
                  {errorMessage}
                </Alert>
              ) : null}

              <FormControl fullWidth>
                <TextField
                  fullWidth
                  label={'Username'}
                  placeholder={'Enter your username'}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                />
              </FormControl>

              <FormControl fullWidth>
                <TextField
                  fullWidth
                  placeholder={'Enter your password'}
                  type={'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                />
              </FormControl>

              <Button
                variant={'contained'}
                fullWidth
                onClick={handleLogin}
                disabled={isSubmitting || !canSubmit}
                sx={{ py: 1.3, borderRadius: 999, fontWeight: 700 }}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>

              <Stack direction='row' justifyContent='center' spacing={0.5} alignItems='center'>
                <Typography variant='body2' color='text.secondary'>
                  Don&apos;t have an account?
                </Typography>
                <Button variant='text' onClick={() => navigate(routes.register)} sx={{ minWidth: 'auto', p: 0 }}>
                  Sign Up
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </HalfLayout>
  );
}
