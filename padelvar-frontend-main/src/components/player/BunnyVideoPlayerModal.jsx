import { useState, useRef, useEffect, useCallback } from 'react';
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
  const hlsRef = useRef(null);
  const [clipEditorOpen, setClipEditorOpen] = useState(false);
  const [videoElement, setVideoElement] = useState(null);

  // Callback ref to capture video element when it mounts (same as VideoClipEditor)
  const videoCallbackRef = useCallback((node) => {
    if (node) {
      videoRef.current = node;
      setVideoElement(node);
      console.log('📹 Video element mounted');
    }
  }, []);

  // Get bunny_video_id from various sources
  const getBunnyVideoId = () => {
    if (video?.bunny_video_id) {
      return video.bunny_video_id;
    }

    if (video?.url && video.url.includes('vz-f2c97d0e-5d4.b-cdn.net')) {
      const match = video.url.match(/vz-f2c97d0e-5d4\.b-cdn\.net\/([^\/]+)/);
      if (match) return match[1];
    }

    if (video?.fallbackUrls && Array.isArray(video.fallbackUrls)) {
      for (const urlInfo of video.fallbackUrls) {
        if (urlInfo.url && urlInfo.url.includes('vz-f2c97d0e-5d4.b-cdn.net')) {
          const match = urlInfo.url.match(/vz-f2c97d0e-5d4\.b-cdn\.net\/([^\/]+)/);
          if (match) return match[1];
        }
      }
    }

    return null;
  };

  // Get video URL (same as VideoClipEditor)
  const getVideoUrl = () => {
    const bunnyVideoId = getBunnyVideoId();

    if (bunnyVideoId && video?.url) {
      const match = video.url.match(/vz-([^.]+)\.b-cdn\.net/);
      if (match) {
        const libraryId = match[1];
        return `https://vz-${libraryId}.b-cdn.net/${bunnyVideoId}/playlist.m3u8`;
      }
    }

    if (bunnyVideoId) {
      return `https://vz-f2c97d0e-5d4.b-cdn.net/${bunnyVideoId}/playlist.m3u8`;
    }

    return video?.url || '';
  };

  // Initialize HLS player (same approach as VideoClipEditor)
  useEffect(() => {
    console.log('🔍 useEffect START', { hasVideo: !!video, isOpen, hasVideoElement: !!videoElement });

    if (!video || !isOpen || !videoElement) {
      console.log('❌ Skipping HLS init:', { hasVideo: !!video, isOpen, hasVideoElement: !!videoElement });
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const videoUrl = getVideoUrl();
    if (!videoUrl) {
      console.log('❌ No video URL found');
      return;
    }

    console.log('🎬 Loading video URL:', videoUrl);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isMP4 = videoUrl.includes('.mp4');
    const isHLS = videoUrl.includes('.m3u8');

    if (isMP4) {
      videoElement.src = videoUrl;
      videoElement.load();
      console.log('✅ Loading MP4 video');
    } else if (isHLS && Hls.isSupported()) {
      console.log('🎬 Creating HLS instance...');
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(videoUrl);
      hls.attachMedia(videoElement);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS Ready');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('❌ HLS Fatal error:', data);
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoElement.src = videoUrl;
      console.log('✅ Using native HLS support');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video, isOpen, videoElement]);

  // Early return AFTER all hooks
  if (!video) return null;

  const bunnyVideoId = getBunnyVideoId();

  // If no video ID, show error
  if (!bunnyVideoId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                {video.title || `Match du ${new Date(video.recordedAt).toLocaleDateString()}`}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center p-8">
              <h3 className="text-lg font-semibold mb-2">Vidéo non disponible</h3>
              <p className="text-gray-600">
                Cette vidéo n'est pas encore prête ou n'est plus disponible.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            ref={videoCallbackRef}
            className="w-full h-full"
            controls
            playsInline
            style={{ objectFit: 'contain' }}
          />
        </div>
      </DialogContent>

      {clipEditorOpen && (
        <VideoClipEditor
          isOpen={clipEditorOpen}
          onClose={() => setClipEditorOpen(false)}
          video={video}
          onClipCreated={() => {
            setClipEditorOpen(false);
          }}
        />
      )}
    </Dialog>
  );
}
