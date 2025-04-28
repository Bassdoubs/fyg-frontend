import { Box, Card, CardContent, Typography } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: SvgIconComponent;
  iconColor: string;
  loading?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  loading = false,
  clickable = false,
  onClick 
}: StatsCardProps) => {
  const theme = useTheme();

  return (
    <Card 
      elevation={2}
      sx={{ 
        p: 0, 
        borderRadius: 2,
        height: '100%',
        background: (theme) => theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${iconColor}10, ${iconColor}05)` 
          : `linear-gradient(135deg, ${iconColor}08, ${iconColor}03)`,
        cursor: clickable && onClick ? 'pointer' : 'default',
        '&:hover': {
          boxShadow: clickable && onClick ? '0 4px 20px 0 rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
          transform: clickable && onClick ? 'translateY(-2px)' : 'none'
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', height: '100%', p: 2 }}>
        <Box 
          sx={{ 
            mr: 2, 
            p: 1.5, 
            borderRadius: '12px',
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
              ? `${iconColor}20` 
              : `${iconColor}10`
          }}
        >
          <Icon sx={{ color: iconColor }} fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
            {loading ? '-' : value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 