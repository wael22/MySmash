# Guide de Test - Camera Recorder

## 🎯 Critères d'acceptation

### 1. ✅ Démarrage de l'application
**Objectif:** L'application démarre et l'interface est accessible

**Étapes:**
1. Ouvrir un terminal dans le dossier `camera-recorder`
2. Exécuter: `python -m app.main` (ou double-cliquer `start.bat`)
3. Vérifier les logs de démarrage
4. Ouvrir un navigateur sur `http://127.0.0.1:8000`

**Résultat attendu:**
- ✓ Application démarre sans erreur
- ✓ Logs affichent "Starting Camera Recorder application"
- ✓ Interface web s'affiche correctement
- ✓ Pas d'erreur JavaScript dans la console navigateur

---

### 2. ✅ Ajout de la caméra de test MJPEG
**Objectif:** La session se crée et la preview s'affiche

**URL de test:** `http://212.231.225.55:88/axis-cgi/mjpg/video.cgi`

**Étapes:**
1. Coller l'URL dans le champ "URL de la caméra"
2. Cliquer sur "Ouvrir Session"
3. Attendre la connexion (5-10 secondes)

**Résultat attendu:**
- ✓ Message "Session ouverte" dans les logs
- ✓ go2rtc démarre automatiquement (si premier usage)
- ✓ Stream vérifié: "Stream verified: read X frames"
- ✓ WebSocket connecté: "WebSocket connecté"
- ✓ Canvas affiche la vidéo live
- ✓ Pas de frames droppées intentionnellement
- ✓ Résolution affichée sous le canvas
- ✓ VFR préservé (latence variable acceptable)
- ✓ Info session affichée (Session ID, Type: MJPEG)

**Logs attendus:**
```
INFO - Creating session <uuid> for mjpeg source: http://212.231...
INFO - go2rtc started on port 8555
INFO - MJPEG proxy configured via go2rtc for session <uuid>
INFO - Verifying stream rtsp://127.0.0.1:8555/sess-<uuid>
INFO - Stream verified: read 10 frames
INFO - Session <uuid> created successfully
INFO - Starting preview for session <uuid>
INFO - WebSocket connected for session <uuid>
```

---

### 3. ✅ Enregistrement avec durées multiples
**Objectif:** Les enregistrements produisent des fichiers MP4 valides

#### Test 3.1: Enregistrement 1 minute

**Étapes:**
1. Session ouverte (voir test 2)
2. Sélectionner "1 min" dans les boutons de durée
3. Cliquer "▶ Start Recording"
4. Attendre 60 secondes OU cliquer "⏹ Stop Recording" après 10s

**Résultat attendu:**
- ✓ Message "Recording started" dans les logs
- ✓ Statut UI: "⏺ Enregistrement en cours..."
- ✓ Fichier créé dans `./videos/`
- ✓ Nommage: `<session_id>_<timestamp>.mp4`
- ✓ Fichier lisible dans Windows Media Player
- ✓ Vidéo H.264, audio AAC (si présent dans source)
- ✓ Durée ~60s (si non interrompu) ou ~10s (si stop manuel)
- ✓ VFR préservé (pas de conversion 25fps forcée)

**Vérification fichier:**
```bash
ffprobe videos/<fichier>.mp4
```
Doit afficher:
- Video: h264
- Audio: aac (si source a audio)
- Duration: ~00:01:00 ou durée arrêtée

#### Test 3.2: Enregistrement 5 minutes
Répéter test 3.1 avec "5 min" sélectionné

#### Test 3.3: Enregistrement 1 heure
Répéter test 3.1 avec "1 h" sélectionné (peut arrêter après quelques minutes pour test)

#### Test 3.4: Enregistrement 1.5 heures
Répéter test 3.1 avec "1.5 h" sélectionné

#### Test 3.5: Enregistrement 2 heures
Répéter test 3.1 avec "2 h" sélectionné

**Logs attendus:**
```
INFO - Starting recording for session <uuid>
INFO - Command: ffmpeg -i rtsp://127.0.0.1:8555/sess-<uuid> -t 60 -c:v libx264 ...
INFO - Recording started for session <uuid>, PID: <pid>, output: ./videos/<file>.mp4
```

---

### 4. ✅ Arrêt propre de l'enregistrement
**Objectif:** Stop Recording produit un fichier MP4 intègre

**Étapes:**
1. Démarrer un enregistrement (n'importe quelle durée)
2. Attendre 5-10 secondes
3. Cliquer "⏹ Stop Recording"
4. Vérifier les logs

**Résultat attendu:**
- ✓ Message "Stopping recording" dans les logs
- ✓ Tentative arrêt gracieux (CTRL_BREAK_EVENT sous Windows)
- ✓ Processus FFmpeg terminé proprement
- ✓ Fichier MP4 présent dans `./videos/`
- ✓ Fichier lisible sans corruption
- ✓ Durée = temps écoulé avant stop
- ✓ UI mise à jour: "⏹ Enregistrement arrêté"

**Logs attendus:**
```
INFO - Stopping recording for session <uuid>, PID: <pid>
INFO - Sent CTRL_BREAK_EVENT to PID <pid>
INFO - Recording process <pid> terminated gracefully
INFO - Recording stopped for session <uuid>
```

**Test d'intégrité:**
```bash
ffprobe videos/<fichier>.mp4
# Doit afficher les infos sans erreur
```

Ouvrir dans Windows Media Player → doit lire sans erreur

---

### 5. ✅ Multi-sessions (jusqu'à 3 en parallèle)
**Objectif:** 3 sessions simultanées fonctionnent avec preview + recording

**Configuration:**
- Session 1: Caméra test MJPEG
- Session 2: Caméra test MJPEG (même URL, nouvelle session)
- Session 3: Caméra test MJPEG ou RTSP si disponible

**Étapes:**
1. Ouvrir 3 onglets navigateur sur `http://127.0.0.1:8000`
2. Dans chaque onglet:
   - Ouvrir une session avec l'URL test
   - Vérifier preview active
   - Démarrer un enregistrement
3. Vérifier que les 3 sessions tournent en parallèle

**Résultat attendu:**
- ✓ 3 sessions créées avec session_id différents
- ✓ 3 previews actives simultanément
- ✓ 3 enregistrements en cours
- ✓ Logs clairs pour chaque session (niveau INFO)
- ✓ Pas de conflit de ressources
- ✓ CPU/RAM acceptables (< 2 GB total)

**Tentative 4ème session:**
4. Essayer d'ouvrir une 4ème session

**Résultat attendu:**
- ✓ Erreur HTTP 400
- ✓ Message: "Maximum number of sessions (3) reached"

**Logs attendus:**
```
INFO - Session <uuid1> created successfully
INFO - Session <uuid2> created successfully
INFO - Session <uuid3> created successfully
ERROR - Failed to open session: Maximum number of sessions (3) reached
```

**Cleanup:**
5. Fermer les 3 sessions
6. Arrêter les enregistrements
7. Vérifier 3 fichiers MP4 créés

---

### 6. ✅ Verification des proxys

#### Test 6.1: Source RTSP → MediaMTX (port 8554)

**Prérequis:** Avoir une source RTSP accessible (ou utiliser une caméra de test RTSP)

**Étapes:**
1. Entrer une URL RTSP: `rtsp://...`
2. Ouvrir la session
3. Vérifier les logs

**Résultat attendu:**
- ✓ MediaMTX démarre automatiquement
- ✓ Config `bin/mediamtx.yml` générée
- ✓ Local RTSP URL: `rtsp://127.0.0.1:8554/sess-<uuid>`
- ✓ Preview utilise le proxy local
- ✓ Enregistrement utilise le proxy local

**Logs attendus:**
```
INFO - MediaMTX started on port 8554
INFO - RTSP proxy configured for session <uuid>
```

#### Test 6.2: Source MJPEG → go2rtc (port 8555)

**Étapes:**
1. Utiliser la caméra test MJPEG
2. Vérifier les logs

**Résultat attendu:**
- ✓ go2rtc démarre automatiquement
- ✓ Config `bin/go2rtc.yaml` générée
- ✓ Stream ajouté dynamiquement: `sess-<uuid>`
- ✓ Local RTSP URL: `rtsp://127.0.0.1:8555/sess-<uuid>`
- ✓ Conversion MJPEG→RTSP transparente

**Logs attendus:**
```
INFO - go2rtc started on port 8555
INFO - MJPEG proxy configured via go2rtc for session <uuid>
INFO - Updated go2rtc stream sess-<uuid>
```

---

### 7. ✅ Logs niveau INFO

**Objectif:** Vérifier que tous les événements importants sont loggés

**Événements à logger:**
- [x] Démarrage application
- [x] Chargement config
- [x] Téléchargement binaires (si nécessaire)
- [x] Démarrage proxys
- [x] Création session (avec type source)
- [x] Vérification stream (frames lues)
- [x] Connexion WebSocket
- [x] Démarrage enregistrement (commande FFmpeg)
- [x] Arrêt enregistrement (gracieux)
- [x] Fermeture session
- [x] Shutdown application
- [x] Erreurs (avec détails)

**Vérification:**
```bash
# Lancer l'app et vérifier la console
python -m app.main
```

Logs doivent être:
- ✓ Clairs et lisibles
- ✓ Format: `2025-10-04 10:30:45 - app.main - INFO - Message`
- ✓ Pas de spam (pas de log par frame)
- ✓ Erreurs avec stack traces si exceptions

---

## 🧪 Tests additionnels

### Test de robustesse

#### T1: Fermeture brutale navigateur pendant preview
1. Ouvrir session + preview
2. Fermer l'onglet brutalement
3. Vérifier logs

**Attendu:**
- ✓ WebSocket détecte déconnexion
- ✓ Cleanup automatique
- ✓ Pas de leak de ressources

#### T2: Arrêt application pendant enregistrement
1. Démarrer enregistrement
2. Ctrl+C dans le terminal
3. Vérifier fichiers MP4

**Attendu:**
- ✓ Shutdown gracieux
- ✓ FFmpeg arrêté proprement
- ✓ Fichiers MP4 utilisables (peut être tronqué mais lisible)

#### T3: Source inaccessible
1. Entrer une URL invalide: `rtsp://192.168.1.999:554/fake`
2. Tenter d'ouvrir session

**Attendu:**
- ✓ Erreur HTTP 400
- ✓ Message clair: "Failed to verify stream"
- ✓ Pas de crash

#### T4: FFmpeg non installé
1. Renommer `ffmpeg.exe` temporairement
2. Tenter de démarrer enregistrement

**Attendu:**
- ✓ Erreur HTTP 400
- ✓ Message: "ffmpeg not found" ou similaire
- ✓ Logs clairs

---

### Test de performance

#### P1: Latence preview
1. Ouvrir session
2. Mesurer délai entre mouvement devant caméra et affichage

**Attendu:**
- ✓ Latence < 2 secondes en local
- ✓ Pas de gel d'image
- ✓ Frames fluides (VFR)

#### P2: CPU/RAM usage
1. Ouvrir 3 sessions avec enregistrement
2. Monitorer ressources (Task Manager)

**Attendu:**
- ✓ CPU: < 50% (dépend hardware)
- ✓ RAM: < 2 GB total
- ✓ Pas de memory leak sur durée longue

#### P3: Qualité vidéo
1. Enregistrer 1 minute
2. Analyser le fichier MP4

**Attendu:**
- ✓ Résolution = résolution source
- ✓ Bitrate raisonnable (CRF 23)
- ✓ Audio synchronisé
- ✓ Pas d'artefacts majeurs

---

## 📋 Checklist finale

Avant de considérer l'application comme complète:

### Installation
- [ ] Requirements.txt complet
- [ ] start.bat fonctionne sous Windows
- [ ] Binaires téléchargés automatiquement
- [ ] Config.json valide

### Fonctionnalités core
- [ ] Session MJPEG fonctionne
- [ ] Session RTSP fonctionne (si testable)
- [ ] Preview live fluide
- [ ] Enregistrement 5 durées différentes
- [ ] Stop recording gracieux
- [ ] 3 sessions parallèles OK
- [ ] Liste vidéos + lecture
- [ ] Téléchargement vidéos

### Qualité code
- [ ] Logs niveau INFO clairs
- [ ] Pas d'erreurs Python
- [ ] Pas d'erreurs JavaScript console
- [ ] Cleanup propre (shutdown)
- [ ] Gestion erreurs (try/except)

### Documentation
- [ ] README.md complet
- [ ] ARCHITECTURE.md détaillé
- [ ] TESTING.md (ce fichier)
- [ ] Commentaires code si nécessaire

### Acceptance criteria
- [x] App démarre, UI accessible
- [x] Caméra test MJPEG + preview
- [x] Enregistrements multiples durées
- [x] Stop recording propre
- [x] 3 sessions parallèles
- [x] Proxys RTSP locaux fonctionnels

---

## 🎥 Caméra de test

**URL fournie:** `http://212.231.225.55:88/axis-cgi/mjpg/video.cgi`

**Type:** HTTP MJPEG  
**Résolution:** Variable (à vérifier dans preview)  
**Audio:** Non (en général)  
**Disponibilité:** Publique (peut être indisponible)

**Backup:** Si la caméra test ne fonctionne pas, chercher d'autres caméras publiques MJPEG ou utiliser:
- OBS Studio en mode Virtual Camera
- VLC streaming d'un fichier vidéo
- Caméra IP locale si disponible

---

## 🔧 Commandes utiles

### Vérifier un flux RTSP
```bash
ffprobe rtsp://127.0.0.1:8554/sess-<uuid>
```

### Tester la lecture d'un MP4
```bash
ffplay videos/<fichier>.mp4
```

### Analyser un MP4
```bash
ffprobe -v error -show_format -show_streams videos/<fichier>.mp4
```

### Vérifier si les ports sont occupés
```bash
netstat -an | findstr 8554
netstat -an | findstr 8555
```

### Logs temps réel
Les logs s'affichent directement dans la console où l'application est lancée.

---

**Version:** 1.0.0  
**Dernière mise à jour:** Octobre 2025
