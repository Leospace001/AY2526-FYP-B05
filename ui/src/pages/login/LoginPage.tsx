import { Alert, Button, Divider, FormControl, Link, Stack, TextField, Typography } from '@mui/material'; // Imported Alert
import { Facebook, Google } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../contants/routes';
import { WelcomeContent } from '../../content/welcome-content/WelcomeContent';
import { HalfLayout } from '../../layouts/half-layout/HalfLayout';
import axios, { AxiosError } from "axios"; // Imported AxiosError for better typing
import { useState } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // 1. New state for the error message

  const handleLogin = async () => {
    // Clear any previous errors when attempting a new login
    setErrorMessage('');

    try {
      const response = await axios.post(
        "http://localhost:8080/login",
        { 
          "username": username,
          "password": password 
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const token = response.data.token;

      if (token) {
        localStorage.setItem("token", token);
        
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // 2. Check if the error is an Axios error and if the status is 403
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          setErrorMessage('Invalid username or password.');
        } else {
          setErrorMessage('An unexpected error occurred. Please try again later.');
        }
      } else {
        setErrorMessage('Network error. Please check your connection.');
      }
    }
  };

  return (
    <HalfLayout>
      <WelcomeContent />
      <Stack spacing={2} sx={{ minWidth: '60%' }} alignItems={'center'}>
        <Typography variant={'h3'} component={'h1'}>
          Hello Testing
        </Typography>
        <Typography variant={'body1'}>Enter your credentials below</Typography>
        
        {/* 3. Conditionally render the Alert if there is an error message */}
        {errorMessage && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        )}

        <FormControl fullWidth>
          <TextField 
            fullWidth 
            placeholder={'Email or Username'} 
            value={username} 
            onChange={(e) => {
              setUsername(e.target.value);
              setErrorMessage(''); // Clear error when user starts typing again
            }} 
          />
        </FormControl>
        
        <FormControl fullWidth>
          <TextField 
            fullWidth 
            placeholder={'Password'} 
            type={'password'} 
            value={password} 
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage(''); // Clear error when user starts typing again
            }} 
          />
        </FormControl>

        <Button variant={'contained'} fullWidth onClick={() => handleLogin()}>
          Login
        </Button>
        <Divider sx={{ width: '100%' }} />
        <Typography variant={'body2'}>Or login with</Typography>
        <Stack direction={'row'} spacing={1}>
          <Button variant={'outlined'} startIcon={<Google />}>
            Google
          </Button>
          <Button variant={'outlined'} startIcon={<Facebook />}>
            Facebook
          </Button>
        </Stack>
        <Stack spacing={1}>
          <Typography
            variant={'body2'}
            sx={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}
          >
            Don't have an account?{' '}
            <Link
              onClick={() => navigate(routes.register)}
              underline={'hover'}
              component={'button'}
              fontWeight={'fontWeightMedium'}
            >
              Sign up
            </Link>
          </Typography>
          <Typography
            variant={'body2'}
            sx={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}
          >
            Forgot password?{' '}
            <Link
              onClick={() => navigate(routes.resetPassword)}
              component={'button'}
              underline={'hover'}
              fontWeight={'fontWeightMedium'}
            >
              Reset password
            </Link>
          </Typography>
        </Stack>
      </Stack>
    </HalfLayout>
  );
}