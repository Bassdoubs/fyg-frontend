import { Button } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useRef, useState } from 'react';
import type { Parking } from '../../../../types/parking';
import { ImportDialog } from '../ImportDialog';

interface ImportButtonProps {
  onImport: (data: Array<Omit<Parking, '_id'>>) => Promise<{
    status: 'success' | 'partial';
    summary: { total: number; inserted: number; duplicates: number };
    duplicateDetails: any[];
  }>;
  className?: string;
}

export const ImportButton = ({ onImport, className }: ImportButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    event.target.value = ''; // Reset input
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        onClick={handleClick}
        className={`bg-brand-500 hover:bg-brand-600 ${className}`}
      >
        Importer
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.xlsx"
        className="hidden"
      />
      {selectedFile && (
        <ImportDialog
          open={true}
          onClose={() => setSelectedFile(null)}
          file={selectedFile}
          onImport={onImport}
        />
      )}
    </>
  );
}; 