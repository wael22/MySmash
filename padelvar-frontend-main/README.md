<<<<<<< HEAD
# MySmash Frontend

## Description

MySmash est une application complète pour la gestion des enregistrements vidéo de matchs de padel. Cette partie frontend offre une interface utilisateur intuitive permettant aux joueurs, clubs et administrateurs de gérer leurs enregistrements, vidéos et profils.

## Fonctionnalités principales

- **Authentification sécurisée**
  - Connexion par email/mot de passe
  - Authentification Google
  - Système de récupération de mot de passe
  - Gestion des rôles (joueur, club, administrateur)

- **Dashboard personnalisé**
  - Interface spécifique selon le rôle de l'utilisateur
  - Visualisation des statistiques et des activités récentes

- **Gestion des enregistrements vidéo**
  - Démarrage et arrêt d'enregistrements
  - Suivi en temps réel des enregistrements en cours
  - Compteur de durée d'enregistrement
  - Prolongation des sessions d'enregistrement

- **Bibliothèque de vidéos**
  - Visionnage des vidéos enregistrées
  - Partage de vidéos
  - Gestion des métadonnées (titre, description)
  - Téléchargement des vidéos

- **Système de crédits**
  - Achat de crédits pour les enregistrements
  - Suivi du solde et des transactions

## Prérequis

- Node.js v18+
- npm v9+ ou pnpm v10+
- Un navigateur moderne (Chrome, Firefox, Safari, Edge)

## Installation

1. Clonez le dépôt :
```bash
git clone <repository-url>
cd mysmash-frontend
```

2. Installez les dépendances :
```bash
npm install
# ou avec pnpm
pnpm install
```

3. Configurez les variables d'environnement :
```bash
# Créez un fichier .env à partir du modèle
cp .env.example .env
# Modifiez les valeurs selon votre environnement
```

4. Démarrez le serveur de développement :
```bash
npm run dev
# ou avec pnpm
pnpm dev
```

## Structure du projet

```
mysmash-frontend/
├── public/              # Fichiers statiques
├── src/
│   ├── assets/          # Images, icônes et autres ressources
│   ├── components/      # Composants React réutilisables
│   │   ├── auth/        # Composants d'authentification
│   │   ├── ui/          # Composants d'interface utilisateur
│   │   ├── player/      # Composants spécifiques aux joueurs
│   │   ├── club/        # Composants spécifiques aux clubs
│   │   └── admin/       # Composants spécifiques aux administrateurs
│   ├── hooks/           # Hooks React personnalisés
│   ├── lib/             # Utilitaires et fonctions d'aide
│   ├── pages/           # Pages principales de l'application
│   ├── App.jsx          # Composant racine de l'application
│   ├── index.css        # Styles globaux
│   └── main.jsx         # Point d'entrée de l'application
├── components.json      # Configuration shadcn/ui
├── eslint.config.js     # Configuration ESLint
├── vite.config.js       # Configuration Vite
└── package.json         # Dépendances et scripts
```

## Fonctionnalités d'authentification

### Connexion standard
Utilisez votre email et mot de passe pour vous connecter à votre compte.

### Récupération de mot de passe
Si vous avez oublié votre mot de passe :
1. Cliquez sur le lien "Mot de passe oublié ?" sur la page de connexion
2. Entrez votre adresse email
3. Suivez les instructions reçues par email pour réinitialiser votre mot de passe

### Connexion avec Google
Pour une connexion rapide et sécurisée, utilisez le bouton "Continuer avec Google".

## Gestion des enregistrements vidéo

### Démarrer un enregistrement
1. Accédez à la page des terrains disponibles
2. Sélectionnez le terrain souhaité
3. Définissez la durée d'enregistrement
4. Cliquez sur "Démarrer l'enregistrement"

### Suivre un enregistrement en cours
Le dashboard affiche en temps réel :
- Le temps écoulé et restant
- Une barre de progression visuelle
- Les options pour prolonger ou arrêter l'enregistrement

## Développement

### Commandes disponibles

- `npm run dev` : Démarre le serveur de développement
- `npm run build` : Construit l'application pour la production
- `npm run preview` : Prévisualise la version de production localement
- `npm run lint` : Exécute ESLint pour vérifier le code

### Ajout de nouveaux composants UI

Ce projet utilise [shadcn/ui](https://ui.shadcn.com/) pour les composants d'interface utilisateur. Pour ajouter un nouveau composant :

```bash
npx shadcn-ui add [component-name]
```

## Déploiement

Pour déployer l'application en production :

1. Construisez l'application :
```bash
npm run build
```

2. Testez la version de production localement :
```bash
npm run preview
```

3. Déployez le contenu du dossier `dist` sur votre serveur web ou plateforme d'hébergement.

## Troubleshooting

### Erreurs communes

1. **Problème de connexion à l'API**
   - Vérifiez que la variable d'environnement `VITE_API_URL` est correctement configurée
   - Assurez-vous que le serveur backend est en cours d'exécution

2. **Erreurs de chargement des composants**
   - Si vous rencontrez des erreurs concernant des packages manquants, exécutez `npm install` ou `pnpm install`
   - Pour les erreurs d'importation de composants UI, vérifiez que vous avez correctement installé shadcn/ui

3. **Problèmes d'authentification**
   - Effacez les cookies et le localStorage du navigateur
   - Vérifiez que les services d'authentification sont correctement configurés

## Contribution

1. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
2. Committez vos changements (`git commit -m 'Add some amazing feature'`)
3. Poussez vers la branche (`git push origin feature/amazing-feature`)
4. Ouvrez une Pull Request

## Contact

Pour toute question ou suggestion concernant l'application PadelVar, veuillez contacter l'équipe de développement.
=======
# mysmash-frontend-main
>>>>>>> 3962e368ce19b7e94365910c9868e7b11889d08c
