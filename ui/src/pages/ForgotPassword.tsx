import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 🚀 FIXED: Removed the unused 'const response =' assignment
            await fetch('/api/forgot-password?email=' + email, { 
                method: "POST",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: email 
            });
            
            // You might want to add a success message state here later!
            
        } catch (err: any) {
            console.error(err);
            // You may want to update this error text to reflect a failed email send
            setError('An error occurred. Please try again.');
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
                        Forgot password
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Please enter your email address
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
                    label="Email address"
                    type="text"
                    variant="outlined"
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    {loading ? <CircularProgress size={26} color="inherit" /> : 'Send reset password form'}
                </Button>
            </Paper>
        </Box>
    );
}