import { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Switch, FormControlLabel, CircularProgress,
    Snackbar, Alert, Divider, Button,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function AdminPanel() {
    const [registrationEmailEnabled, setRegistrationEmailEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get<{ enabled: boolean }>('/api/admin/settings/registration-email');
                setRegistrationEmailEnabled(response.data.enabled);
            } catch (error) {
                console.error('Failed to load admin settings:', error);
                setSnackbar({
                    open: true,
                    message: 'Could not load admin settings.',
                    severity: 'error',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleRegistrationEmailToggle = async (enabled: boolean) => {
        setSaving(true);
        try {
            const response = await api.patch<{ enabled: boolean }>(
                '/api/admin/settings/registration-email',
                { enabled },
            );
            setRegistrationEmailEnabled(response.data.enabled);
            setSnackbar({
                open: true,
                message: enabled
                    ? 'Registration welcome emails are now enabled.'
                    : 'Registration welcome emails are now disabled.',
                severity: 'success',
            });
        } catch (error) {
            console.error('Failed to update setting:', error);
            setSnackbar({
                open: true,
                message: 'Could not update the setting. Please try again.',
                severity: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <AdminPanelSettingsIcon sx={{ fontSize: 32, color: '#e74c3c' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Admin Configuration
                </Typography>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <EmailIcon sx={{ color: '#3498db' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Email Notifications
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <FormControlLabel
                    control={
                        <Switch
                            checked={registrationEmailEnabled}
                            onChange={(e) => handleRegistrationEmailToggle(e.target.checked)}
                            disabled={saving}
                            color="primary"
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                Send welcome email on user registration
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                When enabled, new users receive a welcome email after signing up with email and password.
                            </Typography>
                        </Box>
                    }
                    sx={{ alignItems: 'flex-start', ml: 0 }}
                />
            </Paper>

            <Paper sx={{ p: 3, mt: 3, borderRadius: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ArticleIcon sx={{ color: '#3498db' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Email Templates
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Customize the forgot-password and registration welcome email HTML and subject lines.
                </Typography>

                <Button
                    component={RouterLink}
                    to="/admin/email-templates"
                    variant="outlined"
                    startIcon={<ArticleIcon />}
                >
                    Edit Email Templates
                </Button>
            </Paper>

            <Paper sx={{ p: 3, mt: 3, borderRadius: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HistoryIcon sx={{ color: '#3498db' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        User Activity
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    View authenticated API requests recorded for each user — useful for auditing sign-ins, purchases, and admin actions.
                </Typography>

                <Button
                    component={RouterLink}
                    to="/admin/activity"
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                >
                    Open Activity Log
                </Button>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
