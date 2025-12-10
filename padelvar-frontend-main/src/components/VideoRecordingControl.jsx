import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Square,
  Camera,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

const VideoRecordingControl = ({ clubId }) => {
  const [courts, setCourts] = useState([]);
  const [cameras, setCameras] = useState({});
  const [activeRecordings, setActiveRecordings] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(90);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [sessionMap, setSessionMap] = useState({}); // 🆕 Map court_id -> session_id

  // Charger les données initiales
  useEffect(() => {
    if (clubId) {
      loadCourts();
      loadCameras();
      loadActiveRecordings();
      checkSystemHealth();
    }
  }, [clubId]);

  // Polling des enregistrements actifs
  useEffect(() => {
    const interval = setInterval(() => {
      if (clubId) {
        loadActiveRecordings();
      }
    }, 5000); // Toutes les 5 secondes

    return () => clearInterval(interval);
  }, [clubId]);

  const loadCourts = async () => {
    try {
      const response = await fetch(`/api/recording/v3/clubs/${clubId}/courts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCourts(data.courts || []);
      }
    } catch (err) {
      console.error('Erreur chargement terrains:', err);
    }
  };

  const loadCameras = async () => {
    try {
      const response = await fetch('/api/recording/v3/cameras', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCameras(data.cameras || {});
      }
    } catch (err) {
      console.error('Erreur chargement caméras:', err);
    }
  };

  const loadActiveRecordings = async () => {
    try {
      // 🆕 Utiliser le nouveau endpoint
      const response = await fetch('/api/video/session/list', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];

        // Convertir en format compatible
        const recordings = sessions
          .filter(s => s.recording_active)
          .map(s => ({
            court_id: s.terrain_id,
            match_id: s.session_id,
            status: 'recording',
            start_time: s.created_at,
            elapsed_seconds: Math.floor((new Date() - new Date(s.created_at)) / 1000),
            session_id: s.session_id
          }));

        setActiveRecordings(recordings);

        // Mettre à jour le map session
        const newMap = {};
        sessions.forEach(s => {
          newMap[s.terrain_id] = s.session_id;
        });
        setSessionMap(newMap);
      }
    } catch (err) {
      console.error('Erreur chargement enregistrements:', err);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // 🆕 Utiliser le nouveau endpoint
      const response = await fetch('/api/video/health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth({
          status: data.status,
          ffmpeg_available: data.ffmpeg_available,
          configured_cameras: 0,
          free_space_gb: 0
        });
      }
    } catch (err) {
      console.error('Erreur health check:', err);
    }
  };

  const startRecording = async (courtId) => {
    setIsLoading(true);
    setError(null);

    try {
      // 🆕 NOUVEAU SYSTÈME: 2 étapes (session + recording)

      // Étape 1: Créer session caméra
      console.log('📹 Création session pour terrain', courtId);
      const sessionResponse = await fetch('/api/video/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          terrain_id: courtId
        })
      });

      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok) {
        setError(sessionData.error || 'Erreur création session');
        return;
      }

      const sessionId = sessionData.session.session_id;
      console.log('✅ Session créée:', sessionId);

      // Étape 2: Démarrer enregistrement
      console.log('🎬 Démarrage enregistrement');
      const recordResponse = await fetch('/api/video/record/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          duration_minutes: recordingDuration
        })
      });

      const recordData = await recordResponse.json();

      if (recordResponse.ok) {
        console.log('✅ Enregistrement démarré');
        // Mettre à jour le map
        setSessionMap(prev => ({ ...prev, [courtId]: sessionId }));
        // Recharger
        loadActiveRecordings();
      } else {
        setError(recordData.error || 'Erreur démarrage enregistrement');
      }
    } catch (err) {
      setError('Erreur de connexion: ' + err.message);
      console.error('Erreur start recording:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async (matchId) => {
    setIsLoading(true);
    setError(null);

    try {
      // 🆕 Utiliser le nouveau endpoint avec session_id
      console.log('🛑 Arrêt enregistrement:', matchId);
      const response = await fetch('/api/video/record/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: matchId // matchId est en fait le session_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Enregistrement arrêté:', data.video_path);
        // Recharger
        loadActiveRecordings();
      } else {
        setError(data.error || 'Erreur lors de l\'arrêt');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur stop recording:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCamera = async (courtId, cameraUrl) => {
    try {
      const response = await fetch('/api/recording/v3/set_camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          court_id: courtId,
          camera_url: cameraUrl,
          camera_name: `Terrain ${courtId}`
        })
      });

      if (response.ok) {
        loadCameras();
      }
    } catch (err) {
      console.error('Erreur mise à jour caméra:', err);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingForCourt = (courtId) => {
    return activeRecordings.find(r => r.court_id === courtId);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec état système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Enregistrement Vidéo (Nouveau Système ✅)
            </span>
            {systemHealth && (
              <Badge
                variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}
              >
                {systemHealth.status === 'healthy' ? (
                  <CheckCircle className="w-4 h-4 mr-1" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-1" />
                )}
                {systemHealth.status}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">
              <AlertCircle className="inline w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <label className="text-sm font-medium">Durée d'enregistrement:</label>
              <select
                value={recordingDuration}
                onChange={(e) => setRecordingDuration(parseInt(e.target.value))}
                className="px-3 py-1 border rounded-md"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h30</option>
                <option value={120}>2 heures</option>
              </select>
            </div>

            {systemHealth && (
              <div className="text-sm text-gray-600">
                Enregistrements actifs: {activeRecordings.length} |
                FFmpeg: {systemHealth.ffmpeg_available ? '✅ OK' : '❌ ERROR'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des terrains avec contrôles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map((court) => {
          const recording = getRecordingForCourt(court.id);
          const camera = cameras[court.id];
          const isRecording = recording?.status === 'recording';

          return (
            <Card key={court.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{court.name}</span>
                  {isRecording && (
                    <Badge variant="destructive" className="animate-pulse">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-ping" />
                      REC
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Aperçu caméra */}
                {camera?.url && (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden h-40">
                    <img
                      src={camera.url}
                      alt={`Caméra ${court.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="hidden absolute inset-0 flex items-center justify-center text-white"
                    >
                      <div className="text-center">
                        <Camera className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Caméra non disponible</p>
                      </div>
                    </div>

                    {/* Overlay d'enregistrement */}
                    {isRecording && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        ● ENREGISTREMENT
                      </div>
                    )}
                  </div>
                )}

                {/* Informations d'enregistrement */}
                {recording && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Session ID:</span>
                      <span className="font-mono text-xs">{recording.session_id.substring(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durée écoulée:</span>
                      <span className="font-mono">
                        {formatDuration(recording.elapsed_seconds || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Début:</span>
                      <span>{new Date(recording.start_time).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}

                {/* Contrôles */}
                <div className="flex space-x-2">
                  {!isRecording ? (
                    <Button
                      onClick={() => startRecording(court.id)}
                      disabled={isLoading}
                      className="flex-1"
                      variant="default"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Démarrer
                    </Button>
                  ) : (
                    <Button
                      onClick={() => stopRecording(recording.session_id)}
                      disabled={isLoading}
                      className="flex-1"
                      variant="destructive"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Square className="w-4 h-4 mr-2" />
                      )}
                      Arrêter
                    </Button>
                  )}

                  <Button
                    onClick={() => setSelectedCourt(court)}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                {/* URL de la caméra */}
                {camera?.url && (
                  <div className="text-xs text-gray-500 truncate">
                    📹 {camera.url}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de configuration (simplifié) */}
      {selectedCourt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Configuration {selectedCourt.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  URL de la caméra:
                </label>
                <input
                  type="text"
                  defaultValue={cameras[selectedCourt.id]?.url || ''}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="http://camera-ip/stream.mjpg"
                  onBlur={(e) => {
                    if (e.target.value) {
                      updateCamera(selectedCourt.id, e.target.value);
                    }
                  }}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => setSelectedCourt(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques système */}
      {systemHealth && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-lg text-blue-600">
                  {activeRecordings.length}
                </div>
                <div className="text-gray-500">Enregistrements actifs</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-green-600">
                  {courts.length}
                </div>
                <div className="text-gray-500">Terrains</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-purple-600">
                  {systemHealth.status}
                </div>
                <div className="text-gray-500">Statut système</div>
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {systemHealth.ffmpeg_available ? '✅ OK' : '❌ ERROR'}
                </div>
                <div className="text-gray-500">FFmpeg</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoRecordingControl;
