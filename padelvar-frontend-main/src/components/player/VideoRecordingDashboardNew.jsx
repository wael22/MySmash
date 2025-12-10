/**
 * Dashboard Enregistrement Vidéo (Nouveau Système)
 * =================================================
 * 
 * Vue complète pour gérer les enregistrements :
 * - Créer nouvelle session
 * - Démarrer/arrêter enregistrement
 * - Voir preview temps réel
 * - Gérer les vidéos enregistrées
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Play, 
  Square, 
  Activity,
  FileVideo,
  Settings,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import NewRecordingModal from './NewRecordingModal';
import VideoListNew from './VideoListNew';
import videoSystemService from '@/services/videoSystemService';
import { useAuth } from '@/hooks/useAuth';

const VideoRecordingDashboardNew = () => {
  const { user } = useAuth();
  
  // États
  const [activeTab, setActiveTab] = useState('record');
  const [recordingModalOpen, setRecordingModalOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Charger la santé du système au montage
  useEffect(() => {
    loadSystemHealth();
    loadActiveSessions();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      loadSystemHealth();
      loadActiveSessions();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Charger la santé du système
  const loadSystemHealth = async () => {
    try {
      setLoadingHealth(true);
      const health = await videoSystemService.checkHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Erreur health check:', error);
    } finally {
      setLoadingHealth(false);
    }
  };

  // Charger les sessions actives
  const loadActiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const sessions = await videoSystemService.listSessions();
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Gérer la création d'une vidéo
  const handleVideoCreated = (videoData) => {
    console.log('✅ Vidéo créée:', videoData);
    
    // Rafraîchir les données
    loadActiveSessions();
    
    // Basculer sur l'onglet vidéos
    setActiveTab('videos');
  };

  // Gérer la suppression d'une vidéo
  const handleVideoDeleted = (video) => {
    console.log('🗑️ Vidéo supprimée:', video);
    // Le composant VideoListNew gère déjà le rafraîchissement
  };

  // Sessions en cours d'enregistrement
  const recordingSessions = activeSessions.filter(s => s.recording_active);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🎬 Enregistrement Vidéo</h1>
        <p className="text-gray-600">
          Gérez vos enregistrements et vidéos avec le nouveau système stable
        </p>
      </div>

      {/* Santé du système */}
      {systemHealth && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Statut du système</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={loadSystemHealth}
                disabled={loadingHealth}
              >
                {loadingHealth ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge 
                variant={systemHealth.status === 'healthy' ? 'success' : 'destructive'}
                className="text-xs"
              >
                {systemHealth.status === 'healthy' ? '✅ Opérationnel' : '⚠️ Dégradé'}
              </Badge>
              
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-gray-500" />
                <span>
                  {systemHealth.active_sessions || 0} session{systemHealth.active_sessions > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Video className="h-4 w-4 text-red-500" />
                <span>
                  {systemHealth.active_recordings || 0} enregistrement{systemHealth.active_recordings > 1 ? 's' : ''}
                </span>
              </div>

              {!systemHealth.ffmpeg_available && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    FFmpeg non disponible. Contactez l'administrateur.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions en cours d'enregistrement */}
      {recordingSessions.length > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <Video className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>{recordingSessions.length}</strong> enregistrement{recordingSessions.length > 1 ? 's' : ''} en cours.
            {recordingSessions.length === 1 && (
              <span> Session : <code className="text-xs">{recordingSessions[0].session_id}</code></span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="record">
            <Play className="h-4 w-4 mr-2" />
            Enregistrer
          </TabsTrigger>
          <TabsTrigger value="videos">
            <FileVideo className="h-4 w-4 mr-2" />
            Mes Vidéos
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Activity className="h-4 w-4 mr-2" />
            Sessions actives
          </TabsTrigger>
        </TabsList>

        {/* Onglet Enregistrer */}
        <TabsContent value="record" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Démarrer un enregistrement</CardTitle>
              <CardDescription>
                Enregistrez votre match en quelques clics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setRecordingModalOpen(true)}
                size="lg"
                className="w-full"
                disabled={recordingSessions.length > 0}
              >
                <Play className="mr-2 h-5 w-5" />
                Nouvel Enregistrement
              </Button>
              
              {recordingSessions.length > 0 && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Arrêtez l'enregistrement en cours avant d'en démarrer un nouveau
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline d'enregistrement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Caméra IP (MJPEG / RTSP / HTTP)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Proxy vidéo local (stabilisation)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>FFmpeg (encodage H.264)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>Fichier MP4 unique (pas de segmentation)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Vidéos */}
        <TabsContent value="videos">
          <VideoListNew 
            clubId={user?.club_id}
            onVideoDeleted={handleVideoDeleted}
          />
        </TabsContent>

        {/* Onglet Sessions actives */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sessions actives</CardTitle>
                  <CardDescription>
                    {activeSessions.length} session{activeSessions.length > 1 ? 's' : ''} en cours
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadActiveSessions}
                  disabled={loadingSessions}
                >
                  {loadingSessions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune session active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <Card key={session.session_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-mono text-sm font-medium">
                              {session.session_id}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span>Terrain #{session.terrain_id}</span>
                              <span>•</span>
                              <span>Port {session.proxy_port}</span>
                              <span>•</span>
                              <span>{session.camera_type.toUpperCase()}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            {session.recording_active ? (
                              <Badge variant="destructive">
                                🔴 Enregistrement actif
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                ⏸️ En pause
                              </Badge>
                            )}
                            
                            {session.verified && (
                              <Badge variant="success" className="text-xs">
                                ✅ Vérifié
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal d'enregistrement */}
      <NewRecordingModal
        isOpen={recordingModalOpen}
        onClose={() => setRecordingModalOpen(false)}
        onVideoCreated={handleVideoCreated}
      />
    </div>
  );
};

export default VideoRecordingDashboardNew;
