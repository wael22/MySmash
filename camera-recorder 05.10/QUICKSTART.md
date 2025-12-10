# 🚀 Quick Start - Camera Recorder

## Installation rapide (Windows 10)

### 1. Prérequis
- ✅ Python 3.10+ installé
- ✅ FFmpeg dans le PATH (ou chemin configuré)

### 2. Installation
```bash
cd camera-recorder
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Démarrage
```bash
python -m app.main
```

ou double-cliquer sur `start.bat`

### 4. Accès
Ouvrir: **http://127.0.0.1:8000**

---

## Premier test (30 secondes)

### Étape 1: Ouvrir une session
1. L'URL de test est déjà pré-remplie:
   ```
   http://212.231.225.55:88/axis-cgi/mjpg/video.cgi
   ```
2. Cliquer **"Ouvrir Session"**
3. Attendre 5-10 secondes
4. ✅ La vidéo apparaît dans le canvas

### Étape 2: Enregistrer
1. Cliquer **"1 min"** (durée)
2. Cliquer **"▶ Start Recording"**
3. Attendre 10 secondes
4. Cliquer **"⏹ Stop Recording"**
5. ✅ La vidéo apparaît dans "Vidéos Enregistrées"

### Étape 3: Lire
1. Cliquer **"▶ Lire"** sur la vidéo
2. ✅ La vidéo se lit dans le lecteur

---

## Structure du projet

```
camera-recorder/
├── app/                    # Backend Python
│   ├── main.py            # FastAPI app
│   ├── config.py          # Configuration
│   ├── proxy_manager.py   # MediaMTX + go2rtc
│   ├── session_manager.py # Sessions caméras
│   ├── preview.py         # WebSocket streaming
│   └── recording.py       # FFmpeg recording
├── static/                 # Frontend
│   ├── index.html         # Interface UI
│   ├── app.js             # Logique JavaScript
│   └── styles.css         # Styles CSS
├── videos/                 # Enregistrements (créé auto)
├── bin/                    # Binaires proxys (téléchargés auto)
├── config.json             # Configuration
├── requirements.txt        # Dépendances Python
├── start.bat               # Script démarrage Windows
├── README.md               # Documentation complète
├── ARCHITECTURE.md         # Architecture détaillée
├── TESTING.md              # Guide de test
└── QUICKSTART.md           # Ce fichier
```

---

## Fonctionnalités principales

### 📹 Sources supportées
- ✅ RTSP (rtsp://...)
- ✅ HTTP MJPEG (http://...)
- ✅ Jusqu'à 3 sessions simultanées

### 🎬 Enregistrement
- ✅ MP4 H.264 + AAC
- ✅ VFR (Variable Frame Rate)
- ✅ Durées: 1 min, 5 min, 1h, 1.5h, 2h
- ✅ Stop manuel à tout moment

### 🖥️ Prévisualisation
- ✅ Live via WebSocket
- ✅ Canvas HTML5
- ✅ Pas de drop intentionnel
- ✅ VFR préservé

### 🔧 Proxys RTSP locaux
- ✅ MediaMTX (RTSP) - port 8554
- ✅ go2rtc (MJPEG) - port 8555
- ✅ Téléchargement automatique
- ✅ Configuration automatique

---

## Configuration

### Éditer config.json

```json
{
  "log_level": "info",
  "max_sessions": 3,
  "mediamtx_port": 8554,
  "go2rtc_port": 8555,
  "ffmpeg_path": "ffmpeg",
  "preview_jpeg_quality": 70,
  "ffmpeg_preset": "veryfast",
  "ffmpeg_crf": 23
}
```

### Personnalisation

**Changer le nombre de sessions max:**
```json
"max_sessions": 5
```

**Changer la qualité preview:**
```json
"preview_jpeg_quality": 85
```

**Changer la qualité enregistrement:**
```json
"ffmpeg_crf": 18
```
(18 = haute qualité, 28 = basse qualité)

---

## Commandes utiles

### Démarrer
```bash
python -m app.main
```

### Vérifier FFmpeg
```bash
ffmpeg -version
```

### Tester un flux
```bash
ffprobe http://212.231.225.55:88/axis-cgi/mjpg/video.cgi
```

### Analyser un enregistrement
```bash
ffprobe videos/<fichier>.mp4
```

---

## Dépannage express

### Problème: App ne démarre pas
```bash
# Vérifier Python
python --version

# Réinstaller dépendances
pip install -r requirements.txt --force-reinstall
```

### Problème: Preview ne s'affiche pas
1. Vérifier que l'URL caméra est accessible
2. Attendre 10-15 secondes (téléchargement binaires)
3. Vérifier les logs dans la console
4. Fermer/rouvrir la session

### Problème: Enregistrement échoue
```bash
# Vérifier FFmpeg
ffmpeg -version

# Si absent, télécharger:
# https://www.gyan.dev/ffmpeg/builds/
```

### Problème: Ports déjà utilisés
Éditer `config.json`:
```json
"mediamtx_port": 8558,
"go2rtc_port": 8559
```

---

## API REST (développeurs)

### Créer une session
```bash
curl -X POST http://127.0.0.1:8000/session/open \
  -H "Content-Type: application/json" \
  -d '{"url": "http://212.231.225.55:88/axis-cgi/mjpg/video.cgi"}'
```

### Démarrer enregistrement
```bash
curl -X POST http://127.0.0.1:8000/record/start \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<uuid>", "duration_seconds": 60}'
```

### Arrêter enregistrement
```bash
curl -X POST http://127.0.0.1:8000/record/stop \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<uuid>"}'
```

### Lister vidéos
```bash
curl http://127.0.0.1:8000/videos
```

---

## Prochaines étapes

### Lire la documentation complète
- 📖 **README.md** - Documentation utilisateur
- 🏗️ **ARCHITECTURE.md** - Architecture technique
- 🧪 **TESTING.md** - Guide de test complet

### Tester les fonctionnalités
1. ✅ Enregistrement multi-durées
2. ✅ Multi-sessions (3 caméras)
3. ✅ Stop manuel
4. ✅ Lecture vidéos

### Personnaliser
- Modifier l'interface (static/)
- Ajouter des durées personnalisées
- Intégrer votre propre caméra

---

## Support

### Logs
Tous les logs s'affichent dans la console où l'application est lancée.

### Health check
```bash
curl http://127.0.0.1:8000/health
```

### Arrêt propre
Ctrl+C dans la console → Cleanup automatique

---

**Durée totale d'installation: ~5 minutes**  
**Premier test: ~30 secondes**  
**Prêt à l'emploi! 🎉**
