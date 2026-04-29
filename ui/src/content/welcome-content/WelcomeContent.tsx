import { Box, Typography } from '@mui/material';
import LocalFloristOutlinedIcon from '@mui/icons-material/LocalFloristOutlined';

export const WelcomeContent = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
        maxWidth: 560,
        pr: { md: 4 },
        color: '#fff',
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 4,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.12)',
          color: '#fff',
          backdropFilter: 'blur(12px)',
        }}
      >
        <LocalFloristOutlinedIcon sx={{ fontSize: 38 }} />
      </Box>
      <Typography variant='h4' sx={{ fontWeight: 800, lineHeight: 1.2, color: '#fff', letterSpacing: '-0.03em' }}>
        Plant AI Analysis
      </Typography>
      <Typography
        variant='body1'
        sx={{
          lineHeight: 1.8,
          color: 'rgba(255, 255, 255, 0.86)',
          fontSize: '1.02rem',
          maxWidth: 520,
        }}
      >
        Leveraging the power of Gemini 2.5 Flash to provide personalized flower recommendations based on your unique
        preferences, lifestyle, and environment. Join our community of plant enthusiasts and start your botanical
        journey today.
      </Typography>
    </Box>
  );
};
