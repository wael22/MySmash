# 🎥 Camera Recorder - Application d'Enregistrement de Caméras

Application web locale pour l'enregistrement et la prévisualisation de flux vidéo RTSP et HTTP MJPEG.

## 🎯 Fonctionnalités

- ✅ Support des sources RTSP et HTTP MJPEG
- ✅ Prévisualisation live via WebSocket et Canvas
- ✅ Enregistrement MP4 H.264 avec audio AAC
- ✅ VFR (Variable Frame Rate) - pas de conversion forcée
- ✅ Gestion de jusqu'à 3 sessions simultanées
- ✅ Proxy RTSP local obligatoire (MediaMTX + go2rtc)
- ✅ Interface web intuitive
- ✅ Durées d'enregistrement prédéfinies (1 min à 2h)
- ✅ Lecture et téléchargement des vidéos enregistrées

## 📋 Prérequis

### Windows 10

1. **Python 3.10 ou supérieur**
   - Télécharger depuis https://www.python.org/downloads/

2. **FFmpeg**
   - Télécharger depuis https://www.gyan.dev/ffmpeg/builds/
   - Extraire et ajouter au PATH, ou spécifier le chemin dans `config.json`
   - Vérifier: `ffmpeg -version`

3. **Visual C++ Redistributable** (pour OpenCV)
   - https://aka.ms/vs/17/release/vc_redist.x64.exe

## 🚀 Installation

### 1. Cloner ou télécharger le projet

```bash
cd camera-recorder
```

### 2. Créer un environnement virtuel (recommandé)

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Vérifier la configuration

Éditer `config.json` si nécessaire:

```json
{
  "log_level": "info",
  "max_sessions": 3,
  "mediamtx_port": 8554,
  "go2rtc_port": 8555,
  "ffmpeg_path": "ffmpeg"
}
```

**Note:** Les binaires `mediamtx.exe` et `go2rtc.exe` seront téléchargés automatiquement dans le dossier `./bin` au premier démarrage.

## 🎬 Démarrage

### Lancer l'application

```bash
python -m app.main
```

ou

```bash
python app/main.py
```

L'application démarre sur **http://127.0.0.1:8000**

### Logs

Les logs s'affichent dans la console avec le niveau `info` par défaut:
- Ouverture/fermeture de sessions
- Démarrage/arrêt des proxys
- Début/fin d'enregistrement
- Erreurs éventuelles

## 📖 Utilisation

### 1. Ajouter une caméra

1. Entrer l'URL de la caméra dans le champ:
   - RTSP: `rtsp://username:password@ip:port/path`
   - MJPEG: `http://ip:port/path/to/mjpeg`
   - **Exemple de test**: `http://212.231.225.55:88/axis-cgi/mjpg/video.cgi`

2. Cliquer sur **"Ouvrir Session"**

3. La prévisualisation s'affiche automatiquement dans le canvas

### 2. Enregistrer une vidéo

1. Choisir la durée:
   - 1 min (60s)
   - 5 min (300s)
   - 1 h (3600s)
   - 1.5 h (5400s)
   - 2 h (7200s)

2. Cliquer sur **"▶ Start Recording"**

3. L'enregistrement commence et se termine automatiquement après la durée choisie

4. Pour arrêter avant la fin: cliquer sur **"⏹ Stop Recording"**

### 3. Visionner les vidéos

1. Les vidéos apparaissent dans la section "Vidéos Enregistrées"

2. Cliquer sur **"▶ Lire"** pour visionner dans le lecteur intégré

3. Cliquer sur **"⬇ Télécharger"** pour sauvegarder localement

### 4. Fermer une session

Cliquer sur **"Fermer Session"** pour libérer la session et arrêter la prévisualisation.

## 🏗️ Architecture

```
camera-recorder/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application FastAPI, endpoints
│   ├── config.py            # Gestion de la configuration
│   ├── proxy_manager.py     # Gestion MediaMTX et go2rtc
│   ├── session_manager.py   # Gestion des sessions caméras
│   ├── preview.py           # Prévisualisation WebSocket
│   └── recording.py         # Enregistrement FFmpeg
├── static/
│   ├── index.html           # Interface utilisateur
│   ├── app.js               # Logique frontend
│   └── styles.css           # Styles CSS
├── videos/                  # Vidéos enregistrées (créé automatiquement)
├── bin/                     # Binaires proxy (téléchargés automatiquement)
├── config.json              # Configuration
├── requirements.txt         # Dépendances Python
└── README.md
```

## 🔧 Configuration avancée

### Proxy RTSP Local

#### MediaMTX (RTSP → RTSP)
- Port par défaut: **8554**
- Utilisé pour les sources RTSP
- Configuration générée automatiquement dans `bin/mediamtx.yml`

#### go2rtc (MJPEG → RTSP)
- Port par défaut: **8555**
- Utilisé pour les sources HTTP MJPEG
- Configuration générée automatiquement dans `bin/go2rtc.yaml`

### FFmpeg

Options d'enregistrement (VFR):
```bash
ffmpeg -i <rtsp_local> -t <durée> \
  -c:v libx264 -preset veryfast -crf 23 \
  -c:a aac -b:a 128k \
  output.mp4
```

**Important:** Pas de `-vf fps=25` ni `-vsync 1` pour préserver le VFR natif.

### Vérification du flux

À l'ouverture de session:
- Tentative de lecture de 10 frames ou 2 secondes
- 3 tentatives maximum
- Timeout de 5 secondes

## 📊 Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Page d'accueil |
| GET | `/health` | Health check |
| POST | `/session/open` | Créer une session |
| POST | `/session/close` | Fermer une session |
| GET | `/session/list` | Lister les sessions |
| WebSocket | `/stream?session_id=<id>` | Stream prévisualisation |
| POST | `/record/start` | Démarrer enregistrement |
| POST | `/record/stop` | Arrêter enregistrement |
| GET | `/record/status/<id>` | Statut enregistrement |
| GET | `/videos` | Lister les vidéos |
| GET | `/videos/<filename>` | Télécharger une vidéo |

## 🐛 Dépannage

### L'application ne démarre pas

1. Vérifier que Python 3.10+ est installé:
   ```bash
   python --version
   ```

2. Vérifier que les dépendances sont installées:
   ```bash
   pip list
   ```

3. Vérifier les logs dans la console

### La prévisualisation ne s'affiche pas

1. Vérifier que l'URL de la caméra est accessible
2. Vérifier les logs pour les erreurs de proxy
3. Vérifier que les ports 8554 et 8555 sont libres
4. Essayer de fermer et rouvrir la session

### L'enregistrement échoue

1. Vérifier que FFmpeg est installé et dans le PATH:
   ```bash
   ffmpeg -version
   ```

2. Vérifier que le dossier `videos/` est accessible en écriture

3. Vérifier les logs FFmpeg dans la console

### Erreur de téléchargement des binaires

Si le téléchargement automatique échoue:

1. Télécharger manuellement:
   - MediaMTX: https://github.com/bluenviron/mediamtx/releases
   - go2rtc: https://github.com/AlexxIT/go2rtc/releases

2. Extraire `mediamtx.exe` et `go2rtc.exe` dans le dossier `bin/`

## 🔒 Sécurité

⚠️ **Attention:** Cette application est conçue pour un usage local uniquement.

- Pas d'authentification implémentée
- Ne pas exposer sur Internet sans sécurisation
- Les URLs de caméra avec credentials sont visibles dans les logs

## 📝 Notes techniques

### VFR (Variable Frame Rate)

L'application préserve le VFR natif des sources:
- Pas de conversion fps forcée
- Timestamps originaux préservés
- Compatible avec Windows Media Player

### Multi-sessions

- Maximum 3 sessions simultanées (configurable)
- Chaque session a son propre flux RTSP local
- Les sessions sont indépendantes

### Gestion des processus Windows

- FFmpeg avec `CREATE_NEW_PROCESS_GROUP`
- Arrêt gracieux via `CTRL_BREAK_EVENT`
- Fallback terminate() puis kill() après timeout

## 📄 Licence

Ce projet est fourni "tel quel" sans garantie.

## 🤝 Support

Pour toute question ou problème, vérifier d'abord:
1. Les logs dans la console
2. La section Dépannage ci-dessus
3. Les issues GitHub du projet

---

**Version:** 1.0.0  
**Dernière mise à jour:** Octobre 2025
