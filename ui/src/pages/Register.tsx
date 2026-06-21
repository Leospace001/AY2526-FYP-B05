import React, { useRef, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Button, Grid,
    CircularProgress, Snackbar, Alert
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import api from '../api/axiosConfig';
import UserAvatar from '../components/UserAvatar';

export default function Register() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        username: '',
        password: '',
        email: '',
        age: '',
        phone: ''
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setSnackbar({ open: true, message: 'Please choose an image file.', severity: 'error' });
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                age: parseInt(formData.age, 10) || 0,
                phone: parseInt(formData.phone, 10) || 0,
            };

            if (avatarFile) {
                const multipart = new FormData();
                multipart.append('user', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
                multipart.append('avatar', avatarFile);
                await api.post('/api/register', multipart);
            } else {
                await api.post('/api/register', payload);
            }

            setSnackbar({ open: true, message: 'Account created successfully! Redirecting to login...', severity: 'success' });
            setTimeout(() => navigate('/login'), 1500);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Registration failed. Username or email may already exist.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const displayName = `${formData.firstname} ${formData.lastname}`.trim() || formData.username || 'New user';

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f6fa', p: 2 }}>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, maxWidth: '640px', width: '100%', borderRadius: 3, boxShadow: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <PersonAddIcon sx={{ fontSize: 48, color: '#3498db', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        Create an Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                        Add a profile photo now, or sign up with Google/GitHub later to import your provider avatar automatically.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    {avatarPreview ? (
                        <Box
                            component="img"
                            src={avatarPreview}
                            alt="Avatar preview"
                            sx={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', mb: 1 }}
                        />
                    ) : (
                        <UserAvatar name={displayName} size={96} />
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarChange}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<PhotoCameraIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ mt: 1 }}
                    >
                        {avatarFile ? 'Change photo' : 'Add profile photo'}
                    </Button>
                </Box>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="First Name" name="firstname" value={formData.firstname} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Last Name" name="lastname" value={formData.lastname} onChange={handleChange} />
                    </Grid>
                    <Grid size={12}>
                        <TextField fullWidth required label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </Grid>
                    <Grid size={12}>
                        <TextField fullWidth required label="Username" name="username" value={formData.username} onChange={handleChange} />
                    </Grid>
                    <Grid size={12}>
                        <TextField fullWidth required label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
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

                <Typography align="center" variant="body2">
                    Already have an account?{' '}
                    <Box component={RouterLink} to="/login" sx={{ fontWeight: 'bold', textDecoration: 'none', color: '#3498db' }}>
                        Log In Here
                    </Box>
                </Typography>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
