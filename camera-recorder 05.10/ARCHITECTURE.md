# Architecture Détaillée - Camera Recorder

## Vue d'ensemble

Cette application suit une architecture en couches avec séparation claire des responsabilités:

```
┌─────────────────────────────────────────┐
│         Frontend (Browser)              │
│    HTML + CSS + JavaScript + Canvas     │
└────────────┬────────────────────────────┘
             │ HTTP/WebSocket
┌────────────▼────────────────────────────┐
│         FastAPI Backend                 │
│    Endpoints REST + WebSocket           │
└────┬────────────┬─────────────┬─────────┘
     │            │             │
┌────▼─────┐ ┌───▼─────┐  ┌────▼────────┐
│ Session  │ │Preview  │  │ Recording   │
│ Manager  │ │ Manager │  │ Manager     │
└────┬─────┘ └───┬─────┘  └────┬────────┘
     │           │              │
     │      ┌────▼──────┐       │
     │      │ OpenCV    │       │
     │      │ Capture   │       │
     │      └───────────┘       │
     │                          │
┌────▼──────────────────────────▼─────────┐
│         Proxy Manager                   │
│   MediaMTX (RTSP) + go2rtc (MJPEG)     │
└────────────────┬────────────────────────┘
                 │
         ┌───────▼────────┐
         │ Camera Sources │
         │ (RTSP/MJPEG)   │
         └────────────────┘
```

## Modules Backend

### 1. `app/config.py`
**Responsabilité:** Gestion de la configuration

- Chargement de `config.json`
- Validation des paramètres
- Valeurs par défaut
- Singleton `config` exporté

**Paramètres clés:**
- `max_sessions`: Limite de sessions simultanées
- `mediamtx_port`: Port RTSP MediaMTX (8554)
- `go2rtc_port`: Port RTSP go2rtc (8555)
- `ffmpeg_path`: Chemin FFmpeg
- Paramètres de qualité et timeouts

### 2. `app/proxy_manager.py`
**Responsabilité:** Gestion des proxys RTSP locaux

**Composants:**
- **MediaMTX:** Proxy RTSP pour sources RTSP
  - Téléchargement automatique si absent
  - Génération config `mediamtx.yml`
  - Démarrage/arrêt du processus
  - Port 8554 par défaut

- **go2rtc:** Convertisseur MJPEG → RTSP
  - Téléchargement automatique si absent
  - Génération config `go2rtc.yaml`
  - API dynamique pour ajout/retrait streams
  - Port 8555 par défaut

**Méthodes principales:**
- `ensure_binaries()`: Télécharge les binaires si nécessaire
- `start_mediamtx()`: Démarre MediaMTX
- `start_go2rtc()`: Démarre go2rtc
- `add_go2rtc_stream()`: Ajoute un flux MJPEG
- `remove_go2rtc_stream()`: Retire un flux
- `cleanup()`: Arrête tous les proxys

### 3. `app/session_manager.py`
**Responsabilité:** Gestion du cycle de vie des sessions caméra

**Structure de données:**
```python
@dataclass
class CameraSession:
    session_id: str              # UUID unique
    source_url: str              # URL source originale
    source_type: str             # "rtsp" ou "mjpeg"
    local_rtsp_url: str          # URL RTSP locale (proxy)
    created_at: datetime
    recording: bool              # État enregistrement
    recording_process: Optional  # Processus FFmpeg
    preview_active: bool         # État prévisualisation
```

**Flux de création de session:**
1. Vérifier limite max_sessions
2. Détection type source (RTSP/MJPEG)
3. Configuration du proxy approprié:
   - RTSP → MediaMTX (8554)
   - MJPEG → go2rtc (8555)
4. Vérification du flux (OpenCV)
5. Création objet CameraSession
6. Retour session_id + local_rtsp_url

**Vérification du flux:**
- Tentative d'ouverture via OpenCV
- Lecture de N frames (configurable, défaut 10)
- Timeout (configurable, défaut 5s)
- 3 tentatives maximum
- Exception si échec

### 4. `app/preview.py`
**Responsabilité:** Streaming vidéo en temps réel via WebSocket

**Classe `PreviewStreamer`:**
- Capture via OpenCV sur RTSP local
- Encodage JPEG (qualité configurable)
- Envoi WebSocket en base64
- **Pas de drop intentionnel:** Backpressure via `await send()`

**Format message WebSocket:**
```json
{
  "type": "frame",
  "data": "<base64_jpeg>",
  "timestamp": 1234567890.123,
  "frame_number": 42
}
```

**Gestion d'erreurs:**
- Compteur d'erreurs consécutives
- Arrêt après 10 erreurs
- Libération propre de VideoCapture
- Mise à jour état session

### 5. `app/recording.py`
**Responsabilité:** Enregistrement vidéo via FFmpeg

**Commande FFmpeg (VFR):**
```bash
ffmpeg -i <rtsp_local> -t <durée> \
  -c:v libx264 -preset veryfast -crf 23 \
  -c:a aac -b:a 128k \
  -y output.mp4
```

**Caractéristiques:**
- **VFR préservé:** Pas de `-vf fps=` ni `-vsync`
- Audio AAC si présent
- Sortie MP4 compatible Windows
- Nommage: `{session_id}_{timestamp}.mp4`

**Gestion processus Windows:**
- `CREATE_NEW_PROCESS_GROUP` pour contrôle signal
- Arrêt gracieux via `GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT)`
- Fallback: `terminate()` puis `kill()` après timeout
- Stockage PID par session

**Méthodes:**
- `start_recording(session_id, duration)`: Lance FFmpeg
- `stop_recording(session_id)`: Arrête gracieusement
- `get_recording_status(session_id)`: État en cours
- `cleanup_all_recordings()`: Arrête tous les enregistrements

### 6. `app/main.py`
**Responsabilité:** Application FastAPI, routage, lifecycle

**Endpoints:**

| Route | Méthode | Fonction |
|-------|---------|----------|
| `/` | GET | Serve index.html |
| `/health` | GET | Health check |
| `/session/open` | POST | Créer session |
| `/session/close` | POST | Fermer session |
| `/session/list` | GET | Lister sessions |
| `/stream` | WebSocket | Stream preview |
| `/record/start` | POST | Démarrer enregistrement |
| `/record/stop` | POST | Arrêter enregistrement |
| `/record/status/{id}` | GET | Statut enregistrement |
| `/videos` | GET | Lister vidéos |
| `/videos/{filename}` | GET | Télécharger vidéo |

**Lifecycle:**
- `startup`: Ensure binaries des proxys
- `shutdown`: Cleanup recordings, sessions, proxys

**Sécurité:**
- CORS activé (dev local)
- Validation path traversal pour vidéos
- Pas d'authentification (usage local)

## Frontend

### Architecture JavaScript

**Classe `CameraRecorder`:**
- Singleton global `app`
- Gestion état session, WebSocket, recording
- Interaction avec Canvas pour rendu frames

**Flux d'utilisation:**

1. **Ouverture session**
   ```
   User input URL → POST /session/open
   → Receive session_id + local_rtsp_url
   → Connect WebSocket /stream?session_id=...
   → Start receiving frames
   ```

2. **Prévisualisation**
   ```
   WebSocket message → Parse JSON
   → Decode base64 JPEG → Create Image
   → Draw on Canvas → Display
   ```

3. **Enregistrement**
   ```
   Select duration → POST /record/start
   → Update UI (recording state)
   → Auto-stop after duration OR manual stop
   → POST /record/stop → Refresh video list
   ```

4. **Lecture vidéos**
   ```
   GET /videos → Display list
   → Click "Lire" → Set video.src
   → Play in <video> element
   ```

### Composants UI

- **Control Panel:** URL input, session controls, recording controls
- **Preview Panel:** Canvas + status overlay
- **Video Section:** Grid de vidéos + lecteur intégré
- **Responsive:** Grid CSS adaptatif

## Flux de Données

### Session RTSP

```
Camera RTSP → MediaMTX:8554/sess-{id}
              ↓
              ├→ OpenCV (preview) → WebSocket → Canvas
              └→ FFmpeg (recording) → MP4
```

### Session MJPEG

```
Camera HTTP → go2rtc:8555/sess-{id} (converti en RTSP)
              ↓
              ├→ OpenCV (preview) → WebSocket → Canvas
              └→ FFmpeg (recording) → MP4
```

## Gestion d'État

### Session State Machine

```
[NULL] → create_session() → [ACTIVE]
         ↓
         ├→ preview: [PREVIEW_ACTIVE]
         ├→ recording: [RECORDING]
         └→ close_session() → [NULL]
```

### Recording State

```
[IDLE] → start_recording() → [RECORDING]
         ↓
         ├→ duration elapsed → [COMPLETED]
         └→ stop_recording() → [STOPPED]
```

## Concurrence

### Multi-sessions
- Limite: 3 sessions simultanées (configurable)
- Chaque session = stream RTSP local unique
- Preview et recording indépendants par session
- Pas de verrou global (sessions isolées)

### Thread Safety
- Subprocess pour FFmpeg/proxys (pas de GIL)
- WebSocket asyncio (async/await)
- OpenCV capture par session (pas de partage)

## Logging

**Niveaux:** DEBUG, INFO, WARNING, ERROR

**Événements loggés:**
- Création/fermeture session (INFO)
- Démarrage/arrêt proxys (INFO)
- Début/fin enregistrement (INFO)
- Vérification flux (INFO)
- Erreurs capture/encoding (ERROR)
- Téléchargement binaires (INFO)

**Format:**
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

## Sécurité

### Considérations
⚠️ **Application locale uniquement**

- Pas d'authentification
- CORS ouvert (dev)
- Credentials caméra en clair dans logs
- Path traversal protégé (vidéos)

### Recommandations production
- Ajouter authentification (JWT, OAuth)
- HTTPS obligatoire
- Restreindre CORS
- Masquer credentials dans logs
- Rate limiting
- Validation inputs stricte

## Performance

### Optimisations
- Canvas rendering direct (pas de DOM)
- JPEG quality configurable (défaut 70)
- Backpressure WebSocket (pas de buffer infini)
- FFmpeg preset veryfast
- Pas de transcode si codec compatible

### Limites
- 3 sessions max (configurable)
- Bande passante: ~3-5 Mbps par session
- CPU: OpenCV decode + JPEG encode par session
- Mémoire: ~200-500 MB par session active

## Dépendances

### Runtime
- **Python 3.10+**: asyncio, subprocess, typing
- **FastAPI**: Web framework
- **OpenCV**: Capture vidéo
- **uvicorn**: ASGI server
- **requests**: HTTP client (downloads)
- **PyYAML**: Config proxys

### Binaires
- **FFmpeg**: Encodage vidéo
- **MediaMTX**: Proxy RTSP
- **go2rtc**: Convertisseur MJPEG

## Testing

### Tests manuels recommandés
1. Session RTSP unique
2. Session MJPEG unique (caméra test fournie)
3. Enregistrement 1 min, vérifier MP4
4. Stop avant fin, vérifier MP4 intègre
5. 3 sessions simultanées
6. Fermeture session pendant preview
7. Fermeture session pendant recording

### Points de validation
- Preview fluide (VFR)
- MP4 lisible Windows Media Player
- Audio présent si source a audio
- Arrêt propre FFmpeg (fichier complet)
- Cleanup sessions/proxys au shutdown

## Extensions futures

### Fonctionnalités possibles
- Support ONVIF (découverte caméras)
- PTZ controls (pan/tilt/zoom)
- Motion detection
- Snapshots (JPEG)
- Timelapses
- Multi-bitrate recording
- Cloud upload (S3, Drive)
- Authentification utilisateurs
- API REST complète
- Notifications (Discord, Email)

### Améliorations techniques
- Docker container
- systemd service (Linux)
- WebRTC preview (lower latency)
- GPU encoding (NVENC, QuickSync)
- Database (SQLite) pour métadonnées
- Tests unitaires + intégration
- Monitoring (Prometheus)
