import { Alert, Button, FormControl, Link, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../contants/routes';
import { WelcomeContent } from '../../content/welcome-content/WelcomeContent';
import { HalfLayout } from '../../layouts/half-layout/HalfLayout';
import { useCallback, useState } from 'react';
import { RegisterForm, registerFormSchema } from './utils/registerForm';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: yupResolver(registerFormSchema),
  });

  const handleCreateAccount = useCallback(async (data: RegisterForm) => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
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
          admin: false,
        }),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        const message = responseBody?.message || responseBody?.error || 'Registration failed. Please try again.';
        setErrorMessage(message);
        return;
      }

      setSuccessMessage(responseBody?.message || 'Registration successful. You can now sign in.');
      setTimeout(() => {
        navigate(routes.login, {
          state: {
            username: data.username,
            message: 'Registration successful. You can now sign in.',
          },
        });
      }, 1200);
    } catch (error) {
      console.error('Network error during registration:', error);
      setErrorMessage('Cannot reach server. Please try again later.');
    } finally {
      setIsSubmitting(false);
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

        {successMessage ? <Alert severity='success' sx={{ width: '100%' }}>{successMessage}</Alert> : null}
        {errorMessage ? <Alert severity='error' sx={{ width: '100%' }}>{errorMessage}</Alert> : null}

        <form
          onSubmit={handleSubmit(handleCreateAccount, (errs) => console.log('Yup Validation Errors:', errs))}
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

          <Button type={'submit'} variant={'contained'} fullWidth sx={{ mb: 2 }} disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>

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
          </Stack>
        </form>
      </Stack>
    </HalfLayout>
  );
}
