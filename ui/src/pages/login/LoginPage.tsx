import { Button, Divider, FormControl, Link, Stack, TextField, Typography } from '@mui/material';
import { Facebook, Google } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../contants/routes';
import { WelcomeContent } from '../../content/welcome-content/WelcomeContent';
import { HalfLayout } from '../../layouts/half-layout/HalfLayout';
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/login",
        { "username": "string", "password": "string" },
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin":"*",
          },
        }
      );

      const token = response.data.token;

      if (token) {
        localStorage.setItem("token", token);
        
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <HalfLayout>
      <WelcomeContent />
      <Stack spacing={2} sx={{ minWidth: '60%' }} alignItems={'center'}>
        <Typography variant={'h3'} component={'h1'}>
          Hello Testing,
        </Typography>
        <Typography variant={'body1'}>Enter your credentials below</Typography>
        <FormControl fullWidth>
          <TextField fullWidth placeholder={'Email'} />
        </FormControl>
        <FormControl fullWidth>
          <TextField fullWidth placeholder={'Password'} type={'password'} />
        </FormControl>

        <Button variant={'contained'} fullWidth onClick={()=>handleLogin()  }>
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
