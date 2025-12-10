import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, Loader2, RefreshCw } from 'lucide-react';

const CameraPreview = ({ cameraUrl, courtName, isRecording = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef(null);

  const maxRetries = 3;

  useEffect(() => {
    if (cameraUrl) {
      setIsLoading(true);
      setHasError(false);
      setRetryCount(0);
    }
  }, [cameraUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
      
      // Force reload de l'image
      if (imgRef.current) {
        imgRef.current.src = `${cameraUrl}?t=${Date.now()}`;
      }
    }
  };

  if (!cameraUrl) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <CameraOff className="h-12 w-12 mx-auto mb-2" />
          <p>Aucune caméra configurée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      {/* Indicateur d'enregistrement */}
      {isRecording && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>REC</span>
          </div>
        </div>
      )}

      {/* Nom du terrain */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-black/50 text-white px-3 py-1 rounded text-sm">
          {courtName}
        </div>
      </div>

      {/* Flux de la caméra */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Chargement du flux caméra...</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <CameraOff className="h-8 w-8 mx-auto mb-2" />
            <p className="mb-3">Impossible de charger la caméra</p>
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
          </div>
        </div>
      )}

      {/* Image de la caméra */}
      <img
        ref={imgRef}
        src={`${cameraUrl}?t=${Date.now()}`}
        alt={`Caméra ${courtName}`}
        className={`w-full h-full object-cover ${isLoading || hasError ? 'hidden' : 'block'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Overlay pour le statut */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-black/50 text-white px-3 py-1 rounded text-sm">
              <Camera className="h-4 w-4" />
              <span>Flux en direct</span>
            </div>
            {isRecording && (
              <div className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                Enregistrement en cours
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraPreview;
