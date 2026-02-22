import { Button, Divider, FormControl, Link, Stack, TextField, Typography } from '@mui/material';
import { Facebook, Google } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../contants/routes';
import { WelcomeContent } from '../../content/welcome-content/WelcomeContent';
import { HalfLayout } from '../../layouts/half-layout/HalfLayout';
import { useCallback, useRef } from 'react';
import { UserForm } from '../user/components/user-form/UserForm';
import { RegisterFieldsNames, RegisterForm, registerFormSchema } from './utils/registerForm';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

export default function RegisterPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const {
    register,
    handleSubmit,
    formState: {errors},
    control,
  } = useForm<RegisterForm>({
    resolver: yupResolver(registerFormSchema),
  })

  // const handleCreateAccount = async ()=>{
  //   alert("HI");
  // }

  const handleCreateAccount = useCallback((data: RegisterForm) => {
      console.log(data);
    }, []);

  const handlePublish = useCallback(() => {
    formRef.current && formRef.current.requestSubmit();
    console.log(formRef.current)
  }, []);

  return (
    <HalfLayout>
      <WelcomeContent />
      <Stack spacing={2} sx={{ minWidth: '60%' }} alignItems={'center'}>
        <Typography variant={'h3'} component={'h1'}>
          Create account
        </Typography>
        <Typography variant={'body1'}>Fill the form below to register new account</Typography>
        <form ref={formRef} onSubmit={handleSubmit(handleCreateAccount)}>
        <Stack direction={'row'} spacing={2} sx={{ width: '100%' }}>
          <FormControl fullWidth>
            <TextField label={'First name'} fullWidth placeholder={'First name'} />
          </FormControl>
          <FormControl fullWidth>
            <TextField label={'Last name'} fullWidth placeholder={'Last name'} />
          </FormControl>
        </Stack>
        <FormControl fullWidth>
          <TextField label={'Username'} fullWidth placeholder={'Username'} />
        </FormControl>
        <FormControl fullWidth>
          <TextField label={'Email'} fullWidth placeholder={'Email'} />
        </FormControl>
        <FormControl fullWidth>
          <TextField label={'Password'} fullWidth placeholder={'Password'} type={'password'} />
        </FormControl>
        <FormControl fullWidth>
          <TextField label={'Confirm password'} fullWidth placeholder={'Password'} type={'password'} />
        </FormControl>

        <Button variant={'contained'} fullWidth onClick={() => handlePublish()}>
          Create account
        </Button>
        <Divider sx={{ width: '100%' }} />
        <Typography variant={'body2'}>Or register with</Typography>
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
