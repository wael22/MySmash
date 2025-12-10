import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, AlertCircle } from 'lucide-react';

const StreamViewer = ({ terrainId, isActive = true }) => {
  const [streamError, setStreamError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const streamUrl = `${API_BASE_URL}/recording/v3/stream/${terrainId}`;

  useEffect(() => {
    setStreamError(false);
    setIsLoading(true);
  }, [terrainId]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setStreamError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setStreamError(true);
  };

  if (!terrainId || !isActive) {
    return (
      <Card className="p-6 bg-gray-50">
        <div className="flex flex-col items-center justify-center text-gray-400 py-8">
          <Video className="h-16 w-16 mb-4" />
          <p className="text-sm">Aucun flux vidéo actif</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-black aspect-video">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-white text-sm">Chargement du flux vidéo...</p>
            </div>
          </div>
        )}

        {streamError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-4">
            <Alert variant="destructive" className="bg-red-900/50 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-white">
                <p className="font-semibold mb-2">Flux vidéo indisponible</p>
                <p className="text-sm">
                  Le proxy vidéo n'est pas démarré ou la caméra n'est pas accessible.
                  <br />
                  <span className="text-xs text-gray-300 mt-1 block">
                    Mode TEST actif - L'enregistrement continue en simulation.
                  </span>
                </p>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <img
            src={streamUrl}
            alt={`Flux en direct du terrain ${terrainId}`}
            className="w-full h-full object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Overlay avec info terrain */}
        {!streamError && !isLoading && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Terrain {terrainId} - En direct</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StreamViewer;
