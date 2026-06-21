import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, Snackbar, Alert, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import api from '../api/axiosConfig';
import UserAvatar from '../components/UserAvatar';

interface UserInfo {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    age: number;
    phone: number;
    avatarPath?: string;
    avatarUrl?: string;
}

export default function MyProfile() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [profile, setProfile] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const loadProfile = async () => {
        const response = await api.get('/api/users');
        if (response.data.content && response.data.content.length > 0) {
            setProfile(response.data.content[0]);
        }
    };

    useEffect(() => {
        loadProfile()
            .catch(error => {
                console.error(error);
                setSnackbar({ open: true, message: 'Failed to load profile data', severity: 'error' });
            })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (profile) {
            setProfile({ ...profile, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);
        try {
            await api.put(`/api/users/${profile.username}`, profile);
            setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to save changes.', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;
        if (!file.type.startsWith('image/')) {
            setSnackbar({ open: true, message: 'Please choose an image file.', severity: 'error' });
            return;
        }

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await api.post(`/api/users/${profile.username}/avatar`, formData);
            setProfile(response.data);
            setSnackbar({ open: true, message: 'Profile photo updated!', severity: 'success' });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to upload avatar.', severity: 'error' });
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const displayName = `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim() || profile?.username;

    return (
        <Box sx={{ p: 3, maxWidth: '640px', margin: '0 auto' }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#2c3e50' }}>My Profile</Typography>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <UserAvatar
                        avatarPath={profile?.avatarPath}
                        avatarUrl={profile?.avatarUrl}
                        name={displayName}
                        size={112}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarUpload}
                    />
                    <Button
                        variant="outlined"
                        startIcon={uploadingAvatar ? <CircularProgress size={18} /> : <PhotoCameraIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                    >
                        {uploadingAvatar ? 'Uploading...' : 'Change profile photo'}
                    </Button>
                    {profile?.avatarUrl && !profile?.avatarPath && (
                        <Typography variant="caption" color="text.secondary">
                            Using avatar imported from your OAuth provider
                        </Typography>
                    )}
                </Box>
            </Paper>

            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <TextField label="Username" value={profile?.username || ''} disabled fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="First Name" name="firstname" value={profile?.firstname || ''} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Last Name" name="lastname" value={profile?.lastname || ''} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid size={12}>
                        <TextField label="Email Address" name="email" type="email" value={profile?.email || ''} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Age" name="age" type="number" value={profile?.age || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Phone Number" name="phone" type="number" value={profile?.phone || ''} onChange={handleChange} fullWidth />
                    </Grid>

                    <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={saving}
                            startIcon={!saving && <SaveIcon />}
                            sx={{ fontWeight: 'bold', px: 4 }}
                        >
                            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
