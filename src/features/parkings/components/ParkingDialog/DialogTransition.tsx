import { motion, AnimatePresence } from 'framer-motion';

export const DialogTransition = ({ children, open }: { children: React.ReactNode; open: boolean }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
); 