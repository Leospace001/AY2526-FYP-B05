import { Alert, Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { PageHeader } from '../../components/page-header/PageHeader';
import { useDeleteCollection, useCollections } from '../../hooks/api/use-collection/useCollection';

export default function MyCollectionPage() {
  const { data, isLoading, isError } = useCollections();
  const deleteMutation = useDeleteCollection();

  return (
    <Container maxWidth={false}>
      <PageHeader title={'My Collection'} breadcrumbs={['AI', 'Collections']} />

      {isError ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          Unable to load your collection. Please try again.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        {isLoading ? (
          <Grid item xs={12}>
            <Alert severity='info'>Loading your collected flowers...</Alert>
          </Grid>
        ) : null}

        {!isLoading && data?.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity='info'>You have not collected any flowers yet.</Alert>
          </Grid>
        ) : null}

        {data?.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant='overline' color='text.secondary'>
                    Collected on {new Date(item.collectedAt).toLocaleString()}
                  </Typography>
                  <Typography variant='h5' fontWeight='fontWeightBold'>
                    {item.flowerName}
                  </Typography>
                  <Typography variant='subtitle1' color='text.secondary'>
                    {item.scientificName || 'Scientific name not provided'}
                  </Typography>
                  {item.careInstructionsSummary ? (
                    <Typography variant='body2'>
                      {item.careInstructionsSummary}
                    </Typography>
                  ) : null}
                  <Box>
                    <Button
                      color='error'
                      variant='outlined'
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Remove
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
