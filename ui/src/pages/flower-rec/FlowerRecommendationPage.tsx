import { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, Step, StepLabel, Stepper, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import { PageHeader } from '../../components/page-header/PageHeader';
import {
  FlowerRecommendationRequest,
  useFlowerRecommendation,
} from '../../hooks/api/use-flower-recommendation/useFlowerRecommendation';
import { useAddCollection } from '../../hooks/api/use-collection/useCollection';

const steps = ['Flower Basics', 'Usage & Traits', 'Review & Submit'];
const speciesOptions = ['Rose', 'Lily', 'Tulip', 'Orchid', 'Sunflower', 'Hydrangea', 'Lavender', 'Succulent'];
const colorOptions = ['Red', 'White', 'Yellow', 'Pink', 'Purple', 'Blue', 'Orange', 'Mixed'];
const usageOptions = ['Gift', 'Home Decor', 'Wedding', 'Gardening', 'Office', 'Anniversary'];
const traitOptions = ['Fragrant', 'Low Maintenance', 'Pet Friendly', 'Sun Loving', 'Shade Loving', 'Long Lasting'];

type ChipSelectProps = {
  label: string;
  options: string[];
  value: string | string[];
  multiple?: boolean;
  onChange: (nextValue: string | string[]) => void;
};

function ChipSelect({ label, options, value, multiple = false, onChange }: ChipSelectProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const toggleValue = (option: string) => {
    if (multiple) {
      const next = selectedValues.includes(option)
        ? selectedValues.filter((item) => item !== option)
        : [...selectedValues, option];
      onChange(next);
      return;
    }

    onChange(selectedValues.includes(option) ? '' : option);
  };

  return (
    <Box>
      <Typography variant='subtitle2' sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
        {options.map((option) => {
          const selected = selectedValues.includes(option);
          return (
            <Chip
              key={option}
              label={option}
              clickable
              onClick={() => toggleValue(option)}
              variant={selected ? 'filled' : 'outlined'}
              color={selected ? 'primary' : 'default'}
              sx={{
                borderRadius: 999,
                px: 1,
                py: 0.5,
                fontWeight: 600,
                ...(selected
                  ? {
                      boxShadow: 'none',
                    }
                  : {
                      bgcolor: 'background.paper',
                    }),
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

export default function FlowerRecommendationPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [species, setSpecies] = useState('');
  const [color, setColor] = useState('');
  const [usage, setUsage] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const recommendationMutation = useFlowerRecommendation();
  const addCollectionMutation = useAddCollection();

  const payload: FlowerRecommendationRequest = useMemo(
    () => ({
      species,
      color,
      usage,
      traits,
    }),
    [species, color, usage, traits],
  );

  const goNext = () => {
    if (activeStep === 0 && (!species.trim() || !color.trim())) {
      setError('Please select both species and color before continuing.');
      return;
    }
    if (activeStep === 1 && (!usage.trim() || traits.length === 0)) {
      setError('Please select usage and at least one trait before continuing.');
      return;
    }
    setError('');
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setError('');
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');
    try {
      await recommendationMutation.mutateAsync(payload);
    } catch (e: any) {
      const backendError = e?.response?.data?.error;
      const responseMessage = typeof e?.response?.data === 'string' ? e.response.data : undefined;
      const message =
        backendError || responseMessage || e?.message || 'Recommendation request failed. Please try again.';
      setError(message);
    }
  };

  const handleAddToCollection = async () => {
    if (!recommendationMutation.data) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    setError('');
    setSuccessMessage('');
    try {
      await addCollectionMutation.mutateAsync({
        flowerName: recommendationMutation.data.flower_name,
        scientificName: recommendationMutation.data.scientific_name,
        careInstructionsSummary: recommendationMutation.data.care_instructions,
      });
      setSuccessMessage('Added to your collection.');
    } catch (e: any) {
      setError(e?.message || 'Failed to add flower to collection.');
    }
  };

  const isDemoMode = Boolean(recommendationMutation.data?.demo_mode);

  return (
    <Container>
      <PageHeader title={'Flower Recommendation'} breadcrumbs={['AI', 'Flower Rec']} />

      <Box component={Card} sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Card>
        <CardContent>
          {error ? (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert severity='success' sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          ) : null}

          {isDemoMode ? (
            <Alert severity='info' icon={<PsychologyAltIcon fontSize='inherit' />} sx={{ mb: 2, alignItems: 'center' }}>
              Demo mode is active because Gemini is temporarily unavailable.
            </Alert>
          ) : null}

          {activeStep === 0 ? (
            <Stack spacing={2}>
              <ChipSelect label='Preferred Species' options={speciesOptions} value={species} onChange={(next) => setSpecies(String(next))} />
              <ChipSelect label='Preferred Color' options={colorOptions} value={color} onChange={(next) => setColor(String(next))} />
            </Stack>
          ) : null}

          {activeStep === 1 ? (
            <Stack spacing={2}>
              <ChipSelect label='Usage' options={usageOptions} value={usage} onChange={(next) => setUsage(String(next))} />
              <ChipSelect
                label='Traits'
                options={traitOptions}
                value={traits}
                multiple
                onChange={(next) => setTraits(Array.isArray(next) ? next : [])}
              />
            </Stack>
          ) : null}

          {activeStep === 2 ? (
            <Stack spacing={1}>
              <Typography variant='body1'>
                <strong>Species:</strong> {payload.species || 'unspecified'}
              </Typography>
              <Typography variant='body1'>
                <strong>Color:</strong> {payload.color || 'unspecified'}
              </Typography>
              <Typography variant='body1'>
                <strong>Usage:</strong> {payload.usage || 'unspecified'}
              </Typography>
              <Typography variant='body1'>
                <strong>Traits:</strong> {payload.traits.length > 0 ? payload.traits.join(', ') : 'none'}
              </Typography>
            </Stack>
          ) : null}

          <Stack direction='row' justifyContent='space-between' sx={{ mt: 3 }}>
            <Button variant='outlined' onClick={goBack} disabled={activeStep === 0}>
              Back
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button variant='contained' onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button
                variant='contained'
                onClick={handleSubmit}
                disabled={recommendationMutation.isPending}
              >
                {recommendationMutation.isPending ? 'Generating...' : 'Get Recommendation'}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {recommendationMutation.data ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant='h5' sx={{ mb: 1 }}>
                  {recommendationMutation.data.flower_name}
                </Typography>
                <Typography variant='subtitle1' color='text.secondary'>
                  {recommendationMutation.data.scientific_name}
                </Typography>
              </Box>
              <Typography variant='body1'>{recommendationMutation.data.recommendation_reason}</Typography>
              <Alert severity='info'>{recommendationMutation.data.care_instructions}</Alert>
              <Button
                variant='contained'
                startIcon={<FavoriteBorderIcon />}
                onClick={handleAddToCollection}
                disabled={addCollectionMutation.isPending}
              >
                {addCollectionMutation.isPending ? 'Adding...' : 'Add to Collection'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Container>
  );
}
