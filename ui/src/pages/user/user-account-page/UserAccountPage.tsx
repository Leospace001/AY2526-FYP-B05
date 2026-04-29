import { Box, Card, CardContent, Container, Grid, Typography } from '@mui/material';
import { PageHeader } from '../../../components/page-header/PageHeader';
import React from 'react';
import { UserForm } from '../components/user-form/UserForm';
import { useCurrentUser } from '../../../hooks/api/use-current-user/useCurrentUser';
import { Loader } from '../../../components/loader/Loader';

export default function UserAccountPage() {
  const { data: user, isLoading } = useCurrentUser();

  const defaultValues = user
    ? {
        username: user.username,
        password: '',
      }
    : undefined;

  if (isLoading || !user) return <Loader />;

  return (
    <Container maxWidth='lg'>
      <PageHeader title={'My account'} breadcrumbs={['User', 'My account']} />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} sx={{ mb: 1 }}>
                Account Basic
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.8 }}>
                Basic account information for your Plant AI profile.
              </Typography>
              <Box mt={2}>
                <Typography variant='body2'>
                  <strong>Username:</strong> {user.username}
                </Typography>
                <Typography variant='body2'>
                  <strong>Email:</strong> {user.email}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <UserForm defaultValues={defaultValues} submitButtonText='Save account' />
    </Container>
  );
}
