// src/components/guards/AuthGuard.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/api/use-current-user/useCurrentUser';
import { Loader } from '../../components/loader/Loader';
import { routes } from '../../contants/routes';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const { data: user, isLoading, isError } = useCurrentUser(Boolean(token));

  if (!token) {
    return <Navigate to={routes.login} replace />;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !user) {
    localStorage.removeItem('token');
    return <Navigate to={routes.login} replace />;
  }

  return <>{children}</>;
};
