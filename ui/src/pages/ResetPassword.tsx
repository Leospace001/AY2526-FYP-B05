import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // 🚀 We keep searchParams because you are actively using it to grab the token!
    const [searchParams] = useSearchParams();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = searchParams.get("token");
            
            // 🚀 FIXED: Removed the unused 'const response =' assignment
            await fetch('/api/reset-password?token=' + token, { 
                method: "POST",
                headers :{
                    "Content-Type": "text/plain"
                },
                body: password 
            });
            
            // Note: You might want to add a success message or redirect the user 
            // back to the login page here after a successful reset!
            
        } catch (err: any) {
            console.error(err);
            // Updated the error message slightly to make more sense for a reset failure
            setError('Failed to reset password. Your link may be expired.');
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
                        Reset password form
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Please enter your password to reset
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
                    {loading ? <CircularProgress size={26} color="inherit" /> : 'Reset password'}
                </Button>
            </Paper>
        </Box>
    );
}