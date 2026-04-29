import { Box, Button, Card, CardContent, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CollectionsBookmarkOutlinedIcon from '@mui/icons-material/CollectionsBookmarkOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/page-header/PageHeader';
import { routes } from '../../contants/routes';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container maxWidth={false}>
      <PageHeader title={'Plant AI Insights'} />

      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.14) 0%, rgba(27, 94, 32, 0.06) 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(76, 175, 80, 0.22), transparent 28%), radial-gradient(circle at bottom left, rgba(156, 204, 101, 0.18), transparent 24%)',
            pointerEvents: 'none',
          }}
        />
        <CardContent sx={{ position: 'relative', p: { xs: 3, md: 5 } }}>
          <Stack spacing={3} maxWidth={820}>
            <Chip
              icon={<AutoAwesomeOutlinedIcon />}
              label='Plant AI Analysis'
              color='success'
              variant='outlined'
              sx={{ width: 'fit-content', fontWeight: 700, letterSpacing: 0.6 }}
            />
            <Box>
              <Typography variant='h3' sx={{ fontWeight: 800, mb: 1 }}>
                Welcome to Plant AI Insights
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 680, lineHeight: 1.8 }}>
                Discover AI-powered flower recommendations, manage your favorite plants, and explore a calm,
                focused workspace built for botanical intelligence.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant='contained' size='large' startIcon={<RocketLaunchOutlinedIcon />} onClick={() => navigate(routes.flowerRec)}>
                View Plant Insights
              </Button>
              <Button variant='outlined' size='large' startIcon={<CollectionsBookmarkOutlinedIcon />} onClick={() => navigate(routes.collections)}>
                Open My Collection
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='overline' color='text.secondary'>
                Quick Access
              </Typography>
              <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
                Start a new flower recommendation
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Use the Flower Rec page to get a tailored botanical suggestion in a few clicks.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='overline' color='text.secondary'>
                System Status
              </Typography>
              <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
                Core services are ready
              </Typography>
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <Chip label='Gemini AI: Ready' color='success' variant='outlined' />
                <Chip label='Collection Service: Active' color='primary' variant='outlined' />
                <Chip label='Demo Mode: Available' color='warning' variant='outlined' />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
