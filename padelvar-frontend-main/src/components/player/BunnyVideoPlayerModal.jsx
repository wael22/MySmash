import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function BunnyVideoPlayerModal({ isOpen, onClose, video }) {
  const iframeRef = useRef(null);

  // Debug des données vidéo reçues
  useEffect(() => {
    if (isOpen && video) {
      console.log('🎬 BUNNY MODAL OUVERT - Données vidéo reçues:', video);
      console.log('🎬 Bunny Video ID:', video.bunny_video_id || 'Non trouvé');
      console.log('🎬 URL principale:', video.url);
    }
  }, [isOpen, video]);

  // Nettoyer l'iframe lors de la fermeture
  useEffect(() => {
    if (!isOpen && iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
  }, [isOpen]);

  if (!video) return null;

  // Extraire le bunny_video_id de différentes sources
  const getBunnyVideoId = () => {
    // 1. Directement depuis la vidéo
    if (video.bunny_video_id) {
      return video.bunny_video_id;
    }

    // 2. Extraire depuis l'URL si c'est une URL Bunny
    if (video.url && video.url.includes('vz-82bd892c-344.b-cdn.net')) {
      const match = video.url.match(/vz-82bd892c-344\.b-cdn\.net\/([^\/]+)/);
      if (match) {
        return match[1];
      }
    }

    // 3. Chercher dans les fallback URLs
    if (video.fallbackUrls && Array.isArray(video.fallbackUrls)) {
      for (const urlInfo of video.fallbackUrls) {
        if (urlInfo.url && urlInfo.url.includes('vz-82bd892c-344.b-cdn.net')) {
          const match = urlInfo.url.match(/vz-82bd892c-344\.b-cdn\.net\/([^\/]+)/);
          if (match) {
            return match[1];
          }
        }
      }
    }

    return null;
  };

  const bunnyVideoId = getBunnyVideoId();
  console.log('🎬 Bunny Video ID extrait:', bunnyVideoId);

  // Si nous n'avons pas de Bunny Video ID, afficher un message d'erreur
  if (!bunnyVideoId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                {video.title || `Match du ${new Date(video.recordedAt).toLocaleDateString()}`}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Vidéo non disponible</h3>
              <p className="text-gray-600 mb-4">
                Aucun ID Bunny Stream trouvé pour cette vidéo.
              </p>
              <div className="text-sm text-gray-500">
                <p>URL reçue: {video.url}</p>
                <p>Source: {video.urlSource}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // URL du lecteur Bunny Stream (selon leur documentation)
  const bunnyPlayerUrl = `https://iframe.mediadelivery.net/embed/555438/${bunnyVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;

  console.log('🎬 URL du lecteur Bunny générée:', bunnyPlayerUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {video.title || `Match du ${new Date(video.recordedAt).toLocaleDateString()}`}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="bg-black overflow-hidden" style={{ height: 'calc(90vh - 80px)' }}>
          <iframe
            ref={iframeRef}
            src={bunnyPlayerUrl}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={video.title || "Bunny Stream Player"}
            onLoad={() => {
              console.log('🎬 Lecteur Bunny Stream chargé avec succès');
            }}
            onError={(e) => {
              console.error('[ERROR] Erreur lors du chargement du lecteur Bunny:', e);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
