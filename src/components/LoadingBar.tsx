import { LinearProgress } from '@mui/material';

export const LoadingBar = () => (
  <LinearProgress 
    className="absolute top-0 left-0 right-0 h-1 bg-brand-100 dark:bg-gray-700"
    classes={{
      bar: 'bg-brand-500 dark:bg-brand-400'
    }}
  />
); 