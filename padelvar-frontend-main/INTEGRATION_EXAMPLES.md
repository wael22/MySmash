# Exemple d'Intégration dans PlayerDashboard

## 🎯 Objectif

Intégrer le nouveau système vidéo dans le `PlayerDashboard` existant.

---

## 🔄 Option 1 : Migration Progressive (Recommandé)

Garder l'ancien système en ajoutant le nouveau à côté, puis basculer progressivement.

### Modification de PlayerDashboard.jsx

```jsx
// src/pages/PlayerDashboard.jsx

import { useState, useEffect } from 'react';
import { videoService, recordingService } from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import StatCard from '@/components/player/StatCard';
import ClubFollowing from '@/components/player/ClubFollowing';

// ANCIEN SYSTÈME (garder temporairement)
import AdvancedRecordingModal from '@/components/player/AdvancedRecordingModal';
import ActiveRecordingBanner from '@/components/player/ActiveRecordingBanner';

// NOUVEAU SYSTÈME ✅
import NewRecordingModal from '@/components/player/NewRecordingModal';
import VideoListNew from '@/components/player/VideoListNew';
import VideoPreview from '@/components/player/VideoPreview';
import { useVideoRecording, useSystemHealth } from '@/hooks/useVideoSystem';

import BuyCreditsModal from '@/components/player/BuyCreditsModal';
import CreditSystemDisplay from '@/components/player/CreditSystemDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Plus, 
  Settings,
  Activity 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PlayerDashboard = () => {
  const { user, fetchUser } = useAuth();
  
  // États anciens (garder temporairement)
  const [oldRecordingModalOpen, setOldRecordingModalOpen] = useState(false);
  
  // États nouveaux ✅
  const [newRecordingModalOpen, setNewRecordingModalOpen] = useState(false);
  const [useNewSystem, setUseNewSystem] = useState(true); // Toggle pour tester
  
  // Hook santé système
  const { health } = useSystemHealth();
  
  // Autres états...
  const [stats, setStats] = useState({
    totalVideos: 0,
    recordedHours: 0,
    credits: 0
  });

  // Charger les stats
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    // Charger les stats depuis l'API
    // ...
  };

  const handleVideoCreated = (videoData) => {
    console.log('✅ Nouvelle vidéo créée:', videoData);
    
    // Rafraîchir les stats
    loadDashboardStats();
    
    // Notifier l'utilisateur
    // toast.success('Vidéo enregistrée avec succès !');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard Joueur</h1>
          <p className="text-gray-600">Bienvenue, {user?.name}</p>
        </div>

        {/* Crédits */}
        <CreditSystemDisplay />

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Vidéos"
            value={stats.totalVideos}
            icon={Video}
            trend={null}
          />
          <StatCard
            title="Heures enregistrées"
            value={stats.recordedHours}
            icon={Activity}
            trend={null}
          />
          <StatCard
            title="Crédits"
            value={user?.credits_balance || 0}
            icon={Settings}
            trend={null}
          />
        </div>

        {/* Santé du système vidéo (nouveau) */}
        {health && health.status !== 'healthy' && (
          <Alert variant="warning" className="mb-6">
            <AlertDescription>
              ⚠️ Système vidéo dégradé. Certaines fonctionnalités peuvent être limitées.
            </AlertDescription>
          </Alert>
        )}

        {/* Toggle système (pour test) */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Système d'enregistrement</p>
                <p className="text-sm text-gray-600">
                  {useNewSystem ? '✅ Nouveau système (stable)' : '⚠️ Ancien système'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setUseNewSystem(!useNewSystem)}
              >
                {useNewSystem ? 'Utiliser ancien système' : 'Utiliser nouveau système'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="videos">
              <Video className="mr-2 h-4 w-4" />
              Mes Vidéos
            </TabsTrigger>
            <TabsTrigger value="clubs">
              Clubs Suivis
            </TabsTrigger>
            <TabsTrigger value="settings">
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vidéos */}
          <TabsContent value="videos" className="space-y-4">
            {/* Bouton nouvel enregistrement */}
            <Card>
              <CardHeader>
                <CardTitle>Enregistrements</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    if (useNewSystem) {
                      setNewRecordingModalOpen(true);
                    } else {
                      setOldRecordingModalOpen(true);
                    }
                  }}
                  size="lg"
                  className="w-full"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Nouvel Enregistrement
                </Button>
              </CardContent>
            </Card>

            {/* Liste des vidéos */}
            {useNewSystem ? (
              // NOUVEAU SYSTÈME ✅
              <VideoListNew 
                clubId={user?.club_id}
                onVideoDeleted={handleVideoCreated}
              />
            ) : (
              // ANCIEN SYSTÈME (à garder temporairement)
              <MyVideoSection 
                onDataChange={loadDashboardStats}
              />
            )}
          </TabsContent>

          {/* Onglet Clubs */}
          <TabsContent value="clubs">
            <ClubFollowing />
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Paramètres utilisateur...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {useNewSystem ? (
        // NOUVEAU SYSTÈME ✅
        <NewRecordingModal
          isOpen={newRecordingModalOpen}
          onClose={() => setNewRecordingModalOpen(false)}
          onVideoCreated={handleVideoCreated}
        />
      ) : (
        // ANCIEN SYSTÈME (garder temporairement)
        <AdvancedRecordingModal
          isOpen={oldRecordingModalOpen}
          onClose={() => setOldRecordingModalOpen(false)}
          onVideoCreated={handleVideoCreated}
        />
      )}
    </div>
  );
};

export default PlayerDashboard;
```

---

## 🚀 Option 2 : Remplacement Complet (Production)

Remplacer complètement l'ancien système par le nouveau.

### PlayerDashboard.jsx (Version Finale)

```jsx
// src/pages/PlayerDashboard.jsx

import { useState, useEffect } from 'react';
import Navbar from '@/components/common/Navbar';
import StatCard from '@/components/player/StatCard';
import ClubFollowing from '@/components/player/ClubFollowing';
import BuyCreditsModal from '@/components/player/BuyCreditsModal';
import CreditSystemDisplay from '@/components/player/CreditSystemDisplay';

// NOUVEAU SYSTÈME VIDÉO ✅
import VideoRecordingDashboardNew from '@/components/player/VideoRecordingDashboardNew';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Users, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PlayerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard Joueur</h1>
          <p className="text-gray-600">Bienvenue, {user?.name}</p>
        </div>

        {/* Crédits */}
        <CreditSystemDisplay />

        {/* Tabs */}
        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="videos">
              <Video className="mr-2 h-4 w-4" />
              Vidéos
            </TabsTrigger>
            <TabsTrigger value="clubs">
              <Users className="mr-2 h-4 w-4" />
              Clubs Suivis
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vidéos (NOUVEAU SYSTÈME) */}
          <TabsContent value="videos">
            <VideoRecordingDashboardNew />
          </TabsContent>

          {/* Onglet Clubs */}
          <TabsContent value="clubs">
            <ClubFollowing />
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Paramètres utilisateur...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlayerDashboard;
```

**Avantages** :
- ✅ Plus simple (un seul système)
- ✅ Dashboard complet intégré
- ✅ Toutes les fonctionnalités dans un seul composant
- ✅ Moins de code à maintenir

---

## 🎨 Option 3 : Dashboard avec Preview Permanent

Afficher le preview en permanence + contrôles rapides.

### PlayerDashboardWithLivePreview.jsx

```jsx
import { useState } from 'react';
import { useVideoRecording } from '@/hooks/useVideoSystem';
import VideoPreview from '@/components/player/VideoPreview';
import NewRecordingModal from '@/components/player/NewRecordingModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Loader2 } from 'lucide-react';

const PlayerDashboardWithLivePreview = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  const {
    session,
    recordingStatus,
    isRecording,
    isLoading,
    stopRecording
  } = useVideoRecording();

  const handleStopQuick = async () => {
    try {
      await stopRecording();
      alert('Vidéo enregistrée avec succès !');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Vidéo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRecording ? '🔴 Enregistrement en cours' : '📹 Caméra'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session ? (
                <VideoPreview 
                  sessionId={session.session_id}
                  isRecording={isRecording}
                  mode="snapshot"
                />
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">
                    Aucune session active
                  </p>
                </div>
              )}

              {/* Contrôles rapides */}
              {isRecording && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Temps écoulé :</span>
                    <span className="font-mono">
                      {Math.floor((recordingStatus?.elapsed_seconds || 0) / 60)} min
                    </span>
                  </div>
                  
                  <Button 
                    onClick={handleStopQuick}
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Square className="mr-2 h-4 w-4" />
                    )}
                    Arrêter l'enregistrement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Actions */}
        <div className="space-y-4">
          {/* Démarrer enregistrement */}
          {!isRecording && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setModalOpen(true)}
                  className="w-full"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Nouvel Enregistrement
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Statut */}
          {recordingStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Progression :</span>
                  <span className="font-medium">
                    {recordingStatus.progress_percent}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Durée :</span>
                  <span className="font-medium">
                    {Math.floor(recordingStatus.duration_seconds / 60)} min
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mes vidéos récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vidéos récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Aperçu rapide ou lien vers liste complète */}
              <Button variant="outline" className="w-full">
                Voir toutes mes vidéos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal enregistrement */}
      <NewRecordingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onVideoCreated={handleVideoCreated}
      />
    </div>
  );
};

export default PlayerDashboardWithLivePreview;
```

---

## 🔧 Option 4 : Intégration Minimale (Quick Win)

Ajouter juste un bouton dans le dashboard existant.

### Modification Minimale de PlayerDashboard.jsx

```jsx
// src/pages/PlayerDashboard.jsx

// Ajouter ces imports en haut
import NewRecordingModal from '@/components/player/NewRecordingModal';

// Dans le composant
const [newRecordingModalOpen, setNewRecordingModalOpen] = useState(false);

// Ajouter ce bouton quelque part dans le dashboard
<Button 
  onClick={() => setNewRecordingModalOpen(true)}
  variant="default"
  size="lg"
>
  🎬 Nouvel Enregistrement (Système Stable)
</Button>

// Ajouter le modal à la fin du JSX
<NewRecordingModal
  isOpen={newRecordingModalOpen}
  onClose={() => setNewRecordingModalOpen(false)}
  onVideoCreated={(data) => {
    console.log('Vidéo créée:', data);
    // Rafraîchir la liste de vidéos
  }}
/>
```

**Avantages** :
- ✅ Changement minimal
- ✅ Test facile du nouveau système
- ✅ Garde l'ancien système en parallèle

---

## 📋 Checklist d'Intégration

### Étape 1 : Vérifier les Fichiers

- [x] `videoSystemService.js` créé
- [x] `NewRecordingModal.jsx` créé
- [x] `VideoPreview.jsx` créé
- [x] `VideoListNew.jsx` créé
- [x] `VideoRecordingDashboardNew.jsx` créé
- [x] `useVideoSystem.js` créé
- [x] `api.js` modifié

### Étape 2 : Choisir une Option

- [ ] Option 1 : Migration progressive (toggle ancien/nouveau)
- [ ] Option 2 : Remplacement complet
- [ ] Option 3 : Dashboard avec preview permanent
- [ ] Option 4 : Intégration minimale

### Étape 3 : Tester

- [ ] Bouton "Nouvel Enregistrement" s'affiche
- [ ] Modal s'ouvre au clic
- [ ] Clubs suivis se chargent
- [ ] Terrains se chargent après sélection club
- [ ] Enregistrement démarre (étape recording)
- [ ] Preview s'affiche correctement
- [ ] Statut se met à jour (polling)
- [ ] Arrêt fonctionne
- [ ] Message de confirmation s'affiche
- [ ] Vidéo apparaît dans la liste

### Étape 4 : Polir

- [ ] Ajouter toasts de notification
- [ ] Améliorer les messages d'erreur
- [ ] Ajouter animations
- [ ] Responsive mobile
- [ ] Accessibilité (ARIA labels)

---

## 🎉 Recommandation

**Pour démarrer rapidement** : Utilisez l'**Option 4** (intégration minimale)

1. Ajoutez juste le bouton dans `PlayerDashboard`
2. Testez le workflow complet
3. Une fois validé, migrez vers **Option 2** (remplacement complet)

**Pour une UI moderne** : Utilisez l'**Option 3** (dashboard avec preview permanent)

**Pour une migration sûre** : Utilisez l'**Option 1** (migration progressive)

---

## 📚 Documentation Complète

- **Backend** : `padelvar-backend-main/QUICKSTART.md`
- **Frontend Migration** : `FRONTEND_MIGRATION.md`
- **Composants** : `FRONTEND_COMPONENTS.md`
- **Intégration** : Ce document

---

**Status** : ✅ Prêt à intégrer  
**Choix recommandé** : Option 2 (remplacement complet)  
**Temps estimé** : 15-30 minutes
