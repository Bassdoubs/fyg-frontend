import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ImportGuideDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ImportGuideDialog = ({ open, onClose }: ImportGuideDialogProps) => {
  const { isDarkMode } = useDarkMode();

  const handleDownloadExample = () => {
    const exampleData = [
      { 
        airline: 'AFR', 
        airport: 'LFPG', 
        terminal: '2E', 
        gate: 'K40',
        mapUrl: 'https://maps.app.goo.gl/example1',
        mapSource: 'Google Maps'
      },
      { 
        airline: 'BAW', 
        airport: 'EGLL', 
        terminal: '5', 
        gate: 'A10' 
      },
    ];
    
    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Example");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'exemple_import.xlsx');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className={`${isDarkMode ? 'dark' : ''} backdrop-blur-sm`}
      PaperProps={{
        className: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
      }}
    >
      <DialogTitle className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 text-gray-800 dark:text-gray-100">
        Guide d'import
      </DialogTitle>
      
      <DialogContent className="!pt-6 space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400 mb-2">
            Format des fichiers acceptés
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
            <li>CSV (séparateur: virgule)</li>
            <li>Excel (.xlsx)</li>
            <li>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadExample}
                className="mt-2 border-sky-200 text-sky-600 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/30"
              >
                Télécharger un fichier exemple
              </Button>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400 mb-2">
            Structure des données
          </h3>
          <div className="bg-gradient-to-r from-sky-50/50 to-indigo-50/50 dark:from-sky-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-sky-100 dark:border-sky-800/50">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-700 dark:text-gray-200">
                  <th className="pb-2">Colonne</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Exemple</th>
                  <th className="pb-2">Obligatoire</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-300 [&>tr:hover]:bg-white/40 dark:[&>tr:hover]:bg-white/5">
                <tr>
                  <td className="py-2 font-medium">Compagnie (airline)</td>
                  <td>Code ICAO de la compagnie (3 lettres)</td>
                  <td>AFR</td>
                  <td>Oui</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Aéroport (airport)</td>
                  <td>Code ICAO de l'aéroport</td>
                  <td>LFPG</td>
                  <td>Oui</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Terminal</td>
                  <td>Nom du terminal</td>
                  <td>2E</td>
                  <td>Non*</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Porte (gate)</td>
                  <td>Numéro de porte</td>
                  <td>K40</td>
                  <td>Non*</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">URL de la carte (mapUrl)</td>
                  <td>Lien vers Google Maps</td>
                  <td>https://maps.app.goo.gl/exemple</td>
                  <td>Non</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Source de la carte (mapSource)</td>
                  <td>Source ou origine de la carte</td>
                  <td>Google Maps</td>
                  <td>Non</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm mt-3 text-gray-500 dark:text-gray-400">* Au moins un terminal ou une porte doit être spécifié</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400 mb-2">
            Informations sur les cartes
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Les colonnes pour les cartes sont <b>optionnelles</b></li>
            <li>Noms de colonnes acceptés pour l'URL : <code>mapUrl</code>, <code>url_carte</code>, <code>map_url</code>, <code>carte_url</code></li>
            <li>Noms de colonnes acceptés pour la source : <code>mapSource</code>, <code>source_carte</code>, <code>map_source</code>, <code>carte_source</code>, <code>source</code></li>
            <li>Une URL de carte valide est automatiquement détectée</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400 mb-2">
            Règles de validation
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Le code compagnie doit contenir exactement 3 lettres</li>
            <li>L'aéroport est obligatoire (4 caractères)</li>
            <li>La combinaison compagnie/aéroport doit être unique</li>
            <li>Au moins un terminal ou une porte doit être spécifié</li>
            <li>Les champs de carte sont optionnels</li>
          </ul>
        </section>
      </DialogContent>

      <DialogActions className="border-t border-sky-100 dark:border-sky-800/50 p-4 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20">
        <Button 
          onClick={onClose}
          variant="contained"
          className="bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 shadow-sm text-white"
        >
          J'ai compris
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 