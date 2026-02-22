import { Button, Divider, FormControl, Link, Stack, TextField, Typography } from '@mui/material';
import { Facebook, Google } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../contants/routes';
import { WelcomeContent } from '../../content/welcome-content/WelcomeContent';
import { HalfLayout } from '../../layouts/half-layout/HalfLayout';
import { useCallback } from 'react'; // Removed useRef
import { RegisterForm, registerFormSchema } from './utils/registerForm';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: yupResolver(registerFormSchema),
  });

  const handleCreateAccount = useCallback(async (data: RegisterForm) => {
    // This will now only fire if Yup validation passes!
    console.log("Form data ready to send:", data); 
    
    try {
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: data.firstname, 
          lastname: data.lastname,
          username: data.username,
          email: data.email,
          password: data.password,
          active: true, 
          admin: false 
        }),
      });

      if (response.ok) {
        navigate(routes.login);
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
      }
    } catch (error) {
      console.error('Network error during registration:', error);
    }
  }, [navigate]);

  return (
    <HalfLayout>
      <WelcomeContent />
      <Stack spacing={2} sx={{ minWidth: '60%' }} alignItems={'center'}>
        <Typography variant={'h3'} component={'h1'}>
          Create account
        </Typography>
        <Typography variant={'body1'}>Fill the form below to register new account</Typography>
        
        {/* Added an error callback to handleSubmit so you can see if Yup is blocking the submit */}
        <form 
          onSubmit={handleSubmit(
            handleCreateAccount, 
            (errs) => console.log("Yup Validation Errors:", errs)
          )} 
          style={{ width: '100%' }}
        >
          <Stack direction={'row'} spacing={2} sx={{ width: '100%', mb: 2 }}>
            <FormControl fullWidth>
              <TextField 
                label={'First name'} 
                fullWidth 
                placeholder={'First name'} 
                {...register('firstname')}
                error={!!errors.firstname}
                helperText={errors.firstname?.message as string}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField 
                label={'Last name'} 
                fullWidth 
                placeholder={'Last name'} 
                {...register('lastname')}
                error={!!errors.lastname}
                helperText={errors.lastname?.message as string}
              />
            </FormControl>
          </Stack>
          
          <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
            <FormControl fullWidth>
              <TextField 
                label={'Username'} 
                fullWidth 
                placeholder={'Username'} 
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message as string}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField 
                label={'Email'} 
                fullWidth 
                placeholder={'Email'} 
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message as string}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField 
                label={'Password'} 
                fullWidth 
                placeholder={'Password'} 
                type={'password'} 
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message as string}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField 
                label={'Confirm password'} 
                fullWidth 
                placeholder={'Confirm password'} 
                type={'password'} 
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message as string}
              />
            </FormControl>
          </Stack>

          {/* Cleaned up the Button: No more onClick or handlePublish */}
          <Button type={'submit'} variant={'contained'} fullWidth sx={{ mb: 2 }}>
            Create account
          </Button>
          
          <Divider sx={{ width: '100%', mb: 2 }} />
          <Typography variant={'body2'} sx={{ mb: 1, textAlign: 'center' }}>Or register with</Typography>
          
          <Stack direction={'row'} spacing={1} sx={{ mb: 2, justifyContent: 'center' }}>
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
              Already have an account?{' '}
              <Link
                onClick={() => navigate(routes.login)}
                underline={'hover'}
                component={'button'}
                fontWeight={'fontWeightMedium'}
              >
                Sign in
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
        </form>
      </Stack>
    </HalfLayout>
  );
}