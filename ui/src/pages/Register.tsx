import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
    Box, Typography, Paper, TextField, Button, Grid, 
    CircularProgress, Snackbar, Alert, Link, InputAdornment 
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '../api/axiosConfig';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        username: '',
        password: '',
        email: '',
        age: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Fires the exact POST payload your Spring Boot backend is expecting
            await api.post('/api/users', {
                ...formData,
                age: parseInt(formData.age) || 0,
                phone: parseInt(formData.phone) || 0
            });
            
            setSnackbar({ open: true, message: 'Account created successfully! Redirecting to login...', severity: 'success' });
            
            // Wait 1.5 seconds so the user can read the success message, then redirect
            setTimeout(() => {
                navigate('/login');
            }, 1500);

        } catch (error: any) {
            console.error(error);
            setSnackbar({ 
                open: true, 
                message: error.response?.data?.message || 'Registration failed. Username or email may already exist.', 
                severity: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f6fa', p: 2 }}>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, maxWidth: '600px', width: '100%', borderRadius: 3, boxShadow: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                    <PersonAddIcon sx={{ fontSize: 48, color: '#3498db', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        Create an Account
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Join the platform to start managing your inventory
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth required label="First Name" name="firstname" value={formData.firstname} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth required label="Last Name" name="lastname" value={formData.lastname} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth required label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth required label="Username" name="username" value={formData.username} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth required label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Phone Number" name="phone" type="number" value={formData.phone} onChange={handleChange} />
                    </Grid>
                </Grid>

                <Button 
                    type="submit" 
                    fullWidth 
                    variant="contained" 
                    size="large" 
                    disabled={loading} 
                    sx={{ mt: 4, mb: 2, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                    {loading ? <CircularProgress size={26} color="inherit" /> : 'Sign Up'}
                </Button>

                <Typography textAlign="center" variant="body2">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold', textDecoration: 'none' }}>
                        Log In Here
                    </Link>
                </Typography>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}