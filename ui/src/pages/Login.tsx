import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Alert, Divider } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

function resolveLoginError(err: unknown): string {
    const apiErr = err as {
        message?: string;
        response?: { status?: number; data?: { message?: string } };
    };
    if (!apiErr.response) {
        return 'Cannot reach the server. Check that the backend is running and try again.';
    }
    if (apiErr.response.status === 401) {
        return apiErr.response.data?.message ?? 'Invalid username or password. Please try again.';
    }
    return apiErr.response.data?.message ?? apiErr.message ?? 'Login failed. Please try again.';
}

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useContext(AuthContext)!;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [oauthProviders, setOauthProviders] = useState<string[]>(['google', 'github']);

    useEffect(() => {
        const oauthError = searchParams.get('error');
        if (oauthError) {
            setError(decodeURIComponent(oauthError));
        }
    }, [searchParams]);

    useEffect(() => {
        api.get<string[]>('/api/auth/oauth/providers')
            .then((response) => {
                if (response.data.length > 0) {
                    setOauthProviders(response.data);
                }
            })
            .catch(() => {
                // Keep default buttons visible; backend will validate on redirect
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/api/login', { username, password });

            let token = response.data.accessToken || response.data.token || response.headers['authorization'];
            if (!token && typeof response.data === 'string') {
                token = response.data;
            }
            if (token && token.startsWith('Bearer ')) {
                token = token.slice(7);
            }

            if (!token) throw new Error('No token received.');

            login(token);
            navigate('/');
        } catch (err: unknown) {
            console.error(err);
            setError(resolveLoginError(err));
        } finally {
            setLoading(false);
        }
    };

    const startOAuth = (provider: string) => {
        window.location.href = `/oauth2/authorization/${provider}`;
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f6fa', p: 2 }}>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, maxWidth: '400px', width: '100%', borderRadius: 3, boxShadow: 4 }}>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ bgcolor: '#3498db', p: 1.5, borderRadius: '50%', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LockOutlinedIcon sx={{ color: '#fff', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        Welcome Back
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Sign in with your account or a connected provider.
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    {oauthProviders.includes('google') && (
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<GoogleIcon />}
                            onClick={() => startOAuth('google')}
                            sx={{ py: 1.2, fontWeight: 'bold' }}
                        >
                            Continue with Google
                        </Button>
                    )}
                    {oauthProviders.includes('github') && (
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<GitHubIcon />}
                            onClick={() => startOAuth('github')}
                            sx={{ py: 1.2, fontWeight: 'bold' }}
                        >
                            Continue with GitHub
                        </Button>
                    )}
                    <Divider sx={{ my: 1 }}>or use username</Divider>
                </Box>

                <TextField
                    fullWidth
                    required
                    label="Username"
                    variant="outlined"
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <TextField
                    fullWidth
                    required
                    label="Password"
                    type="password"
                    variant="outlined"
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 3 }}
                />

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ py: 1.5, mb: 2, fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                    {loading ? <CircularProgress size={26} color="inherit" /> : 'Sign In'}
                </Button>

                <Typography align="center" variant="body2">
                    Don't have an account?{' '}
                    <Box component={RouterLink} to="/register" sx={{ fontWeight: 'bold', textDecoration: 'none', color: '#3498db' }}>
                        Sign Up
                    </Box>
                </Typography>

                <Typography align="center" variant="body2" sx={{ mt: 1 }}>
                    Forgot password?{' '}
                    <Box component={RouterLink} to="/forgot" sx={{ fontWeight: 'bold', textDecoration: 'none', color: '#3498db' }}>
                        Forgot password
                    </Box>
                </Typography>
            </Paper>
        </Box>
    );
}
