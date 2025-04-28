import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Importer userEvent
import { Notification } from './Notification';
import { describe, it, expect, vi } from 'vitest';

describe('Notification Component', () => {
  it('should render the message and correct severity when open', () => {
    const handleClose = vi.fn(); // Crée une fonction mock
    const testMessage = "Opération réussie !";

    render(
      <Notification 
        open={true} 
        message={testMessage} 
        severity="success" 
        onClose={handleClose} 
      />
    );

    // Vérifier que le message est affiché
    expect(screen.getByText(testMessage)).toBeInTheDocument();

    // Vérifier que l'alerte avec la bonne sévérité est présente
    // Les Alertes MUI ont un rôle "alert" et des attributs ou classes liés à la sévérité
    // On peut chercher l'élément avec le rôle "alert"
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    
    // On pourrait vérifier plus spécifiquement la sévérité 
    // en inspectant les classes ou l'icône, par exemple :
    // expect(alertElement).toHaveClass('MuiAlert-filledSuccess'); // Attention, dépend de l'implémentation MUI
    // Ou vérifier la présence de l'icône Success (si elle a un titre ou un testid)
    // expect(screen.getByTestId('SuccessOutlinedIcon')).toBeInTheDocument();

  });

  it('should not render the message when open is false', () => {
    const handleClose = vi.fn();
    const testMessage = "Ne devrait pas être visible";

    render(
      <Notification 
        open={false} 
        message={testMessage} 
        severity="info" 
        onClose={handleClose} 
      />
    );

    // Utiliser queryByText pour vérifier l'absence sans erreur
    expect(screen.queryByText(testMessage)).not.toBeInTheDocument();
    // Vérifier aussi l'absence du rôle alert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', async () => {
    const handleClose = vi.fn(); // Mock function pour onClose
    const user = userEvent.setup(); // Initialiser userEvent

    render(
      <Notification 
        open={true} 
        message="Test de fermeture" 
        severity="warning" 
        onClose={handleClose} 
      />
    );

    // Trouver le bouton de fermeture (MUI Alert met un titre "Close" par défaut)
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();

    // Simuler le clic utilisateur
    await user.click(closeButton);

    // Vérifier que la fonction onClose a été appelée une fois
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  // TODO: Ajouter des tests pour open=false et l'appel de onClose
}); 