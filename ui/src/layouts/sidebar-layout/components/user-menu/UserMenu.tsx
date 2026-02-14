import {
  UserMenuContainer,
  UserMenuIconButton,
  UserMenuInfo,
  UserMenuMenu,
  UserMenuMenuItem,
  UserMenuMenuItemWithSeparator,
} from './styled';
import React, { useState } from 'react';
import { Typography } from '@mui/material';
import { User } from '../../../../types/user/userTypes';
import { UserAvatar } from '../../../../components/user-avatar/UserAvatar';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../../contants/routes';

export const UserMenu = ({ user }: { user: User }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  // const handleClose = () => setAnchorEl(null);
  const handleClose = async () => {
    localStorage.removeItem('token');
    //alert('🔒 Logged out successfully');
    navigate(routes.login, { replace: true });
  }
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
          <Typography fontSize={14} color={'text.secondary'}>
            {user.email}
          </Typography>
        </UserMenuInfo>
        <UserMenuMenuItem onClick={handleClose}>Profile</UserMenuMenuItem>
        <UserMenuMenuItem onClick={handleClose}>My account</UserMenuMenuItem>
        <UserMenuMenuItemWithSeparator onClick={handleClose}>Logout</UserMenuMenuItemWithSeparator>
      </UserMenuMenu>
    </UserMenuContainer>
  );
};
