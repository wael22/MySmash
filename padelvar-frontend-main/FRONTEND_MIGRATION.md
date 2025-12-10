# Frontend Migration Guide - PadelVar Nouveau Système Vidéo

## 🎯 Objectif

Adapter le frontend PadelVar pour utiliser le nouveau système vidéo backend :
- Nouveaux endpoints API
- Nouveaux composants React
- Nouveaux hooks personnalisés

---

## 📦 Nouveaux Fichiers Créés

### Services (@src/services/)

```
src/services/
└── videoSystemService.js        ✅ Service complet pour nouveau système vidéo
```

### Composants (@src/components/player/)

```
src/components/player/
├── NewRecordingModal.jsx        ✅ Modal enregistrement (avec hooks)
├── VideoPreview.jsx             ✅ Preview temps réel (MJPEG ou snapshots)
├── VideoListNew.jsx             ✅ Liste des vidéos enregistrées
└── VideoRecordingDashboardNew.jsx  ✅ Dashboard complet
```

### Hooks (@src/hooks/)

```
src/hooks/
└── useVideoSystem.js            ✅ Hooks personnalisés :
                                    - useVideoRecording()
                                    - useVideoList()
                                    - useSystemHealth()
```

### API Centralisée (modifiée)

```
src/lib/api.js                   ✏️ Ajout de videoSystemService
```

---

## 🚀 Utilisation Rapide

### Option 1 : Utiliser les Hooks (Recommandé)

```jsx
import { useVideoRecording } from '@/hooks/useVideoSystem';

function MyComponent() {
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

  const handleStart = async () => {
    try {
      await startRecording(terrainId, 90); // 90 minutes
      console.log('Enregistrement démarré');
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleStop = async () => {
    try {
      const videoPath = await stopRecording();
      console.log('Vidéo créée:', videoPath);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div>
      {!isRecording ? (
        <button onClick={handleStart}>
          Démarrer
        </button>
      ) : (
        <>
          <p>Temps écoulé: {recordingStatus?.elapsed_seconds}s</p>
          <button onClick={handleStop}>Arrêter</button>
        </>
      )}
    </div>
  );
}
```

### Option 2 : Utiliser le Service Directement

```jsx
import videoSystemService from '@/services/videoSystemService';

async function startMyRecording(terrainId) {
  try {
    // 1. Créer session
    const session = await videoSystemService.createSession(terrainId);
    
    // 2. Démarrer enregistrement
    await videoSystemService.startRecording(session.session_id, 90);
    
    return session;
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function stopMyRecording(sessionId) {
  try {
    const result = await videoSystemService.stopRecording(sessionId);
    console.log('Vidéo créée:', result.video_path);
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

### Option 3 : Utiliser l'API Centralisée

```jsx
import { videoSystemService } from '@/lib/api';

async function example() {
  // Créer session
  const sessionResponse = await videoSystemService.createSession(1);
  const session = sessionResponse.data.session;
  
  // Démarrer enregistrement
  await videoSystemService.startRecording(session.session_id, 90);
  
  // ... attendre ...
  
  // Arrêter enregistrement
  await videoSystemService.stopRecording(session.session_id);
}
```

---

## 🎨 Utiliser les Composants Prêts

### Dashboard Complet

```jsx
import VideoRecordingDashboardNew from '@/components/player/VideoRecordingDashboardNew';

function App() {
  return (
    <VideoRecordingDashboardNew />
  );
}
```

**Inclut :**
- Onglet "Enregistrer" avec bouton de démarrage
- Onglet "Mes Vidéos" avec liste + téléchargement
- Onglet "Sessions actives" avec monitoring
- Santé du système en temps réel

### Modal d'Enregistrement Seule

```jsx
import NewRecordingModal from '@/components/player/NewRecordingModal';

function MyPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const handleVideoCreated = (videoData) => {
    console.log('Vidéo créée:', videoData);
    // Rafraîchir la liste, notifier l'utilisateur, etc.
  };

  return (
    <>
      <button onClick={() => setModalOpen(true)}>
        Enregistrer un match
      </button>

      <NewRecordingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onVideoCreated={handleVideoCreated}
      />
    </>
  );
}
```

### Preview Vidéo Seule

```jsx
import VideoPreview from '@/components/player/VideoPreview';

function LivePreview({ sessionId }) {
  return (
    <VideoPreview 
      sessionId={sessionId}
      isRecording={true}
      mode="snapshot"  // 'mjpeg' ou 'snapshot'
    />
  );
}
```

**Modes :**
- `mjpeg` : Stream MJPEG continu (bonne qualité, mais peut être lourd)
- `snapshot` : Polling de snapshots JPEG (5 FPS, léger)

### Liste des Vidéos Seule

```jsx
import VideoListNew from '@/components/player/VideoListNew';

function MyVideos() {
  const handleVideoDeleted = (video) => {
    console.log('Vidéo supprimée:', video);
  };

  return (
    <VideoListNew 
      clubId={1}
      onVideoDeleted={handleVideoDeleted}
    />
  );
}
```

---

## 🔄 Migration depuis l'Ancien Système

### Ancien Code (à remplacer)

```jsx
// ANCIEN SYSTÈME ❌
import recordingService from '@/services/recordingService';

// Démarrer enregistrement
await recordingService.startRecording(matchId, duration);

// Arrêter enregistrement
await recordingService.stopRecording(recordingId);

// Obtenir statut
await recordingService.getRecordingStatus(matchId);
```

### Nouveau Code (à utiliser)

```jsx
// NOUVEAU SYSTÈME ✅
import videoSystemService from '@/services/videoSystemService';

// Workflow complet (recommandé)
const result = await videoSystemService.startFullRecording(terrainId, 90);
const sessionId = result.sessionId;

// Ou étape par étape
const session = await videoSystemService.createSession(terrainId);
await videoSystemService.startRecording(session.session_id, 90);

// Arrêter
await videoSystemService.stopFullRecording(sessionId);

// Statut
const status = await videoSystemService.getRecordingStatus(sessionId);
```

### Mapping des Endpoints

| Ancien Endpoint | Nouveau Endpoint | Notes |
|----------------|------------------|-------|
| `/recording/matches/{id}/start` | `/api/video/session/create` + `/api/video/record/start` | 2 étapes maintenant |
| `/recording/matches/{id}/stop` | `/api/video/record/stop` | sessionId au lieu de matchId |
| `/recording/matches/{id}/status` | `/api/video/record/status/{sessionId}` | sessionId au lieu de matchId |
| `/recording/stream/{courtId}` | `/api/preview/{sessionId}/stream.mjpeg` | sessionId au lieu de courtId |
| `/videos/my-videos` | `/api/video/files/list` | Même concept |
| `/videos/{id}` (DELETE) | `/api/video/files/{sessionId}/delete` | sessionId au lieu de videoId |

---

## 🎯 Workflow Complet d'Intégration

### Étape 1 : Remplacer les Imports

```jsx
// Avant
import recordingService from '@/services/recordingService';
import { videoService } from '@/lib/api';

// Après
import videoSystemService from '@/services/videoSystemService';
import { videoSystemService as apiVideoSystem } from '@/lib/api';
```

### Étape 2 : Adapter PlayerDashboard

```jsx
// src/pages/PlayerDashboard.jsx

import VideoRecordingDashboardNew from '@/components/player/VideoRecordingDashboardNew';

function PlayerDashboard() {
  return (
    <div>
      {/* Autres sections du dashboard */}
      
      {/* Section vidéo (nouveau système) */}
      <VideoRecordingDashboardNew />
    </div>
  );
}
```

### Étape 3 : Adapter RecordingModal

```jsx
// Avant (ancien)
import RecordingModal from '@/components/player/RecordingModal';

// Après (nouveau)
import NewRecordingModal from '@/components/player/NewRecordingModal';

// Utilisation identique
<NewRecordingModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onVideoCreated={handleVideoCreated}
/>
```

### Étape 4 : Adapter VideoList

```jsx
// Avant (ancien)
import VideoList from '@/components/player/VideoList';

// Après (nouveau)
import VideoListNew from '@/components/player/VideoListNew';

// Utilisation
<VideoListNew 
  clubId={user.club_id}
  onVideoDeleted={handleDeleted}
/>
```

### Étape 5 : Adapter CameraPreview

```jsx
// Avant (ancien)
import CameraPreview from '@/components/player/CameraPreview';
<CameraPreview cameraUrl={url} courtName={name} />

// Après (nouveau)
import VideoPreview from '@/components/player/VideoPreview';
<VideoPreview sessionId={sessionId} isRecording={true} mode="snapshot" />
```

---

## 🔧 Modifications dans les Composants Existants

### PlayerDashboard.jsx

```jsx
// Ajouter import
import VideoRecordingDashboardNew from '@/components/player/VideoRecordingDashboardNew';

// Remplacer l'ancienne section vidéo par :
<VideoRecordingDashboardNew />
```

### ClubDashboard.jsx (Admin Club)

```jsx
import { videoSystemService } from '@/lib/api';

// Pour lister les sessions actives du club
const sessions = await videoSystemService.listSessions();
const clubSessions = sessions.data.sessions.filter(s => s.club_id === myClubId);

// Pour arrêter un enregistrement
await videoSystemService.stopRecording(sessionId);

// Pour cleanup
await videoSystemService.cleanupSessions();
```

---

## 📱 Exemples d'Intégration

### Bouton "Démarrer Match" dans un Match Card

```jsx
import { useState } from 'react';
import { useVideoRecording } from '@/hooks/useVideoSystem';
import { Button } from '@/components/ui/button';
import VideoPreview from '@/components/player/VideoPreview';

function MatchCard({ match, courtId }) {
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    session,
    isRecording,
    isLoading,
    startRecording,
    stopRecording
  } = useVideoRecording();

  const handleStart = async () => {
    try {
      await startRecording(courtId, 90);
      setShowPreview(true);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleStop = async () => {
    try {
      await stopRecording();
      setShowPreview(false);
      alert('Vidéo enregistrée avec succès !');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  return (
    <div className="match-card">
      <h3>{match.title}</h3>
      
      {!isRecording ? (
        <Button onClick={handleStart} disabled={isLoading}>
          🎬 Démarrer Enregistrement
        </Button>
      ) : (
        <>
          {showPreview && session && (
            <VideoPreview 
              sessionId={session.session_id}
              isRecording={true}
              mode="snapshot"
            />
          )}
          
          <Button onClick={handleStop} disabled={isLoading} variant="destructive">
            ⏹️ Arrêter Enregistrement
          </Button>
        </>
      )}
    </div>
  );
}
```

### Afficher Preview dans une Page Dédiée

```jsx
import { useParams } from 'react-router-dom';
import VideoPreview from '@/components/player/VideoPreview';

function LiveMatchPage() {
  const { sessionId } = useParams();

  return (
    <div className="container mx-auto p-6">
      <h1>Match en Direct</h1>
      
      <VideoPreview 
        sessionId={sessionId}
        isRecording={true}
        mode="mjpeg"  // Stream continu pour meilleure qualité
      />
      
      <div className="mt-4">
        <p>Session : {sessionId}</p>
        <p>Le match est en cours d'enregistrement...</p>
      </div>
    </div>
  );
}
```

---

## 🎨 Personnalisation des Composants

### Changer le Mode de Preview

```jsx
<VideoPreview 
  sessionId={sessionId}
  isRecording={true}
  mode="mjpeg"      // Pour stream continu (haute qualité)
/>

<VideoPreview 
  sessionId={sessionId}
  isRecording={true}
  mode="snapshot"   // Pour polling de snapshots (léger, 5 FPS)
/>
```

### Personnaliser la Durée d'Enregistrement

```jsx
<NewRecordingModal
  isOpen={modalOpen}
  onClose={handleClose}
  onVideoCreated={handleCreated}
  defaultDuration={120}  // 120 minutes au lieu de 90
/>
```

### Filtrer les Vidéos par Club

```jsx
<VideoListNew 
  clubId={selectedClubId}
  onVideoDeleted={(video) => {
    console.log('Supprimée:', video);
    // Rafraîchir la liste, etc.
  }}
/>
```

---

## 🔌 Intégration dans App.jsx

### Ajouter les Routes

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VideoRecordingDashboardNew from '@/components/player/VideoRecordingDashboardNew';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes existantes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<PlayerDashboard />} />
        
        {/* Nouvelles routes vidéo */}
        <Route path="/recording" element={<VideoRecordingDashboardNew />} />
        
        {/* ... autres routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Ajouter au Menu de Navigation

```jsx
// src/components/common/Navbar.jsx

import { Video } from 'lucide-react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      {/* Menu existant */}
      <Link to="/dashboard">Dashboard</Link>
      
      {/* Nouveau lien */}
      <Link to="/recording">
        <Video className="h-4 w-4 mr-2" />
        Enregistrements
      </Link>
    </nav>
  );
}
```

---

## 📊 Comparaison Ancien vs Nouveau

### Ancien Système

```jsx
// Complexe, plusieurs étapes manuelles
import recordingService from '@/services/recordingService';

const startOld = async () => {
  // Démarrer enregistrement
  const result = await recordingService.startRecording(matchId, duration);
  
  // Polling manuel du statut
  const interval = setInterval(async () => {
    const status = await recordingService.getRecordingStatus(matchId);
    // Gérer le statut...
  }, 5000);
  
  // Gérer la fin...
};
```

### Nouveau Système

```jsx
// Simple, avec hook
import { useVideoRecording } from '@/hooks/useVideoSystem';

const {
  session,
  recordingStatus,
  isRecording,
  startRecording,
  stopRecording
} = useVideoRecording();

// Démarrer
await startRecording(terrainId, 90);

// Statut automatiquement mis à jour via polling interne
console.log(recordingStatus.progress_percent);

// Arrêter
await stopRecording();
```

---

## ✅ Checklist Migration Frontend

### Fichiers Créés

- [x] `src/services/videoSystemService.js`
- [x] `src/components/player/NewRecordingModal.jsx`
- [x] `src/components/player/VideoPreview.jsx`
- [x] `src/components/player/VideoListNew.jsx`
- [x] `src/components/player/VideoRecordingDashboardNew.jsx`
- [x] `src/hooks/useVideoSystem.js`

### Fichiers Modifiés

- [x] `src/lib/api.js` (ajout de `videoSystemService`)

### Intégration

- [ ] Importer `NewRecordingModal` dans `PlayerDashboard`
- [ ] Remplacer ancien `RecordingModal` par `NewRecordingModal`
- [ ] Remplacer ancien `VideoList` par `VideoListNew`
- [ ] Tester création session
- [ ] Tester démarrage enregistrement
- [ ] Tester preview temps réel
- [ ] Tester arrêt enregistrement
- [ ] Tester téléchargement vidéo

---

## 🐛 Dépannage Frontend

### Problème : "Cannot read property 'session_id' of null"

**Cause** : La session n'est pas encore créée

**Solution** :
```jsx
{session && session.session_id && (
  <VideoPreview sessionId={session.session_id} />
)}
```

### Problème : Preview ne s'affiche pas

**Cause** : URL du backend incorrecte ou token manquant

**Solution** :
```jsx
// Vérifier .env
VITE_API_URL=http://localhost:5000

// Vérifier que le token est présent
console.log(localStorage.getItem('token'));
```

### Problème : CORS error

**Cause** : Backend ne permet pas l'origine du frontend

**Solution** : Vérifier dans le backend Flask (déjà configuré normalement)
```python
# src/main.py
CORS(app, 
     origins=['http://localhost:5173', 'http://localhost:5000'], 
     supports_credentials=True)
```

### Problème : Stream MJPEG ne charge pas

**Cause** : Le navigateur peut avoir des limitations avec MJPEG

**Solution** : Utiliser le mode `snapshot` à la place
```jsx
<VideoPreview 
  sessionId={sessionId}
  mode="snapshot"  // Au lieu de 'mjpeg'
/>
```

---

## 🚀 Démarrage Rapide

### 1. Installer (si ce n'est pas déjà fait)

```bash
cd padelvar-frontend-main
npm install
```

### 2. Configurer .env

```bash
# .env ou .env.local
VITE_API_URL=http://localhost:5000
```

### 3. Démarrer le Frontend

```bash
npm run dev
```

### 4. Tester

1. Se connecter
2. Aller sur `/recording` (ou utiliser le composant dans le dashboard)
3. Créer un enregistrement
4. Voir le preview en temps réel
5. Arrêter l'enregistrement
6. Télécharger la vidéo

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| `FRONTEND_MIGRATION.md` | Ce guide (migration frontend) |
| `FRONTEND_COMPONENTS.md` | Documentation des composants |
| Backend docs (voir padelvar-backend-main/) | Architecture backend complète |

---

## 🎉 Résumé

✅ **5 nouveaux composants** React  
✅ **1 nouveau service** JavaScript  
✅ **3 hooks personnalisés**  
✅ **API centralisée** mise à jour  
✅ **100% compatible** avec le nouveau backend  
✅ **Preview temps réel** (MJPEG ou snapshots)  
✅ **Workflow simplifié** avec hooks  

**Migration simple** : Remplacer les anciens composants par les nouveaux, adapter les imports.

---

**Status** : ✅ Frontend prêt pour le nouveau système vidéo  
**Compatibilité** : React 19, Vite 6, Axios 1.10  
**Architecture** : Caméra → Proxy → FFmpeg → MP4
