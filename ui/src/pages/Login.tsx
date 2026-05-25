import React, { useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Link, Alert } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext); 
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            const response = await api.post('/api/login', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            let token = response.data.accessToken || response.data.token || response.headers['authorization'];
            if (!token && typeof response.data === 'string') {
                token = response.data;
            }
            if (token && token.startsWith('Bearer ')) {
                token = token.slice(7);
            }

            if (!token) throw new Error("No token received.");

            // 🚀 THE FIX: Just pass the raw string token! AuthContext will handle the rest.
            login(token);
            
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError('Invalid username or password. Please try again.');
        } finally {
            setLoading(false);
        }
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
                        Please enter your details to sign in.
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

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

                <Typography textAlign="center" variant="body2">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/register" sx={{ fontWeight: 'bold', textDecoration: 'none' }}>
                        Sign Up
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
}