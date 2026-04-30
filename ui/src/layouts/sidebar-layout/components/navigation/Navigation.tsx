import List from '@mui/material/List';
import { NavigationItem } from './components/navigation-item/NavigationItem';
import { NavigationItemType } from './components/navigation-item/types';
import { routes } from '../../../../contants/routes';
import { DashboardOutlined, LocalFloristOutlined, BookmarkBorderOutlined, SpaOutlined } from '@mui/icons-material';
import { useMemo } from 'react';

export function Navigation() {
  const navigationItems: NavigationItemType[] = useMemo(
    () => [
      {
        header: 'Plant AI',
      },
      {
        path: routes.dashboard,
        label: 'Dashboard',
        icon: (props: any) => <DashboardOutlined {...props} />,
      },
      {
        path: routes.flowerRec,
        label: 'Flower Rec',
        icon: (props: any) => <LocalFloristOutlined {...props} />,
      },
      {
        path: routes.collections,
        label: 'My Collection',
        icon: (props: any) => <BookmarkBorderOutlined {...props} />,
      },
      {
        header: 'Plantlighten',
      },
      {
        path: 'http://localhost:8000',
        label: 'Open Plantlighten',
        icon: (props: any) => <SpaOutlined {...props} />,
        external: true,
        description: 'Django plant identification portal',
      },
    ],
    [],
  );

  const navigationItemsList = navigationItems.map((item) => {
    return <NavigationItem key={Object.values(item).toString()} item={item} />;
  });

  return (
    <List sx={{ width: '100%', maxWidth: 360, padding: 2 }} component='nav' aria-labelledby='nested-list-subheader'>
      {navigationItemsList}
    </List>
  );
}
