import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AccountGeneralFieldsNames, AccountGeneralForm, accountGeneralFormSchema } from '../../utils/userForms';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { UserFormDefaultValues } from './types/userFormDefaultValues.ts';
import { useUpdateCurrentUser } from '../../../../hooks/api/use-current-user/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../../contants/routes';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface Props {
  defaultValues?: UserFormDefaultValues;
  submitButtonText?: string;
}

export const UserForm = ({ defaultValues, submitButtonText = 'Save changes' }: Props) => {
  const navigate = useNavigate();
  const updateMutation = useUpdateCurrentUser();
  const [successOpen, setSuccessOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountGeneralForm>({
    resolver: yupResolver(accountGeneralFormSchema),
    defaultValues,
  });

  const passwordValue = watch(AccountGeneralFieldsNames.password);

  const handleSave = useCallback(
    async (data: AccountGeneralForm) => {
      setErrorMessage('');
      try {
        await updateMutation.mutateAsync({
          username: data.username,
          password: data.password || '',
        });
        setSuccessOpen(true);
      } catch (error: any) {
        setErrorMessage(error?.message || 'Failed to update account.');
      }
    },
    [updateMutation],
  );

  const handleConfirm = () => {
    setSuccessOpen(false);
    localStorage.removeItem('token');
    navigate(routes.login, { replace: true });
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleSave)}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card sx={{ padding: 2, flex: 1, height: '100%' }} elevation={2}>
              <CardHeader title={'Account'} subheader={'Basic account information'} />
              <CardContent>
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
                </Stack>

                <Stack spacing={3}>
                  <Stack spacing={1}>
                    <Typography variant='body2' color='text.secondary'>
                      Current username: <strong>{defaultValues?.username || 'Unknown'}</strong>
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Username to change to:
                    </Typography>
                    <FormControl fullWidth>
                      <TextField
                        error={!!errors[AccountGeneralFieldsNames.username]}
                        {...register(AccountGeneralFieldsNames.username)}
                        label={'New username'}
                        size={'medium'}
                      />
                      {errors[AccountGeneralFieldsNames.username] ? (
                        <FormHelperText error>{errors[AccountGeneralFieldsNames.username].message}</FormHelperText>
                      ) : null}
                    </FormControl>
                  </Stack>

                  <Stack spacing={1}>
                    <Typography variant='body2' color='text.secondary'>
                      Password to change to:
                    </Typography>
                    <FormControl fullWidth>
                      <TextField
                        type={showPassword ? 'text' : 'password'}
                        error={!!errors[AccountGeneralFieldsNames.password]}
                        {...register(AccountGeneralFieldsNames.password as any)}
                        label={'New password'}
                        size={'medium'}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton onClick={() => setShowPassword((prev) => !prev)} edge='end'>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {errors[AccountGeneralFieldsNames.password] ? (
                        <FormHelperText error>{errors[AccountGeneralFieldsNames.password].message}</FormHelperText>
                      ) : null}
                    </FormControl>
                  </Stack>

                  <Stack spacing={1}>
                    <Typography variant='body2' color='text.secondary'>
                      Confirm password:
                    </Typography>
                    <FormControl fullWidth>
                      <TextField
                        type={showConfirmPassword ? 'text' : 'password'}
                        error={!!errors[AccountGeneralFieldsNames.confirmPassword]}
                        {...register(AccountGeneralFieldsNames.confirmPassword as any)}
                        label={'Confirm new password'}
                        size={'medium'}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} edge='end'>
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {errors[AccountGeneralFieldsNames.confirmPassword] ? (
                        <FormHelperText error>{errors[AccountGeneralFieldsNames.confirmPassword].message}</FormHelperText>
                      ) : null}
                    </FormControl>
                  </Stack>
                </Stack>
              </CardContent>

              <Stack direction={'row'} justifyContent={'flex-end'} padding={2}>
                <Button type={'submit'} variant={'contained'} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : submitButtonText}
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </form>

      <Dialog open={successOpen} onClose={handleConfirm}>
        <DialogTitle>修改成功</DialogTitle>
        <DialogContent>
          <DialogContentText>帳戶資料已更新，請重新登錄以使用新帳號或密碼。</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirm} variant='contained'>
            確定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
