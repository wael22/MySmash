import React, { useState, useEffect, useRef  } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  Camera, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Monitor
} from 'lucide-react';

const RecordingControls = ({ matchId, courtId, onRecordingChange }) => {
  const [recordingStatus, setRecordingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraUrl, setCameraUrl] = useState(null);
  const [duration, setDuration] = useState(90);
  const statusIntervalRef = useRef(null);

  // Charger le statut initial et l'URL de la caméra
  useEffect(() => {
    if (matchId && courtId) {
      loadRecordingStatus();
      loadCameraUrl();
    }
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [matchId, courtId]);

  // Polling du statut si enregistrement en cours
  useEffect(() => {
    if (recordingStatus?.status === 'recording') {
      startStatusPolling();
    } else {
      stopStatusPolling();
    }
  }, [recordingStatus?.status]);

  const loadRecordingStatus = async () => {
    try {
      const response = await fetch(`/api/recording/status/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setRecordingStatus(data.status);
      } else if (response.status === 404) {
        // Pas d'enregistrement existant
        setRecordingStatus(null);
      }
    } catch (err) {
      console.error('Erreur chargement statut:', err);
    }
  };

  const loadCameraUrl = async () => {
    try {
      const response = await fetch(`/api/recording/camera/${courtId}/stream`);
      if (response.ok) {
        const data = await response.json();
        setCameraUrl(data.camera_url);
      }
    } catch (err) {
      console.error('Erreur chargement caméra:', err);
    }
  };

  const startStatusPolling = () => {
    if (statusIntervalRef.current) return;
    
    statusIntervalRef.current = setInterval(async () => {
      await loadRecordingStatus();
    }, 2000); // Vérifier toutes les 2 secondes
  };

  const stopStatusPolling = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  };

  const startRecording = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/recording/start?match_id=${matchId}&court_id=${courtId}&duration_minutes=${duration}`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setRecordingStatus(data.session);
        onRecordingChange?.(data.session);
      } else {
        setError(data.detail || 'Erreur lors du démarrage');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur start recording:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/recording/stop?match_id=${matchId}`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setRecordingStatus(data.session);
        onRecordingChange?.(data.session);
      } else {
        setError(data.detail || 'Erreur lors de l\'arrêt');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur stop recording:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!recordingStatus) {
      return <Badge variant="outline">Prêt</Badge>;
    }

    switch (recordingStatus.status) {
      case 'recording':
        return (
          <Badge variant="destructive" className="animate-pulse">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Enregistrement
          </Badge>
        );
      case 'done':
        return (
          <Badge variant="default">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Terminé
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erreur
          </Badge>
        );
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isRecording = recordingStatus?.status === 'recording';
  const canStart = !isRecording && !isLoading;
  const canStop = isRecording && !isLoading;

  return (
    <div className="space-y-4">
      {/* Contrôles d'enregistrement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Enregistrement Match {matchId}
            </span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Informations de la session */}
          {recordingStatus && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Terrain:</span> {courtId}
              </div>
              <div>
                <span className="font-medium">Démarré:</span>{' '}
                {recordingStatus.start_time ? 
                  new Date(recordingStatus.start_time).toLocaleTimeString() : 
                  'N/A'
                }
              </div>
              {recordingStatus.duration_recorded_seconds && (
                <div>
                  <span className="font-medium">Durée:</span>{' '}
                  {formatDuration(recordingStatus.duration_recorded_seconds)}
                </div>
              )}
              {recordingStatus.file_size_mb && (
                <div>
                  <span className="font-medium">Taille:</span>{' '}
                  {recordingStatus.file_size_mb.toFixed(1)} MB
                </div>
              )}
            </div>
          )}

          {/* Durée d'enregistrement */}
          {!isRecording && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <label className="text-sm font-medium">Durée (minutes):</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                min="5"
                max="300"
                className="w-20 px-2 py-1 border rounded"
              />
            </div>
          )}

          {/* Boutons de contrôle */}
          <div className="flex space-x-2">
            <Button
              onClick={startRecording}
              disabled={!canStart}
              variant={canStart ? "default" : "secondary"}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Démarrer
            </Button>
            
            <Button
              onClick={stopRecording}
              disabled={!canStop}
              variant={canStop ? "destructive" : "secondary"}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              Arrêter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu caméra */}
      {cameraUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Aperçu Terrain {courtId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img
                src={cameraUrl}
                alt={`Caméra terrain ${courtId}`}
                className="w-full h-auto max-h-64 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="hidden absolute inset-0 flex items-center justify-center text-gray-400"
              >
                <div className="text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p>Caméra non disponible</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Stream: {cameraUrl}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecordingControls;
