import { motion } from 'framer-motion';
import { Typography, Button } from '@mui/material';

interface AppHeaderProps {
  onLogout: () => void;
  title: string;
}

export const AppHeader = ({ onLogout, title }: AppHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Typography variant="h4" className="text-gray-900 dark:text-gray-100">
          {title}
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onLogout}
          variant="contained"
          size="medium"
          className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-700 dark:hover:bg-red-600 dark:text-red-50"
        >
          Déconnexion
        </Button>
      </motion.div>
    </div>
  );
}; 