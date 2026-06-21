import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthContext } from '../context/AuthContext';

export default function OAuthCallback() {
    const { login } = useContext(AuthContext)!;
    const navigate = useNavigate();
    const [message, setMessage] = useState('Completing sign-in...');

    useEffect(() => {
        const hash = window.location.hash.startsWith('#')
            ? window.location.hash.substring(1)
            : window.location.hash;
        const params = new URLSearchParams(hash);
        const token = params.get('token');
        const error = params.get('error');

        if (token) {
            login(decodeURIComponent(token));
            navigate('/', { replace: true });
            return;
        }

        const errorMessage = error ? decodeURIComponent(error) : 'OAuth sign-in failed.';
        setMessage(errorMessage);
        const timeoutId = window.setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(errorMessage)}`, { replace: true });
        }, 2500);

        return () => window.clearTimeout(timeoutId);
    }, [login, navigate]);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography color="textSecondary">{message}</Typography>
        </Box>
    );
}
