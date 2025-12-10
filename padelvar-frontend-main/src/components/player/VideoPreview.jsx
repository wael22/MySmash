/**
 * Composant Preview Vidéo Temps Réel
 * ===================================
 * 
 * Affiche le flux vidéo en direct depuis le proxy local
 * - Mode MJPEG stream (continu)
 * - Mode Snapshot (polling de snapshots JPEG)
 * - Indicateur d'enregistrement
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  CameraOff, 
  Loader2, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import videoSystemService from '@/services/videoSystemService';

const VideoPreview = ({ 
  sessionId, 
  isRecording = false,
  mode = 'mjpeg' // 'mjpeg' ou 'snapshot'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [previewInfo, setPreviewInfo] = useState(null);
  const imgRef = useRef(null);
  const snapshotIntervalRef = useRef(null);

  const maxRetries = 3;

  // Charger les infos du preview au montage
  useEffect(() => {
    if (sessionId) {
      loadPreviewInfo();
    }
  }, [sessionId]);

  // Gérer le mode snapshot (polling)
  useEffect(() => {
    if (mode === 'snapshot' && sessionId && !hasError) {
      startSnapshotPolling();
    }

    return () => {
      stopSnapshotPolling();
    };
  }, [mode, sessionId, hasError]);

  // Charger les infos du preview
  const loadPreviewInfo = async () => {
    try {
      const info = await videoSystemService.getPreviewInfo(sessionId);
      setPreviewInfo(info);
      
      if (!info.proxy_healthy) {
        setErrorMessage('Le proxy vidéo n\'est pas disponible');
        setHasError(true);
      }
    } catch (error) {
      console.error('Erreur chargement preview info:', error);
      setErrorMessage(error.message || 'Erreur de connexion au preview');
      setHasError(true);
    }
  };

  // Démarrer le polling de snapshots
  const startSnapshotPolling = () => {
    stopSnapshotPolling(); // Nettoyer l'ancien intervalle

    snapshotIntervalRef.current = setInterval(() => {
      if (imgRef.current) {
        // Forcer le rechargement de l'image avec un timestamp
        const snapshotUrl = videoSystemService.getSnapshotUrl(sessionId);
        imgRef.current.src = snapshotUrl;
      }
    }, 200); // 5 FPS (200ms entre chaque frame)
  };

  // Arrêter le polling de snapshots
  const stopSnapshotPolling = () => {
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
  };

  // Gestion du chargement de l'image
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorMessage('');
  };

  // Gestion des erreurs de chargement
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (mode === 'snapshot') {
      // En mode snapshot, ne pas afficher d'erreur immédiatement
      // car les frames peuvent être temporairement indisponibles
      setErrorMessage('Flux temporairement indisponible');
    } else {
      setErrorMessage('Impossible de charger le flux vidéo');
    }
  };

  // Réessayer de charger le flux
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');
      
      // Recharger les infos et l'image
      loadPreviewInfo();
      
      if (imgRef.current) {
        if (mode === 'mjpeg') {
          imgRef.current.src = videoSystemService.getStreamUrl(sessionId);
        } else {
          imgRef.current.src = videoSystemService.getSnapshotUrl(sessionId);
        }
      }
    }
  };

  // Pas de session ID
  if (!sessionId) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <CameraOff className="h-12 w-12 mx-auto mb-2" />
          <p>Aucune session active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      {/* Indicateur d'enregistrement */}
      {isRecording && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>REC</span>
          </div>
        </div>
      )}

      {/* Session ID */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-black/50 text-white px-3 py-1 rounded text-xs font-mono">
          {sessionId}
        </div>
      </div>

      {/* Mode preview */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
          {mode === 'mjpeg' ? 'Stream MJPEG' : 'Snapshots (5 FPS)'}
        </div>
      </div>

      {/* Chargement */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Chargement du flux vidéo...</p>
            <p className="text-sm text-gray-400 mt-1">
              {mode === 'mjpeg' ? 'Connexion au stream MJPEG' : 'Récupération des snapshots'}
            </p>
          </div>
        </div>
      )}

      {/* Erreur */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white px-4">
            <CameraOff className="h-8 w-8 mx-auto mb-2" />
            <p className="mb-1">{errorMessage}</p>
            <p className="text-sm text-gray-400 mb-3">
              Vérifiez que la caméra est accessible
            </p>
            
            {retryCount < maxRetries && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="text-white border-white hover:bg-white hover:text-black"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer ({retryCount + 1}/{maxRetries})
              </Button>
            )}
            
            {retryCount >= maxRetries && (
              <div className="mt-3">
                <Alert variant="destructive" className="text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Impossible de se connecter au flux après {maxRetries} tentatives.
                    Contactez l'administrateur du club.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flux vidéo */}
      <img
        ref={imgRef}
        src={mode === 'mjpeg' 
          ? videoSystemService.getStreamUrl(sessionId)
          : videoSystemService.getSnapshotUrl(sessionId)
        }
        alt="Preview caméra"
        className={`w-full h-full object-contain ${isLoading || hasError ? 'hidden' : 'block'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Santé du proxy */}
      {previewInfo && !previewInfo.proxy_healthy && (
        <div className="absolute bottom-3 right-3 z-10">
          <div className="bg-yellow-600 text-white px-2 py-1 rounded text-xs flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Proxy dégradé
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
