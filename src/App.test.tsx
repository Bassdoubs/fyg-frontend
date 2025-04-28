// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App'; // Assurez-vous que le chemin vers votre composant App est correct
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom'; // Pour gérer le routing
import { Provider } from 'react-redux'; // Pour gérer le store Redux
import { store } from './store'; // Assurez-vous que le chemin vers votre store est correct

describe('App Component', () => {
  it('renders the main application component without crashing', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
    // Vous pouvez ajouter une assertion plus spécifique ici si vous savez
    // quel élément doit toujours être présent, par ex:
    // expect(screen.getByRole('banner')).toBeInTheDocument(); // Si vous avez un header avec role="banner"
    // Ou juste vérifier qu'aucune erreur n'a été lancée pendant le rendu.
    expect(true).toBe(true); // Test basique pour s'assurer qu'il n'y a pas eu de crash
  });
}); 