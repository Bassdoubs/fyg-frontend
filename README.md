# Find Your Gate

Application web pour la gestion de la base de données des parkings d'aéroport par compagnie aérienne. Vise à terme à permettre aux pilotes (simulateur/réel) de trouver facilement leur porte attribuée.

## Structure du Projet (Monorepo Pnpm Workspaces)

Ce projet utilise [pnpm workspaces](https://pnpm.io/workspaces) pour gérer un monorepo contenant :

*   `/` (client) : L'application frontend React (Vite, TypeScript, Material UI, Redux Toolkit).
*   `/server` : L'API backend Node.js (Express, TypeScript, Mongoose, Zod).
*   `/packages/shared` : Un package partagé pour les types et potentiellement les utilitaires communs entre le client et le serveur.

## Prérequis

*   [Node.js](https://nodejs.org/) (Version LTS recommandée)
*   [pnpm](https://pnpm.io/installation) (Gestionnaire de paquets)
*   [MongoDB](https://www.mongodb.com/try/download/community) (Base de données NoSQL) - Doit être en cours d'exécution.

## Installation et Configuration

1.  **Cloner le dépôt :**
    ```bash
    git clone <url-du-repo>
    cd find-your-gate
    ```

2.  **Installer les dépendances :**
    Utilise `pnpm` à la racine pour installer les dépendances de tous les workspaces et créer les liens :
    ```bash
    pnpm install
    ```

3.  **Configurer les variables d'environnement (Backend) :**
    *   Naviguez dans le dossier `server`.
    *   Copiez le fichier `.env.example` (s'il existe, sinon créez un fichier `.env`).
    *   Modifiez le fichier `.env` avec vos propres valeurs, notamment :
        *   `MONGODB_URI`: L'URI de connexion à votre instance MongoDB.
        *   `PORT`: Le port sur lequel le serveur backend écoutera (défaut: 3000).
        *   `JWT_SECRET`: Une chaîne de caractères aléatoire et sécurisée pour signer les tokens JWT.
        *   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Vos identifiants Cloudinary pour l'upload d'images (logos, cartes).
        *   `API_KEY`: Une clé d'API secrète pour la communication avec le bot Discord (si applicable).
        *   `CLIENT_URL`: L'URL de votre application frontend en production (pour la configuration CORS).

## Lancement de l'Application

*   **Lancer le client ET le serveur (développement) :**
    Depuis la racine du projet :
    ```bash
    pnpm run dev:all
    ```
    Ceci lancera le client Vite et le serveur Node (avec nodemon) en parallèle. Le client sera généralement accessible sur `http://localhost:5173` et le serveur sur `http://localhost:3000` (ou les ports configurés).

*   **Lancer uniquement le client (développement) :**
    Depuis la racine :
    ```bash
    pnpm --filter=client dev
    ```
    (Ou `pnpm run dev`)

*   **Lancer uniquement le serveur (développement) :**
    Depuis la racine :
    ```bash
    pnpm --filter=fyg-server dev
    ```
    (Ou `pnpm run dev:server`)

## Build pour la Production

*   **Builder le client :**
    ```bash
    pnpm --filter=client build
    ```
    Les fichiers seront générés dans le dossier `dist` à la racine.

*   **Builder le package partagé :**
    ```bash
    pnpm --filter=@fyg/shared build
    ```

*   **Builder le serveur :**
    (Un script `build` spécifique au serveur pourrait être ajouté si nécessaire, par exemple pour une transpilation TypeScript si le serveur n'utilise pas directement `ts-node` ou similaire en production).

## Qualité du Code (Linting & Formatage)

*   **ESLint** et **Prettier** sont configurés pour assurer la cohérence du code.
*   Un **hook pre-commit** (via Husky et lint-staged) est en place :
    *   Il exécute automatiquement ESLint et Prettier sur les fichiers modifiés avant chaque commit.
    *   Le commit échouera si des erreurs de linting non corrigeables automatiquement sont détectées.
*   Vous pouvez lancer manuellement le linting (depuis la racine) :
    ```bash
    # Pour le client (si défini dans son package.json)
    pnpm --filter=client lint

    # Pour le serveur (si défini dans son package.json)
    pnpm --filter=fyg-server lint
    ```

## Technologies Principales

*   **Frontend :** React 19, Vite, TypeScript, Redux Toolkit, Material UI, Tailwind CSS, Axios, Recharts
*   **Backend :** Node.js, Express, Mongoose, Zod, JWT, Bcrypt, Cloudinary, node-cron
*   **Base de Données :** MongoDB
*   **Outils :** pnpm Workspaces, ESLint, Prettier, Husky, lint-staged, Concurrently
