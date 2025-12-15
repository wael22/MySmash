# 🎬 Système de Création de Clips et Partage Social

## Vue d'ensemble

Système complet permettant aux joueurs de créer des clips personnalisés de leurs vidéos de matchs et de les partager facilement sur les réseaux sociaux (WhatsApp, Facebook, Instagram, TikTok, Twitter).

## ✨ Fonctionnalités

### Pour les Utilisateurs
- ✂️ **Découpage précis** avec timeline interactive
- ▶️ **Prévisualisation** en temps réel du segment sélectionné
- 🎯 **Validation automatique** (durée 1-60 secondes)
- 📤 **Partage multi-plateformes** en un clic
- 📥 **Téléchargement** direct des clips
- 📊 **Statistiques** de partages et téléchargements
- 🔒 **Gestion de permissions** (clips privés)

### Pour les Développeurs
- 🚀 **API RESTful** complète
- 🎨 **Composants React** réutilisables
- 🔄 **Traitement asynchrone** non-bloquant
- 📦 **Service modulaire** facile à intégrer
- 🔐 **Sécurité** JWT et validation

## 📁 Structure du Projet

```
padelvar-backend-main/
├── src/
│   ├── models/
│   │   └── user.py                    # Modèle UserClip (ligne 289+)
│   ├── services/
│   │   ├── manual_clip_service.py     # Service de découpage
│   │   └── social_share_service.py    # Service de partage
│   ├── routes/
│   │   └── clip_routes.py             # Routes API /api/clips/*
│   └── main.py                         # Enregistrement du blueprint
├── migrations/
│   └── add_user_clip_table.py         # Migration DB
└── test_clips_system.py                # Tests automatisés

padelvar-frontend-main/
├── src/
│   ├── services/
│   │   └── clipService.js             # Service API
│   └── components/player/
│       ├── VideoClipEditor.jsx         # Éditeur de clips
│       ├── SocialShareModal.jsx        # Modal de partage
│       └── ClipsList.jsx               # Liste des clips
└── INTEGRATION_EXAMPLES.jsx            # Exemples d'intégration
```

## 🚀 Démarrage Rapide

### 1. Installation

```bash
# Backend: Migrer la base de données
cd padelvar-backend-main
flask db upgrade

# Vérifier que FFmpeg est installé
ffmpeg -version
```

### 2. Intégration Frontend

Dans votre lecteur vidéo, ajoutez:

```jsx
import VideoClipEditor from '@/components/player/VideoClipEditor';

const [clipEditorOpen, setClipEditorOpen] = useState(false);

// Ajouter le bouton
<Button onClick={() => setClipEditorOpen(true)}>
    Créer un Clip
</Button>

// Ajouter le modal
<VideoClipEditor
    isOpen={clipEditorOpen}
    onClose={() => setClipEditorOpen(false)}
    video={video}
    onClipCreated={(clip) => console.log('Clip créé:', clip)}
/>
```

### 3. Test

```bash
# Backend
cd padelvar-backend-main
python test_clips_system.py

# Frontend
cd padelvar-frontend-main
npm run dev
```

## 📚 Documentation

- **[Guide de Déploiement](../DEPLOYMENT_GUIDE.md)** - Installation complète
- **[Plan d'Implémentation](../implementation_plan.md)** - Détails techniques
- **[Walkthrough](../walkthrough.md)** - Fonctionnement complet
- **[Exemples d'Intégration](../padelvar-frontend-main/INTEGRATION_EXAMPLES.jsx)** - Code prêt à l'emploi

## 🔌 API Endpoints

### Clips

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/clips/create` | Créer un clip |
| GET | `/api/clips/<id>` | Détails d'un clip |
| GET | `/api/clips/video/<video_id>` | Clips d'une vidéo |
| GET | `/api/clips/my-clips` | Mes clips |
| DELETE | `/api/clips/<id>` | Supprimer un clip |
| POST | `/api/clips/<id>/share` | Liens de partage |
| POST | `/api/clips/<id>/download` | Tracker téléchargement |
| GET | `/api/clips/<id>/meta` | Meta tags Open Graph |

### Exemples

#### Créer un Clip

```bash
curl -X POST http://localhost:5000/api/clips/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": 1,
    "start_time": 10.5,
    "end_time": 30.8,
    "title": "Mon meilleur point",
    "description": "Description optionnelle"
  }'
```

#### Obtenir les Liens de Partage

```bash
curl -X POST http://localhost:5000/api/clips/123/share \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Réponse:
```json
{
  "success": true,
  "share_links": {
    "whatsapp": "https://wa.me/?text=...",
    "facebook": "https://www.facebook.com/sharer/...",
    "twitter": "https://twitter.com/intent/tweet/...",
    "email": "mailto:?subject=...",
    "direct_url": "https://cdn.bunny.net/...",
    "page_url": "https://padelvar.com/clips/123"
  }
}
```

## 🎨 Composants React

### VideoClipEditor

Éditeur de clips avec timeline interactive.

**Props:**
- `isOpen` (boolean) - État du modal
- `onClose` (function) - Fermeture du modal
- `video` (object) - Vidéo source
- `onClipCreated` (function) - Callback après création

**Exemple:**
```jsx
<VideoClipEditor
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    video={currentVideo}
    onClipCreated={(clip) => {
        console.log('Nouveau clip:', clip);
        showNotification('Clip créé avec succès!');
    }}
/>
```

### SocialShareModal

Modal de partage sur les réseaux sociaux.

**Props:**
- `isOpen` (boolean) - État du modal
- `onClose` (function) - Fermeture du modal
- `clip` (object) - Clip à partager

**Exemple:**
```jsx
<SocialShareModal
    isOpen={shareOpen}
    onClose={() => setShareOpen(false)}
    clip={selectedClip}
/>
```

### ClipsList

Liste des clips avec actions.

**Props:**
- `videoId` (number, optionnel) - Filtrer par vidéo
- `onRefresh` (function) - Callback après action

**Exemple:**
```jsx
<ClipsList 
    videoId={123}
    onRefresh={() => console.log('Clips mis à jour')}
/>
```

## 🔧 Configuration

### Durée Maximale des Clips

Par défaut: 60 secondes

**Backend** (`clip_routes.py`):
```python
if endTime - startTime > 60:  # Modifier ici
    return jsonify({'error': 'Max 60 seconds'}), 400
```

**Frontend** (`VideoClipEditor.jsx`):
```jsx
{clipDuration > 60 && (  // Modifier ici
    <Alert variant="destructive">Durée max: 60s</Alert>
)}
```

### URL de Base pour le Partage

**Backend** (`social_share_service.py`):
```python
def __init__(self, app_base_url: str = "https://padelvar.com"):
    self.app_base_url = app_base_url
```

### Qualité des Miniatures

**Backend** (`manual_clip_service.py`):
```python
'-q:v', '2',  # 1-31, plus bas = meilleure qualité
```

## 🐛 Dépannage

### "FFmpeg not found"

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Télécharger: https://ffmpeg.org/download.html
# Ajouter au PATH système
```

### Les clips restent en "pending"

**Causes:**
1. FFmpeg non installé
2. Vidéo source inaccessible
3. Problème de permissions

**Vérifications:**
```bash
# Logs backend
tail -f logs/app.log

# Tester FFmpeg
ffmpeg -version

# Vérifier la DB
SELECT * FROM user_clip WHERE status = 'pending';
```

### Erreur "Access denied"

Un utilisateur ne peut créer/modifier que ses propres clips.

**Vérifier:**
- Token JWT valide
- user_id correspond au propriétaire de la vidéo

## 📊 Monitoring

### Requêtes SQL Utiles

```sql
-- Clips en attente de traitement
SELECT COUNT(*) FROM user_clip WHERE status = 'pending';

-- Clips en échec
SELECT id, title, error_message 
FROM user_clip 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

-- Statistiques de partage
SELECT 
    SUM(share_count) as total_shares,
    SUM(download_count) as total_downloads,
    COUNT(*) as total_clips
FROM user_clip 
WHERE status = 'completed';

-- Top 10 des clips les plus partagés
SELECT id, title, share_count, download_count
FROM user_clip
WHERE status = 'completed'
ORDER BY share_count DESC
LIMIT 10;
```

## 🔒 Sécurité

- ✅ Authentification JWT requise
- ✅ Validation des propriétaires
- ✅ Validation des durées (1-60s)
- ✅ Protection CSRF
- ✅ Sanitization des inputs
- ✅ Rate limiting (TODO)

## 🚀 Améliorations Futures

- [ ] **Queue Processing** avec Celery
- [ ] **WebSockets** pour suivi en temps réel
- [ ] **Effets vidéo** (slow motion, filtres)
- [ ] **Audio** (musique de fond)
- [ ] **Templates** de clips prédéfinis
- [ ] **Analytics** avancées
- [ ] **Clips collaboratifs** (partage entre utilisateurs)
- [ ] **Export multi-formats** (vertical pour Stories)

## 📝 Changelog

### v1.0.0 (2025-12-13)

#### Ajouté
- ✨ Création de clips manuels avec timeline
- ✨ Partage sur 6 plateformes (WhatsApp, Facebook, Twitter, Email, Instagram, TikTok)
- ✨ Composants React modernes
- ✨ API REST complète
- ✨ Tracking des partages/téléchargements
- ✨ Meta tags Open Graph
- ✨ Instructions pour Instagram/TikTok

#### Technique
- 🔧 Service FFmpeg pour découpage
- 🔧 Upload automatique Bunny CDN
- 🔧 Traitement asynchrone
- 🔧 Migration de base de données
- 🔧 Tests automatisés

## 🤝 Contribution

Pour contribuer:
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📧 Support

Pour toute question:
1. Consulter la [documentation](../walkthrough.md)
2. Vérifier les [exemples](../padelvar-frontend-main/INTEGRATION_EXAMPLES.jsx)
3. Lancer les [tests](test_clips_system.py)

## 📄 Licence

Ce projet fait partie de PadelVar.

---

**Fait avec ❤️ pour la communauté Padel**
