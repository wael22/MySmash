# Documentation des Composants Frontend - Nouveau Système Vidéo

## 📚 Vue d'Ensemble

5 nouveaux composants React + 3 hooks + 1 service pour gérer le nouveau système vidéo PadelVar.

---

## 🎬 Composants Principaux

### 1. NewRecordingModal

**Fichier** : `src/components/player/NewRecordingModal.jsx`

**Description** : Modal complet pour démarrer un enregistrement vidéo

**Props** :
```typescript
interface Props {
  isOpen: boolean;              // État d'ouverture du modal
  onClose: () => void;          // Callback de fermeture
  onVideoCreated?: (data) => void;  // Callback après création vidéo
}
```

**Étapes** :
1. **Setup** : Sélection club, terrain, durée
2. **Recording** : Preview + statut + bouton stop
3. **Complete** : Confirmation de création

**Utilisation** :
```jsx
import NewRecordingModal from '@/components/player/NewRecordingModal';

<NewRecordingModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onVideoCreated={(data) => {
    console.log('Vidéo créée:', data);
    // Rafraîchir liste, notifier, etc.
  }}
/>
```

**Features** :
- ✅ Sélection club depuis clubs suivis
- ✅ Sélection terrain dynamique
- ✅ Configuration durée (1-180 min)
- ✅ Preview temps réel pendant enregistrement
- ✅ Barre de progression
- ✅ Gestion erreurs complète

---

### 2. VideoPreview

**Fichier** : `src/components/player/VideoPreview.jsx`

**Description** : Affiche le flux vidéo en temps réel depuis le proxy

**Props** :
```typescript
interface Props {
  sessionId: string;            // ID de la session
  isRecording?: boolean;        // Afficher indicateur REC (défaut: false)
  mode?: 'mjpeg' | 'snapshot';  // Mode de preview (défaut: 'mjpeg')
}
```

**Modes** :
- **mjpeg** : Stream MJPEG continu (haute qualité, plus de bande passante)
- **snapshot** : Polling de snapshots JPEG à 5 FPS (léger, économique)

**Utilisation** :
```jsx
import VideoPreview from '@/components/player/VideoPreview';

// Stream continu
<VideoPreview 
  sessionId="sess_1_123456"
  isRecording={true}
  mode="mjpeg"
/>

// Polling de snapshots (recommandé pour mobile)
<VideoPreview 
  sessionId="sess_1_123456"
  isRecording={true}
  mode="snapshot"
/>
```

**Features** :
- ✅ Support MJPEG et snapshot
- ✅ Indicateur d'enregistrement (badge REC)
- ✅ Gestion erreurs avec retry (3 tentatives)
- ✅ Affichage session ID
- ✅ Indicateur de mode
- ✅ Health check du proxy
- ✅ Chargement progressif

---

### 3. VideoListNew

**Fichier** : `src/components/player/VideoListNew.jsx`

**Description** : Liste des vidéos enregistrées avec téléchargement et suppression

**Props** :
```typescript
interface Props {
  clubId: number;                  // ID du club
  onVideoDeleted?: (video) => void;  // Callback après suppression
}
```

**Utilisation** :
```jsx
import VideoListNew from '@/components/player/VideoListNew';

<VideoListNew 
  clubId={user.club_id}
  onVideoDeleted={(video) => {
    console.log('Vidéo supprimée:', video);
    // Rafraîchir stats, notifier, etc.
  }}
/>
```

**Features** :
- ✅ Grille responsive (1/2/3 colonnes)
- ✅ Affichage nom fichier, date, taille
- ✅ Bouton téléchargement
- ✅ Bouton suppression (admin) avec confirmation
- ✅ Rafraîchissement manuel
- ✅ États vides et erreurs
- ✅ Formatage dates (date-fns)
- ✅ Formatage tailles (KB/MB/GB)

---

### 4. VideoRecordingDashboardNew

**Fichier** : `src/components/player/VideoRecordingDashboardNew.jsx`

**Description** : Dashboard complet avec 3 onglets

**Props** : Aucune

**Utilisation** :
```jsx
import VideoRecordingDashboardNew from '@/components/player/VideoRecordingDashboardNew';

<VideoRecordingDashboardNew />
```

**Onglets** :
1. **Enregistrer** : Bouton + info pipeline
2. **Mes Vidéos** : Liste avec téléchargement/suppression
3. **Sessions actives** : Monitoring temps réel

**Features** :
- ✅ Santé du système (FFmpeg, sessions, enregistrements)
- ✅ Alerte si enregistrement en cours
- ✅ Info pipeline visuel
- ✅ Liste sessions actives avec détails
- ✅ Rafraîchissement auto toutes les 30s
- ✅ Badges de statut (healthy/dégradé, actif/pause, vérifié)

---

## 🪝 Hooks Personnalisés

### 1. useVideoRecording()

**Fichier** : `src/hooks/useVideoSystem.js`

**Description** : Hook pour gérer un enregistrement vidéo complet

**Retour** :
```typescript
{
  session: VideoSession | null;
  recordingStatus: RecordingStatus | null;
  isRecording: boolean;
  isLoading: boolean;
  error: string | null;
  startRecording: (terrainId, durationMinutes) => Promise<VideoSession>;
  stopRecording: () => Promise<string>;
  reset: () => void;
}
```

**Utilisation** :
```jsx
const {
  session,
  recordingStatus,
  isRecording,
  isLoading,
  error,
  startRecording,
  stopRecording,
  reset
} = useVideoRecording();

// Démarrer
await startRecording(terrainId, 90);

// Statut automatiquement mis à jour
console.log(recordingStatus.progress_percent);

// Arrêter
const videoPath = await stopRecording();
```

**Features** :
- ✅ Polling automatique du statut (toutes les 2s)
- ✅ Gestion erreurs automatique
- ✅ Cleanup automatique au démontage
- ✅ Détection fin d'enregistrement auto

---

### 2. useVideoList()

**Fichier** : `src/hooks/useVideoSystem.js`

**Description** : Hook pour gérer la liste des vidéos

**Params** : `clubId: number`

**Retour** :
```typescript
{
  videos: Video[];
  loading: boolean;
  error: string | null;
  loadVideos: () => Promise<void>;
  deleteVideo: (sessionId) => Promise<void>;
}
```

**Utilisation** :
```jsx
const { videos, loading, error, loadVideos, deleteVideo } = useVideoList(clubId);

// Rafraîchir
await loadVideos();

// Supprimer
await deleteVideo(sessionId);
```

---

### 3. useSystemHealth()

**Fichier** : `src/hooks/useVideoSystem.js`

**Description** : Hook pour vérifier la santé du système vidéo

**Retour** :
```typescript
{
  health: SystemHealth | null;
  loading: boolean;
  checkHealth: () => Promise<void>;
}
```

**Utilisation** :
```jsx
const { health, loading, checkHealth } = useSystemHealth();

// Rafraîchir
await checkHealth();

// Afficher
if (health?.status === 'healthy') {
  console.log('Système OK');
}
```

---

## 🔧 Service

### videoSystemService

**Fichier** : `src/services/videoSystemService.js`

**Description** : Service complet pour le nouveau système vidéo

**Méthodes principales** :

#### Sessions
```javascript
// Créer session
const session = await videoSystemService.createSession(terrainId, cameraUrl);

// Fermer session
await videoSystemService.closeSession(sessionId);

// Lister sessions
const sessions = await videoSystemService.listSessions();
```

#### Enregistrement
```javascript
// Démarrer
await videoSystemService.startRecording(sessionId, durationMinutes);

// Arrêter
const result = await videoSystemService.stopRecording(sessionId);

// Statut
const status = await videoSystemService.getRecordingStatus(sessionId);
```

#### Fichiers
```javascript
// Lister
const videos = await videoSystemService.listVideos(clubId);

// Télécharger
await videoSystemService.downloadVideo(sessionId, clubId);

// Supprimer
await videoSystemService.deleteVideo(sessionId, clubId);
```

#### Preview
```javascript
// URL stream MJPEG
const streamUrl = videoSystemService.getStreamUrl(sessionId);

// URL snapshot JPEG
const snapshotUrl = videoSystemService.getSnapshotUrl(sessionId);

// Infos preview
const info = await videoSystemService.getPreviewInfo(sessionId);
```

#### Health
```javascript
// Santé système
const health = await videoSystemService.checkHealth();

// Cleanup sessions orphelines
await videoSystemService.cleanupSessions();
```

#### Workflows
```javascript
// Workflow complet : Créer + Démarrer
const result = await videoSystemService.startFullRecording(terrainId, 90);

// Workflow complet : Arrêter + Fermer
const videoPath = await videoSystemService.stopFullRecording(sessionId);
```

---

## 🎨 Personnalisation

### Changer les Couleurs

```jsx
// Dans NewRecordingModal.jsx
<Button 
  variant="destructive"  // Changer en "default", "outline", etc.
  className="w-full bg-blue-600 hover:bg-blue-700"  // Custom colors
>
  Arrêter
</Button>
```

### Ajouter des Champs Personnalisés

```jsx
// Dans NewRecordingModal.jsx, étape setup
<div>
  <Label>Titre du match (optionnel)</Label>
  <Input
    value={matchTitle}
    onChange={(e) => setMatchTitle(e.target.value)}
    placeholder="Match amical"
  />
</div>
```

### Modifier la Fréquence de Polling

```jsx
// Dans useVideoRecording hook
statusIntervalRef.current = setInterval(pollStatus, 5000); // 5s au lieu de 2s
```

---

## 📱 Responsive Design

Tous les composants sont **responsive** par défaut :

- **VideoListNew** : Grille 1/2/3 colonnes selon la taille d'écran
- **NewRecordingModal** : Max-width 3xl, scroll vertical si besoin
- **VideoPreview** : Aspect ratio 16:9 maintenu
- **Dashboard** : Layout adaptatif

---

## ✅ Best Practices

### 1. Toujours gérer les erreurs

```jsx
try {
  await videoSystemService.startRecording(sessionId, 90);
} catch (error) {
  // Afficher un toast, alert, etc.
  console.error('Erreur:', error.message);
}
```

### 2. Afficher un loading pendant les opérations

```jsx
{isLoading && <Loader2 className="animate-spin" />}
```

### 3. Vérifier que la session existe avant d'afficher le preview

```jsx
{session && session.session_id && (
  <VideoPreview sessionId={session.session_id} />
)}
```

### 4. Utiliser les hooks pour simplifier

```jsx
// Au lieu de gérer manuellement le polling
const { recordingStatus } = useVideoRecording();

// Le statut est automatiquement mis à jour
```

### 5. Nettoyer les ressources

```jsx
useEffect(() => {
  return () => {
    // Cleanup au démontage
    reset();
  };
}, []);
```

---

## 🎉 Conclusion

Le frontend PadelVar est maintenant **100% compatible** avec le nouveau système vidéo backend.

**Composants prêts** : 5 composants + 3 hooks  
**API adaptée** : Tous les endpoints du nouveau backend  
**Workflow simplifié** : Hooks personnalisés  
**Preview temps réel** : MJPEG stream ou snapshots  

**Prochaine étape** : Intégrer dans votre PlayerDashboard et tester !

---

**Documentation complète** : `FRONTEND_MIGRATION.md`  
**Backend** : Voir docs dans `padelvar-backend-main/`
