import { render, screen } from '@testing-library/react';
import { LoadingBar } from './LoadingBar';
import { describe, it, expect } from 'vitest';

describe('LoadingBar Component', () => {
  it('should render the linear progress bar', () => {
    // Rendre le composant
    render(<LoadingBar />);

    // Vérifier que la barre de progression est présente
    // LinearProgress de MUI a le rôle "progressbar" par défaut
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    
    // Optionnel: Vérifier certaines classes si elles sont cruciales
    // expect(progressBar).toHaveClass('absolute'); 
  });
}); 