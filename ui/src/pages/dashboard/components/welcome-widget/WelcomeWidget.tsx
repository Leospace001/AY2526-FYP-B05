import { WelcomeWidgetContainer, WelcomeWidgetContent } from './styled';
import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../../contants/routes';

interface WelcomeWidgetProps {
  title: string;
  description: string;
}

export const WelcomeWidget = ({ title, description }: WelcomeWidgetProps) => {
  const navigate = useNavigate();

  return (
    <WelcomeWidgetContainer>
      <WelcomeWidgetContent>
        <Typography variant={'h3'} fontWeight={'fontWeightBold'}>
          {title}
        </Typography>
        <Typography variant={'body1'} mb={1}>
          {description}
        </Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap'>
          <Button color={'primary'} variant={'outlined'} size={'small'} onClick={() => navigate(routes.flowerRec)}>
            View Plant Insights
          </Button>
          <Button color={'secondary'} variant={'contained'} size={'small'} onClick={() => window.open('http://localhost:8000', '_blank', 'noopener,noreferrer')}>
            Open Plantlighten
          </Button>
        </Stack>
      </WelcomeWidgetContent>
    </WelcomeWidgetContainer>
  );
};
