# MySmash 🎾

**MySmash** - Plateforme de Padel professionnelle pour la gestion de vidéos de matchs, réservations de terrains et système de crédits.

## 🚀 Fonctionnalités

- 📹 **Enregistrement de matchs** - Système vidéo complet avec highlights automatiques
- 💳 **Système de crédits** - Gestion des crédits pour déverrouiller les vidéos
- 🏢 **Gestion de clubs** - Interface dédiée pour les clubs de padel
- 👤 **Profils joueurs** - Tableau de bord personnalisé pour les joueurs
- 🎬 **Highlights automatiques** - Génération automatique des meilleurs moments

## 📁 Structure du projet

```
MySmash/
├── padelvar-frontend-main/    # Application React (Frontend)
├── padelvar-backend-main/     # API Flask (Backend)
└── README.md
```

## 🔧 Technologies

### Frontend
- React 19
- Vite 6
- TailwindCSS
- React Router

### Backend
- Python Flask
- SQLAlchemy
- JWT Authentication
- Video Processing

## 🏁 Démarrage rapide

### Backend
```bash
cd padelvar-backend-main
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd padelvar-frontend-main
npm install
npm run dev
```

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@mysmash.com | admin123 |
| Club | club@mysmash.com | club123 |
| Player | player@mysmash.com | player123 |

## 📝 License

Propriétaire - MySmash 2024
