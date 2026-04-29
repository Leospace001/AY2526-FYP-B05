import {
  UserMenuContainer,
  UserMenuIconButton,
  UserMenuInfo,
  UserMenuMenu,
  UserMenuMenuItemWithSeparator,
} from './styled';
import React, { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { User } from '../../../../types/user/userTypes';
import { UserAvatar } from '../../../../components/user-avatar/UserAvatar';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../../contants/routes';

export const UserMenu = ({ user }: { user: User }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleClose = async () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    navigate(routes.login, { replace: true });
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <UserMenuContainer>
      <UserMenuIconButton sx={{ padding: 0 }} onClick={handleClick}>
        <UserAvatar src={user.image} />
      </UserMenuIconButton>
      <UserMenuMenu
        id='user-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <UserMenuInfo>
          <Stack spacing={0.5}>
            <Typography fontSize={14} fontWeight={700}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography fontSize={13} color={'text.secondary'}>
              {user.email}
            </Typography>
            <Typography fontSize={12} color={'text.secondary'}>
              @{user.username}
            </Typography>
          </Stack>
        </UserMenuInfo>
        <UserMenuMenuItemWithSeparator
          onClick={() => {
            handleClose();
            navigate(routes.userAccount);
          }}
        >
          My account
        </UserMenuMenuItemWithSeparator>
        <UserMenuMenuItemWithSeparator onClick={handleLogout}>Logout</UserMenuMenuItemWithSeparator>
      </UserMenuMenu>
    </UserMenuContainer>
  );
};
