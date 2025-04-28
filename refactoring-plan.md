# Plan de Refactoring : Séparation Frontend / Backend

## Objectif

Résoudre les problèmes persistants de build CSS (Tailwind/PostCSS) sur Railway en séparant le monorepo actuel en deux projets distincts : un pour le frontend (React/Vite) et un pour le backend (Node.js/Express). Cela simplifiera également le déploiement et clarifiera l'architecture.

## Étapes Détaillées

1.  **Créer les Dossiers Locaux :**
    *   Créer deux nouveaux dossiers au même niveau que le projet actuel : `fyg-frontend` et `fyg-backend`.

2.  **Déplacer les Fichiers :**
    *   **Backend (`fyg-backend`) :**
        *   Copier le contenu complet de `server/` dans `fyg-backend/`.
        *   Copier le contenu complet de `packages/shared/` dans `fyg-backend/shared/`.
        *   Copier le `.gitignore` racine (si pertinent).
    *   **Frontend (`fyg-frontend`) :**
        *   Copier tout le contenu de la racine du projet actuel **SAUF** `server/`, `packages/`, et `.git/`.

3.  **Adapter `package.json` Frontend (`fyg-frontend/package.json`) :**
    *   Supprimer les scripts liés au serveur (`dev:server`, `dev:all`).
    *   Supprimer la dépendance `devDependencies` `"@fyg/shared": "workspace:*"`.
    *   Vérifier que `tailwindcss`, `postcss`, `autoprefixer` sont dans `dependencies`.
    *   Vérifier que le script `build` est `"vite build"`.

4.  **Créer/Adapter `package.json` Backend (`fyg-backend/package.json`) :**
    *   Copier `server/package.json` (original) à la racine de `fyg-backend/` et renommer en `package.json`.
    *   Ajouter `"type": "module"` si absent.
    *   Modifier les imports de `@fyg/shared` dans le code backend pour utiliser des chemins relatifs vers le dossier `shared/` copié (ex: `from './shared/dist/types.js'`).
    *   Vérifier le script `start` (ex: `"node index.js"`).
    *   Ajouter les dépendances éventuelles du code partagé.

5.  **Git et GitHub :**
    *   Pour `fyg-backend` : `git init`, `git add .`, `git commit`, créer un **nouveau** dépôt GitHub, ajouter remote, `git push`.
    *   Pour `fyg-frontend` : `git init`, `git add .`, `git commit`, créer un **autre nouveau** dépôt GitHub, ajouter remote, `git push`.

6.  **Configurer Services Railway :**
    *   Dans le projet Railway existant, créer **deux nouveaux services** via "Deploy from GitHub repo".
    *   **Service Backend :** Lier au dépôt `find-your-gate-backend`. Laisser Railway détecter (Node.js).
    *   **Service Frontend :** Lier au dépôt `find-your-gate-frontend`. Laisser Railway détecter (Vite).
        *   Vérifier les paramètres de build du service frontend : commande `pnpm run build` (ou `npm run build`), dossier de publication `dist`.
    *   **Supprimer l'ancien service** basé sur le Dockerfile monorepo une fois les nouveaux fonctionnels.

7.  **Variables d'Environnement (Railway) :**
    *   **Backend :** Ajouter `MONGODB_URI`, `JWT_SECRET`, etc. Ajouter `CORS_ORIGIN` avec l'URL publique du service frontend.
    *   **Frontend :** Ajouter `VITE_CESIUM_TOKEN`. Ajouter `VITE_API_BASE_URL` avec l'URL publique du service backend.

8.  **Configurer CORS Backend :**
    *   Dans le code `fyg-backend` (ex: `index.js`), utiliser le middleware `cors` avec l'option `origin: process.env.CORS_ORIGIN`.
    *   Commiter et pusher ce changement dans le dépôt backend.

9.  **Tester :**
    *   Accéder à l'URL du service frontend.
    *   Vérifier le design et l'absence d'erreurs (console, réseau).

## Développement Local Post-Séparation

*   **Lancement :** Utiliser deux terminaux :
    *   Terminal 1 (dans `fyg-frontend`): `pnpm dev`
    *   Terminal 2 (dans `fyg-backend`): `pnpm dev`
*   **Éditeur :** Utiliser un "Multi-root Workspace" (VS Code/Codium) pour ouvrir les deux dossiers (`fyg-frontend` et `fyg-backend`) simultanément.
*   **Configuration Locale :**
    *   Maintenir la configuration `server.proxy` dans `fyg-frontend/vite.config.ts` pour pointer vers le backend local.
    *   Configurer CORS dans le backend local pour autoriser les requêtes du frontend local (ex: `http://localhost:5173`). 