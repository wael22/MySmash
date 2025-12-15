# Guide de Déploiement - Système de Clips et Partage Social

## Prérequis

### 1. Installer FFmpeg

FFmpeg est nécessaire pour le découpage des vidéos.

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

#### macOS
```bash
brew install ffmpeg
```

#### Windows
1. Télécharger FFmpeg depuis https://ffmpeg.org/download.html
2. Extraire l'archive
3. Ajouter le dossier `bin` au PATH système
4. Vérifier l'installation: `ffmpeg -version`

#### Vérification
```bash
ffmpeg -version
# Doit afficher la version de FFmpeg
```

---

## Installation Backend

### 1. Migrer la Base de Données

```bash
cd padelvar-backend-main

# Créer la migration
flask db migrate -m "Add user_clip table for manual clips"

# Ou utiliser la migration pré-créée
# Copier migrations/add_user_clip_table.py dans votre dossier migrations/versions/

# Appliquer la migration
flask db upgrade
```

### 2. Vérifier les Services

Les nouveaux fichiers créés:
- `src/models/user.py` - Modèle UserClip ajouté (ligne 289+)
- `src/services/manual_clip_service.py` - Service de découpage
- `src/services/social_share_service.py` - Service de partage
- `src/routes/clip_routes.py` - Routes API
- `src/main.py` - Blueprint enregistré (ligne 46 et 119)

### 3. Tester l'API

```bash
# Démarrer le backend (si pas déjà running)
python app.py

# Tester la route de santé
curl http://localhost:5000/api/health

# Tester la création d'un clip (nécessite authentification)
# Voir examples/test_clip_api.http pour des exemples complets
```

---

## Installation Frontend

### 1. Installer les Dépendances

Vérifier que Slider est installé (normalement inclus avec shadcn/ui):

```bash
cd padelvar-frontend-main

# Si nécessaire, installer le composant Slider
npx shadcn-ui@latest add slider
```

### 2. Fichiers Créés

- `src/services/clipService.js` - Service API
- `src/components/player/VideoClipEditor.jsx` - Éditeur
- `src/components/player/SocialShareModal.jsx` - Partage social
- `src/components/player/ClipsList.jsx` - Liste des clips

### 3. Tester les Composants

Les composants sont autonomes et peuvent être testés individuellement.

---

## Intégration dans l'Application

### Étape 1: Ajouter le Bouton "Créer un Clip"

Modifier le lecteur vidéo existant pour ajouter le bouton:

**Fichier**: `VideoPlayerModal.jsx` (ou votre composant de lecteur)

```jsx
import { useState } from 'react';
import { Scissors } from 'lucide-react';
import VideoClipEditor from './VideoClipEditor';

// Dans votre composant
const [clipEditorOpen, setClipEditorOpen] = useState(false);

// Dans le JSX, ajouter le bouton dans la barre d'outils
<Button
    variant="outline"
    size="sm"
    onClick={() => setClipEditorOpen(true)}
    disabled={!video.is_unlocked}
>
    <Scissors className="h-4 w-4 mr-2" />
    Créer un Clip
</Button>

// Ajouter le modal
<VideoClipEditor
    isOpen={clipEditorOpen}
    onClose={() => setClipEditorOpen(false)}
    video={video}
    onClipCreated={(clip) => {
        console.log('Nouveau clip créé:', clip);
        // Optionnel: rafraîchir la liste des clips
    }}
/>
```

### Étape 2: Ajouter une Page "Mes Clips"

Créer une nouvelle page dans votre navigation:

**Fichier**: `src/pages/MyClips.jsx`

```jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClipsList from '@/components/player/ClipsList';

export default function MyClips() {
    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Mes Clips</CardTitle>
                </CardHeader>
                <CardContent>
                    <ClipsList />
                </CardContent>
            </Card>
        </div>
    );
}
```

### Étape 3: Ajouter dans la Navigation

Ajouter le lien dans votre menu de navigation:

```jsx
import { Scissors } from 'lucide-react';

// Dans votre navigation
<NavLink to="/my-clips">
    <Scissors className="h-4 w-4" />
    Mes Clips
</NavLink>
```

### Étape 4: Ajouter la Route

Dans votre routeur (App.jsx ou routes.jsx):

```jsx
import MyClips from './pages/MyClips';

// Ajouter la route
<Route path="/my-clips" element={<MyClips />} />
```

---

## Tests

### Test 1: Créer un Clip

1. Se connecter à l'application
2. Ouvrir une vidéo déverrouillée
3. Cliquer sur "Créer un Clip"
4. Sélectionner un segment de 10-20 secondes
5. Entrer un titre
6. Cliquer sur "Créer le Clip"
7. Vérifier que le modal affiche "Création en cours"
8. Attendre quelques minutes

### Test 2: Vérifier le Traitement

1. Aller sur "Mes Clips"
2. Vérifier que le clip apparaît avec badge "En traitement"
3. Rafraîchir après quelques minutes
4. Le badge devrait passer à "Prêt"

### Test 3: Partager un Clip

1. Cliquer sur "Partager" sur un clip prêt
2. Tester le partage WhatsApp (sur mobile de préférence)
3. Tester "Copier le lien"
4. Tester le téléchargement

### Test 4: Vérifier Bunny CDN

1. Ouvrir la console Bunny CDN
2. Vérifier que les nouveaux clips apparaissent
3. Vérifier que les URLs fonctionnent

---

## Dépannage

### Erreur: "FFmpeg not found"

**Solution**: FFmpeg n'est pas installé ou pas dans le PATH
```bash
# Vérifier
ffmpeg -version

# Si erreur, réinstaller FFmpeg
```

### Erreur: "Clip processing failed"

**Causes possibles**:
1. Vidéo source inaccessible
2. Format vidéo non supporté
3. Problème de permissions

**Solutions**:
- Vérifier les logs backend
- Vérifier que Bunny CDN est accessible
- Vérifier les permissions du dossier temporaire

### Erreur: "Database migration failed"

**Solution**: 
```bash
# Rollback
flask db downgrade

# Recréer la migration
flask db migrate -m "Add user_clip table"
flask db upgrade
```

### Les clips ne s'affichent pas

**Vérifications**:
1. La migration de la DB a été appliquée
2. Le blueprint est enregistré dans main.py
3. Le service API frontend pointe vers la bonne URL
4. L'utilisateur est bien authentifié

---

## Configuration Avancée

### Modifier la Durée Maximale des Clips

**Backend**: `src/routes/clip_routes.py`
```python
# Ligne ~135
if endTime - startTime > 60:  # Modifier 60 à la valeur souhaitée
```

**Frontend**: `VideoClipEditor.jsx`
```jsx
// Ligne ~212
{clipDuration > 60 && (  // Modifier 60 à la valeur souhaitée
```

### Changer l'URL de Base pour le Partage

**Backend**: `src/services/social_share_service.py`
```python
# Ligne ~19
def __init__(self, app_base_url: str = "https://padelvar.com"):
    # Changer l'URL par défaut
```

### Optimiser la Qualité des Miniatures

**Backend**: `src/services/manual_clip_service.py`
```python
# Ligne ~181
'-q:v', '2',  # Qualité (1-31, 2 = haute qualité)
```

---

## Monitoring

### Vérifier les Clips en Attente

```sql
SELECT COUNT(*) FROM user_clip WHERE status = 'pending';
```

### Clips en Erreur

```sql
SELECT id, title, error_message 
FROM user_clip 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Statistiques de Partage

```sql
SELECT 
    SUM(share_count) as total_shares,
    SUM(download_count) as total_downloads,
    COUNT(*) as total_clips
FROM user_clip 
WHERE status = 'completed';
```

---

## Prochaines Améliorations Possibles

1. **Processing Queue**: Utiliser Celery pour un meilleur contrôle du traitement
2. **Progress Tracking**: WebSockets pour le suivi en temps réel
3. **Trimming Multiple**: Créer plusieurs clips en une fois
4. **Effets**: Ajouter des filtres et transitions
5. **Audio**: Ajouter de la musique de fond
6. **Templates**: Clips prédéfinis (meilleurs moments, résumé, etc.)
7. **Analytics**: Dashboard des clips les plus partagés
8. **Sharing Insights**: Voir sur quelles plateformes les clips sont partagés

---

## Support

En cas de problème:
1. Vérifier les logs backend: `tail -f logs/app.log`
2. Vérifier la console navigateur (F12)
3. Vérifier l'état de Bunny CDN
4. Vérifier que FFmpeg fonctionne

Pour toute question, référer au [walkthrough complet](walkthrough.md).
