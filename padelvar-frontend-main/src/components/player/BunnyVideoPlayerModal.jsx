import { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Scissors } from 'lucide-react';
import VideoClipEditor from './VideoClipEditor';

export default function BunnyVideoPlayerModal({ isOpen, onClose, video }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null); // To store the HLS.js instance
  const [clipEditorOpen, setClipEditorOpen] = useState(false);

  // Debug des données vidéo reçues
  useEffect(() => {
    if (isOpen && video) {
      console.log('🎬 BUNNY MODAL OUVERT - Données vidéo reçues:', video);
      console.log('🎬 Bunny Video ID:', video.bunny_video_id || 'Non trouvé');
      console.log('🎬 URL principale:', video.url);
    }
  }, [isOpen, video]);

  // Extraire le bunny_video_id de différentes sources
  const getBunnyVideoId = () => {
    // 1. Directement depuis la vidéo
    if (video.bunny_video_id) {
      return video.bunny_video_id;
    }

    // 2. Extraire depuis l'URL si c'est une URL Bunny
    if (video.url && video.url.includes('vz-f2c97d0e-5d4.b-cdn.net')) {
      const match = video.url.match(/vz-f2c97d0e-5d4\.b-cdn\.net\/([^\/]+)/);
      if (match) {
        return match[1];
      }
    }

    // 3. Chercher dans les fallback URLs
    if (video.fallbackUrls && Array.isArray(video.fallbackUrls)) {
      for (const urlInfo of video.fallbackUrls) {
        if (urlInfo.url && urlInfo.url.includes('vz-f2c97d0e-5d4.b-cdn.net')) {
          const match = urlInfo.url.match(/vz-f2c97d0e-5d4\.b-cdn\.net\/([^\/]+)/);
          if (match) {
            return match[1];
          }
        }
      }
    }

    return null;
  };

  // Init HLS player when video opens
  useEffect(() => {
    if (!isOpen || !video || !videoRef.current) {
      // Cleanup HLS when closing
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const bunnyVideoId = getBunnyVideoId();
    if (!bunnyVideoId) return;

    // Construct m3u8 URL
    const hlsUrl = `https://vz-f2c97d0e-5d4.b-cdn.net/${bunnyVideoId}/playlist.m3u8`;
    console.log('🎬 Loading HLS URL:', hlsUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS stream loaded successfully');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data);
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = hlsUrl;
      console.log('✅ Using native HLS support');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, video]);

  if (!video) return null;

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
            <div className="text-center p-8">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Vidéo en cours de traitement</h3>
              <p className="text-gray-600 mb-4">
                Cette vidéo est en cours d'upload ou d'encodage sur Bunny CDN.
              </p>
              <p className="text-sm text-gray-500">
                Patientez quelques minutes et rafraîchissez la page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Rafraîchir
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // URL du lecteur Bunny Stream (selon leur documentation)
  const bunnyPlayerUrl = `https://iframe.mediadelivery.net/embed/475694/${bunnyVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;

  console.log('🎬 URL du lecteur Bunny générée:', bunnyPlayerUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] sm:w-full h-[95vh] sm:h-[90vh] p-0 gap-0">
        <DialogHeader className="px-3 sm:px-6 pt-3 sm:pt-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base sm:text-xl font-semibold truncate flex-1">
              {video.title || `Match du ${new Date(video.recordedAt).toLocaleDateString()}`}
            </DialogTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClipEditorOpen(true)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Créer un Clip</span>
                <span className="sm:hidden">Clip</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-black overflow-hidden flex-1" style={{ height: 'calc(95vh - 60px)' }}>
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
            style={{ objectFit: 'contain' }}
          />
        </div>
      </DialogContent>

      {/* Modal de création de clip */}
      <VideoClipEditor
        isOpen={clipEditorOpen}
        onClose={() => setClipEditorOpen(false)}
        video={video}
        onClipCreated={(clip) => {
          console.log('✂️ Clip créé:', clip);
          setClipEditorOpen(false);
        }}
      />
    </Dialog>
  );
}
