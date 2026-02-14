// src/components/guards/AuthGuard.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/api/use-current-user/useCurrentUser'; // Adjust path if needed
import { Loader } from '../../components/loader/Loader'; // Adjust path if needed
import { routes } from '../../contants/routes'; // Adjust path if needed

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <Loader />;
  }

  if (user) {};

  const token = localStorage.getItem("token");
  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to={routes.login} replace />;
  }

  return <>{children}</>;
};