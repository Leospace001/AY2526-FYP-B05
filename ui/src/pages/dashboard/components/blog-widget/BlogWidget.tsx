import { BlogWidgetContainer, BlogWidgetContent } from './styled';
import { Button, Typography } from '@mui/material';

export const BlogWidget = () => {
  return (
    <BlogWidgetContainer>
      <BlogWidgetContent>
        <Typography variant={'body2'} textTransform={'uppercase'}>
          AI botanical news
        </Typography>
        <Typography variant={'h4'} fontWeight={'fontWeightBold'}>
          The Role of AI in Sustainable Agriculture
        </Typography>
        <Typography variant={'body1'} mb={1}>
          Discover how machine intelligence helps predict plant stress, improve irrigation planning, and support greener growing practices.
        </Typography>
        <Button color={'primary'} variant={'outlined'} size={'small'}>
          Read more
        </Button>
      </BlogWidgetContent>
    </BlogWidgetContainer>
  );
};
