import React, { useState } from 'react';
import { Typography, Container, Paper, Box, Divider, Tabs, Tab } from '@mui/material';
import AirportAdminTable from '../components/AirportAdminTable';
import AirlineAdminTable from '../components/AirlineAdminTable';
// Importer le nouveau composant
import AirlineLogoManager from '../components/AirlineLogoManager'; 
// Importer le composant renommé
import UserManagementPanel from '../components/UserManagementPanel';

// Fonction utilitaire pour les panneaux d'onglets (pour l'accessibilité)
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}> {/* Ajouter un peu de padding en haut */}
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminPage = () => {
  const [tabValue, setTabValue] = useState(0); // 0: Aéroports, 1: Compagnies, 2: Logos, 3: Validation Comptes

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Envelopper tout dans un Box pour les onglets */}
      <Box sx={{ width: '100%' }}>
         {/* Barre d'onglets */}
         <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="Onglets d'administration">
              <Tab label="Aéroports" {...a11yProps(0)} />
              <Tab label="Compagnies Aériennes" {...a11yProps(1)} />
              <Tab label="Gestion Logos" {...a11yProps(2)} />
              <Tab label="Gestion Utilisateurs" {...a11yProps(3)} />
            </Tabs>
          </Box>

         {/* Panneau pour les Aéroports */}
         <TabPanel value={tabValue} index={0}>
            <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 2, // Moins arrondi
                  mt: 0 // Padding géré par TabPanel
                }}
              >
              <AirportAdminTable />
           </Paper>
         </TabPanel>

         {/* Panneau pour les Compagnies */}
         <TabPanel value={tabValue} index={1}>
            <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 2,
                  mt: 0
                }}
              >
              <AirlineAdminTable />
            </Paper>
         </TabPanel>

         {/* Panneau pour la Gestion des Logos */}
         <TabPanel value={tabValue} index={2}>
            <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 2,
                  mt: 0
                }}
              >
               {/* Afficher le composant de gestion des logos */}
               <AirlineLogoManager /> 
            </Paper>
         </TabPanel>

         {/* Panneau pour la Gestion des Utilisateurs */}
         <TabPanel value={tabValue} index={3}>
            {/* Utiliser le composant renommé */}
            <UserManagementPanel />
         </TabPanel>

      </Box>

      {/* Le Divider et les Paper séparés sont maintenant gérés par les onglets */}
      {/* <Divider sx={{ my: 4 }} /> */}
      {/* <Paper ...> <AirlineAdminTable /> </Paper> */}

      {/* Placeholder non nécessaire maintenant */}
      {/* ... */}

    </Container>
  );
};

export default AdminPage; 