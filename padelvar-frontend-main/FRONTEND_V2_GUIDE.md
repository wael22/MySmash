# 🎨 Frontend V2 - Adaptation au Système d'Enregistrement

## 📋 Table des Matières
- [Vue d'Ensemble](#vue-densemble)
- [Aucune Modification Requise](#aucune-modification-requise)
- [Nouvelles Fonctionnalités Disponibles](#nouvelles-fonctionnalités-disponibles)
- [Indicateurs UX Améliorés](#indicateurs-ux-améliorés)
- [Composants Optionnels](#composants-optionnels)
- [Tests Frontend](#tests-frontend)

---

## 🎯 Vue d'Ensemble

**Bonne nouvelle ! Le frontend actuel est déjà 100% compatible avec le système V2.**

### Architecture Actuelle

```
Frontend (React)
    ↓ API Calls
recordingService.startAdvancedRecording()
    ↓ HTTP POST
/api/recording/v3/start
    ↓ Backend V2
recording_manager_v2.start_recording()
    ↓ Système V2
[Segmentation + Validation + Multi-terrains]
```

### Composants Existants

✅ **`AdvancedRecordingModal.jsx`** - Modal principal d'enregistrement
- Sélection club suivi
- Sélection terrain disponible
- Durée configurable (60/90/120/MAX min)
- Titre et description
- ✅ **Déjà compatible V2**

✅ **`ActiveRecordingBanner.jsx`** - Bannière enregistrement actif
- Affichage temps écoulé
- Progression visuelle
- Bouton arrêt
- ✅ **Déjà compatible V2**

✅ **`recordingService.js`** - Service API
- `startAdvancedRecording()` → `/api/recording/v3/start`
- `stopRecording()` → `/api/recording/v3/stop`
- ✅ **Déjà compatible V2**

---

## ✅ Aucune Modification Requise

### Pourquoi le Frontend Fonctionne Déjà ?

1. **API Endpoints Inchangés**
   - `/api/recording/v3/start` existe déjà
   - `/api/recording/v3/stop` existe déjà
   - Format des requêtes/réponses identique

2. **Contrat d'Interface Respecté**
   - Request body : `{ court_id, user_id, duration_minutes, title }`
   - Response : `{ success, recording_id, message, recording_session }`

3. **Logique Métier Transparente**
   - Le frontend ne sait pas que V2 utilise segmentation
   - Le frontend ne sait pas que V2 valide 3-frames
   - **Le frontend continue de fonctionner normalement**

### Code Existant (Aucun Changement)

**`AdvancedRecordingModal.jsx` (ligne 160-169) - Reste identique :**
```jsx
const response = await recordingService.startAdvancedRecording({
  court_id: recordingData.court_id,
  user_id: user.id,
  duration_minutes: recordingData.duration,
  title: recordingData.title || `Match du ${new Date().toLocaleDateString('fr-FR')}`,
  description: recordingData.description
});

onRecordingStarted(response.data.recording_session);
handleClose();
```

**`recordingService.js` - Reste identique :**
```javascript
async startAdvancedRecording(data) {
  const response = await axios.post(
    `${API_BASE_URL}/recording/v3/start`,
    data,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
}
```

---

## 🆕 Nouvelles Fonctionnalités Disponibles

### 1. Endpoint Diagnostics (Optionnel)

**Nouveau endpoint backend disponible :**
```
GET /api/recording/v3/diagnostics/<recording_id>
```

**Intégration suggérée dans `recordingService.js` :**
```javascript
// OPTIONNEL : Ajouter à recordingService.js
async getRecordingDiagnostics(recordingId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/recording/v3/diagnostics/${recordingId}`,
      { headers: { 'Authorization': `Bearer ${this.getToken()}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching diagnostics:', error);
    throw error;
  }
}
```

**Exemple d'utilisation :**
```jsx
// Dans un composant de debug/admin
const [diagnostics, setDiagnostics] = useState(null);

const loadDiagnostics = async () => {
  const data = await recordingService.getRecordingDiagnostics(recordingId);
  setDiagnostics(data);
};

// Afficher les infos
{diagnostics && (
  <div>
    <p>Segments créés : {diagnostics.recording.segments.length}</p>
    <p>Proxy port : {diagnostics.proxies.ports_allocated[0]}</p>
    <p>FFmpeg PID : {diagnostics.recording.ffmpeg_pid}</p>
  </div>
)}
```

### 2. Statut Proxy (Optionnel)

**Nouveau endpoint :**
```
GET /api/proxy/status
```

**Intégration suggérée :**
```javascript
// OPTIONNEL : Ajouter à recordingService.js
async getProxyStatus() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/proxy/status`,
      { headers: { 'Authorization': `Bearer ${this.getToken()}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching proxy status:', error);
    throw error;
  }
}
```

**Exemple dashboard admin :**
```jsx
// Composant AdminDashboard.jsx
const [proxyStats, setProxyStats] = useState(null);

useEffect(() => {
  const interval = setInterval(async () => {
    const stats = await recordingService.getProxyStatus();
    setProxyStats(stats);
  }, 5000); // Refresh toutes les 5s

  return () => clearInterval(interval);
}, []);

// Affichage
{proxyStats && (
  <Card>
    <CardHeader>Statut Proxies</CardHeader>
    <CardContent>
      <p>Proxies actifs : {proxyStats.total_proxies}</p>
      <p>Ports utilisés : {proxyStats.ports_allocated.join(', ')}</p>
      <p>Enregistrements : {proxyStats.recordings_active}</p>
    </CardContent>
  </Card>
)}
```

---

## 🎨 Indicateurs UX Améliorés

### 1. Feedback Visuel Segmentation

**Bien que non obligatoire**, vous pouvez ajouter un indicateur pour montrer que la segmentation est active :

```jsx
// Composant ActiveRecordingBanner.jsx - OPTIONNEL
import { Database } from 'lucide-react';

const SegmentIndicator = ({ recordingId }) => {
  const [segmentCount, setSegmentCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const diag = await recordingService.getRecordingDiagnostics(recordingId);
        setSegmentCount(diag.recording.segments?.length || 0);
      } catch (e) {
        // Ignorer si endpoint non disponible
      }
    }, 10000); // Toutes les 10s

    return () => clearInterval(interval);
  }, [recordingId]);

  if (segmentCount === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Database className="h-4 w-4" />
      <span>{segmentCount} segments créés</span>
    </div>
  );
};

// Utilisation dans ActiveRecordingBanner
<div className="flex justify-between items-center">
  <RecordingTimer startTime={activeRecording.start_time} />
  <SegmentIndicator recordingId={activeRecording.recording_id} />
</div>
```

### 2. Message Validation Caméra

**Pendant le démarrage**, afficher un message de validation :

```jsx
// Composant AdvancedRecordingModal.jsx - OPTIONNEL
const [validatingCamera, setValidatingCamera] = useState(false);

const handleStartRecording = async () => {
  setIsLoading(true);
  setValidatingCamera(true); // NOUVEAU
  setError('');
  
  try {
    const response = await recordingService.startAdvancedRecording({...});
    onRecordingStarted(response.data.recording_session);
    handleClose();
  } catch (error) {
    // Erreur spécifique validation caméra
    if (error.response?.data?.error?.includes('caméra')) {
      setError('❌ Caméra inaccessible. Vérifiez la connexion réseau.');
    } else {
      setError(error.response?.data?.error || 'Erreur inconnue');
    }
  } finally {
    setIsLoading(false);
    setValidatingCamera(false); // NOUVEAU
  }
};

// Affichage pendant validation
{validatingCamera && (
  <Alert>
    <Camera className="h-4 w-4 animate-pulse" />
    <AlertDescription>
      Validation de la caméra en cours (test 3 frames)...
    </AlertDescription>
  </Alert>
)}
```

### 3. Indicateur Espace Disque

**Si l'enregistrement échoue pour manque d'espace**, le backend V2 renvoie une erreur explicite :

```jsx
// Composant AdvancedRecordingModal.jsx - OPTIONNEL
catch (error) {
  const errorMsg = error.response?.data?.error || '';
  
  if (errorMsg.includes('espace disque')) {
    setError('⚠️ Espace disque insuffisant. Contactez l\'administrateur.');
  } else if (errorMsg.includes('caméra')) {
    setError('❌ Caméra inaccessible.');
  } else if (errorMsg.includes('limite')) {
    setError('⚠️ Limite d\'enregistrements simultanés atteinte.');
  } else {
    setError(errorMsg);
  }
}
```

---

## 🧩 Composants Optionnels

### 1. Composant `RecordingHealthIndicator`

**Affichage santé système en temps réel :**

```jsx
// src/components/player/RecordingHealthIndicator.jsx
import { useState, useEffect } from 'react';
import { recordingService } from '../../lib/api';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

const RecordingHealthIndicator = () => {
  const [health, setHealth] = useState('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await recordingService.getProxyStatus();
        setHealth(response.total_proxies >= 0 ? 'healthy' : 'error');
      } catch (e) {
        setHealth('error');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Toutes les 30s
    return () => clearInterval(interval);
  }, []);

  if (health === 'loading') return null;

  return (
    <Badge variant={health === 'healthy' ? 'success' : 'destructive'}>
      {health === 'healthy' ? (
        <>
          <CheckCircle className="h-3 w-3 mr-1" />
          Système opérationnel
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3 mr-1" />
          Système indisponible
        </>
      )}
    </Badge>
  );
};

export default RecordingHealthIndicator;
```

**Utilisation dans la navbar :**
```jsx
// src/components/layout/Navbar.jsx
import RecordingHealthIndicator from '../player/RecordingHealthIndicator';

<nav>
  <div className="flex items-center gap-4">
    <Logo />
    <RecordingHealthIndicator />
  </div>
</nav>
```

### 2. Composant `RecordingDiagnosticsModal`

**Modal de diagnostics avancés (pour admin ou debug) :**

```jsx
// src/components/admin/RecordingDiagnosticsModal.jsx
import { useState, useEffect } from 'react';
import { recordingService } from '../../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RecordingDiagnosticsModal = ({ isOpen, onClose, recordingId }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && recordingId) {
      loadDiagnostics();
    }
  }, [isOpen, recordingId]);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const data = await recordingService.getRecordingDiagnostics(recordingId);
      setDiagnostics(data);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargement des diagnostics...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Diagnostics - {recordingId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations Enregistrement */}
          <Card>
            <CardHeader>
              <CardTitle>Enregistrement</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="font-medium">Terrain ID:</dt>
                <dd>{diagnostics?.recording?.terrain_id}</dd>
                
                <dt className="font-medium">Status:</dt>
                <dd className="capitalize">{diagnostics?.recording?.status}</dd>
                
                <dt className="font-medium">Segments créés:</dt>
                <dd>{diagnostics?.recording?.segments?.length || 0}</dd>
                
                <dt className="font-medium">FFmpeg PID:</dt>
                <dd>{diagnostics?.recording?.ffmpeg_pid || 'N/A'}</dd>
                
                <dt className="font-medium">Démarré à:</dt>
                <dd>{new Date(diagnostics?.recording?.start_time).toLocaleString('fr-FR')}</dd>
              </dl>
            </CardContent>
          </Card>

          {/* Informations Proxy */}
          <Card>
            <CardHeader>
              <CardTitle>Proxy RTSP</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="font-medium">Proxies actifs:</dt>
                <dd>{diagnostics?.proxies?.total_proxies || 0}</dd>
                
                <dt className="font-medium">Ports alloués:</dt>
                <dd>{diagnostics?.proxies?.ports_allocated?.join(', ') || 'N/A'}</dd>
              </dl>
            </CardContent>
          </Card>

          {/* Liste des Segments */}
          {diagnostics?.recording?.segments && diagnostics.recording.segments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Segments ({diagnostics.recording.segments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto">
                  <ul className="text-xs space-y-1">
                    {diagnostics.recording.segments.map((segment, idx) => (
                      <li key={idx} className="font-mono">
                        {segment}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingDiagnosticsModal;
```

---

## 🧪 Tests Frontend

### Test 1: Démarrage Enregistrement

**Vérifier que le système V2 est transparent :**

```bash
# 1. Ouvrir l'application
npm run dev

# 2. Se connecter en tant que joueur
# 3. Ouvrir modal d'enregistrement
# 4. Sélectionner club + terrain
# 5. Cliquer "Démarrer"

# ✅ Attendu :
# - Message "Enregistrement démarré"
# - Bannière active visible
# - Timer démarre
# - Aucune erreur console
```

### Test 2: Validation Caméra

**Tester le cas où la caméra est inaccessible :**

```bash
# 1. Backend : Débrancher physiquement la caméra ou modifier URL dans CAMERA_MAPPING
# 2. Frontend : Tenter de démarrer enregistrement

# ✅ Attendu :
# - Erreur "Caméra inaccessible" dans modal
# - Pas de bannière active (enregistrement non démarré)
# - Message d'erreur clair
```

### Test 3: Arrêt Enregistrement

**Vérifier l'arrêt gracieux :**

```bash
# 1. Démarrer enregistrement
# 2. Attendre 2-3 minutes (2-3 segments créés)
# 3. Cliquer "Arrêter l'enregistrement"

# ✅ Attendu :
# - Message "Enregistrement arrêté avec succès"
# - Bannière disparaît
# - Fichier final visible dans "Mes Vidéos"
# - Fichier final lisible (pas vide)
```

### Test 4: Multi-Terrains

**Vérifier isolation des enregistrements :**

```bash
# 1. Joueur A : Démarrer enregistrement terrain 1
# 2. Joueur B : Démarrer enregistrement terrain 2
# 3. Joueur A : Arrêter enregistrement terrain 1
# 4. Joueur B : Vérifier que son enregistrement continue

# ✅ Attendu :
# - Enregistrement B continue normalement
# - Fichier A créé correctement
# - Pas d'interférence entre les deux
```

### Test 5: Diagnostics (Optionnel)

**Si vous avez implémenté le composant :**

```bash
# 1. Démarrer enregistrement
# 2. Ouvrir modal diagnostics
# 3. Vérifier affichage segments, proxy, FFmpeg PID

# ✅ Attendu :
# - Nombre de segments augmente toutes les 60s
# - Port proxy affiché (ex: 8554)
# - FFmpeg PID > 0
```

---

## 📊 Résumé

### ✅ Ce Qui Fonctionne Déjà

| Composant | Status | Action Requise |
|-----------|--------|----------------|
| **AdvancedRecordingModal** | ✅ Compatible V2 | Aucune |
| **ActiveRecordingBanner** | ✅ Compatible V2 | Aucune |
| **recordingService.js** | ✅ Compatible V2 | Aucune |
| **API Endpoints** | ✅ Inchangés | Aucune |
| **Flux utilisateur** | ✅ Identique | Aucune |

### 🆕 Fonctionnalités Optionnelles

| Fonctionnalité | Utilité | Effort | Priorité |
|----------------|---------|--------|----------|
| **Endpoint diagnostics** | Debug/monitoring | 30 min | Faible |
| **Proxy status** | Dashboard admin | 20 min | Faible |
| **Indicateur segments** | UX avancée | 15 min | Très faible |
| **Health indicator** | Visibilité système | 10 min | Moyenne |

### 🎯 Recommandations

1. **Aucun changement obligatoire** - Le frontend fonctionne tel quel

2. **Tests de validation** - Tester les 4 scénarios ci-dessus pour confirmer

3. **Ajouts optionnels** - Implémenter uniquement si besoin admin/debug

4. **Gestion d'erreurs** - Améliorer les messages d'erreur (voir section Indicateurs UX)

---

## 🚀 Déploiement

### Étape 1: Backend V2 d'abord
```bash
# Appliquer migration backend (voir MIGRATION_GUIDE_V2.md)
cd padelvar-backend-main
python migrate_to_v2.py
# Modifier src/routes/recording.py
python test_recording_v2.py
```

### Étape 2: Frontend (aucun changement requis)
```bash
# Simplement redémarrer le serveur dev
cd padelvar-frontend-main
npm run dev
```

### Étape 3: Tests End-to-End
```bash
# Tester workflow complet :
# 1. Connexion joueur
# 2. Démarrer enregistrement
# 3. Attendre 2 min
# 4. Arrêter enregistrement
# 5. Vérifier fichier final
```

---

## ❓ FAQ

### Q: Dois-je modifier mon frontend ?
**R:** Non, le frontend actuel fonctionne tel quel avec V2.

### Q: Comment savoir si V2 est actif ?
**R:** Vérifier logs backend : `logs/recordings/recording_manager.log` doit afficher "📂 Segment écrit"

### Q: Les vidéos seront-elles différentes ?
**R:** Non, fichier final identique (MP4 H.264). La segmentation est transparente.

### Q: Puis-je voir les segments créés ?
**R:** Oui, avec endpoint `/api/recording/v3/diagnostics/<recording_id>` (optionnel)

### Q: Que faire si erreur "Caméra inaccessible" ?
**R:** V2 teste la caméra avant de démarrer. Vérifier connectivité réseau ou logs backend.

---

## 📞 Support

**Documentation complète :**
- Backend V2 : `RECORDING_SYSTEM_V2_README.md`
- Migration : `MIGRATION_GUIDE_V2.md`
- Résumé : `SYSTEME_V2_RESUME.md`

**Logs :**
- Backend : `logs/recordings/recording_manager.log`
- Frontend : Console navigateur (F12)

**Test rapide :**
```bash
# Backend health
curl http://localhost:5000/api/recording/v3/health

# Proxy status
curl http://localhost:5000/api/proxy/status

# Enregistrements actifs
curl http://localhost:5000/api/recording/v3/active
```

---

## ✅ Checklist Go-Live Frontend

- [ ] Backend V2 migré et testé
- [ ] Frontend redémarré (`npm run dev`)
- [ ] Test connexion joueur OK
- [ ] Test démarrage enregistrement OK
- [ ] Test arrêt enregistrement OK
- [ ] Fichier final généré et lisible
- [ ] Bannière active fonctionne
- [ ] Messages d'erreur clairs
- [ ] Logs backend sans erreur
- [ ] (Optionnel) Diagnostics endpoint testé
- [ ] (Optionnel) Proxy status testé

---

## 🎉 Conclusion

**Le frontend est prêt ! Aucune modification requise.**

Le système V2 améliore la fiabilité backend (segmentation, validation, multi-terrains) **sans impacter l'expérience utilisateur frontend**.

Les ajouts optionnels (diagnostics, health indicator) sont recommandés uniquement pour :
- Dashboard admin
- Monitoring avancé
- Debug en production

**Déployez le backend V2 en toute confiance ! 🚀**
