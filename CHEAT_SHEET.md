# 🎾 PadelVar Video System - Cheat Sheet

## ⚡ Commandes Rapides

### Démarrer Backend
```bash
cd padelvar-backend-main && python -m flask run
```

### Démarrer Frontend
```bash
cd padelvar-frontend-main && npm run dev
```

### Tester Système
```bash
./test_system.sh
```

### Health Check
```bash
curl http://localhost:5000/api/video/health
```

---

## 📡 API Endpoints (Copier-Coller)

### Créer Session
```bash
curl -X POST http://localhost:5000/api/video/session/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"terrain_id": 1}'
```

### Démarrer Enregistrement
```bash
curl -X POST http://localhost:5000/api/video/record/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "sess_1_123456", "duration_minutes": 90}'
```

### Statut
```bash
curl http://localhost:5000/api/video/record/status/sess_1_123456 \
  -H "Authorization: Bearer $TOKEN"
```

### Arrêter
```bash
curl -X POST http://localhost:5000/api/video/record/stop \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "sess_1_123456"}'
```

### Liste Vidéos
```bash
curl http://localhost:5000/api/video/files/list?club_id=1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎨 Code Frontend (Copier-Coller)

### Hook Simple
```jsx
import { useVideoRecording } from '@/hooks/useVideoSystem';

const { session, isRecording, startRecording, stopRecording } = useVideoRecording();

// Start
await startRecording(terrainId, 90);

// Stop
await stopRecording();
```

### Composant Complet
```jsx
import NewRecordingModal from '@/components/player/NewRecordingModal';

<NewRecordingModal
  isOpen={open}
  onClose={() => setOpen(false)}
  onVideoCreated={(data) => console.log('Créée:', data)}
/>
```

### Preview
```jsx
import VideoPreview from '@/components/player/VideoPreview';

<VideoPreview sessionId={id} isRecording={true} mode="snapshot" />
```

### Liste Vidéos
```jsx
import VideoListNew from '@/components/player/VideoListNew';

<VideoListNew clubId={clubId} onVideoDeleted={handleDelete} />
```

---

## 📁 Fichiers Essentiels

### Backend
```
src/video_system/              (7 fichiers Python)
src/routes/video*.py           (2 fichiers routes)
src/main.py                    (modifié)
```

### Frontend
```
src/services/videoSystemService.js
src/components/player/NewRecordingModal.jsx
src/components/player/VideoPreview.jsx
src/hooks/useVideoSystem.js
src/lib/api.js                 (modifié)
```

---

## 🔧 Config

### Backend
```bash
export FFMPEG_PATH=ffmpeg
export PROXY_BASE_PORT=8080
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

---

## 🐛 Debug Express

### Backend pas accessible
```bash
curl http://localhost:5000/api/video/health
# Si erreur : vérifier que backend tourne
```

### FFmpeg not found
```bash
sudo apt install ffmpeg
ffmpeg -version
```

### Preview vide
```jsx
// Essayer mode snapshot
<VideoPreview sessionId={id} mode="snapshot" />
```

### CORS error
```bash
# Vérifier .env frontend
cat .env  # Doit être : VITE_API_URL=http://localhost:5000
```

---

## 📚 Docs

**Démarrer** : @README.md  
**Backend** : @padelvar-backend-main/QUICKSTART.md  
**Frontend** : @padelvar-frontend-main/FRONTEND_MIGRATION.md  
**Intégrer** : @padelvar-frontend-main/INTEGRATION_EXAMPLES.md  
**Architecture** : @ARCHITECTURE_VISUAL.md  

---

## ✅ Validation Rapide

```bash
# 1. Backend health
curl http://localhost:5000/api/video/health

# 2. Frontend accessible
curl http://localhost:5173

# 3. Login et tester workflow dans navigateur
```

---

## 🎯 Pipeline

```
Caméra → video_proxy_server.py → FFmpeg → MP4 → React
```

---

**33 fichiers créés | ~9440 lignes | 142 pages de doc | Production Ready ✅**
