import { UserMenu } from '../user-menu/UserMenu';
import { Stack } from '@mui/material';
import { useCurrentUser } from '../../../../hooks/api/use-current-user/useCurrentUser';

export const ToolbarElements = () => {
  const { data: user } = useCurrentUser();

  if (!user) return null;
  return (
    <Stack direction={'row'} spacing={2} alignItems={'center'}>
      <UserMenu user={user} />
    </Stack>
  );
};
