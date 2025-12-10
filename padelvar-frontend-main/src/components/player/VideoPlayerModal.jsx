import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack, 
  SkipForward,
  Download,
  Share2,
  Settings,
  X
} from 'lucide-react';

export default function VideoPlayerModal({ isOpen, onClose, video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [allUrls, setAllUrls] = useState([]);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Debug des données vidéo reçues et réinitialisation
  useEffect(() => {
    if (isOpen && video) {
      console.log('🎬 MODAL OUVERT - Données vidéo reçues:', video);
      console.log('🎬 URL vidéo principale:', video.url);
      console.log('🎬 Type de stream:', video.isHLS ? 'HLS' : 'Standard MP4');
      console.log('🎬 URLs de fallback:', video.fallbackUrls);
      
      // Préparer toutes les URLs disponibles
      const urls = [
        { url: video.url, source: video.urlSource || 'Principal', isHLS: video.isHLS || false }
      ];
      
      if (video.fallbackUrls && Array.isArray(video.fallbackUrls)) {
        video.fallbackUrls.forEach(urlInfo => {
          urls.push({
            ...urlInfo,
            isHLS: urlInfo.source === 'Bunny HLS'
          });
        });
      }
      
      setAllUrls(urls);
      setCurrentUrlIndex(0);
      
      console.log('🎬 Toutes les URLs préparées:', urls);
      
      // Réinitialiser les états
      setHasError(false);
      setErrorMessage('');
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (!video.url) {
        console.error('[ERROR] ERREUR: Aucune URL vidéo fournie!');
        setHasError(true);
        setErrorMessage('Aucune URL vidéo fournie');
        setIsLoading(false);
      }
    }
  }, [isOpen, video]);

  // Formats de temps
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen]);

  // Gestion de la visibilité des contrôles
  useEffect(() => {
    const handleMouseMove = () => {
      setIsControlsVisible(true);
      clearTimeout(controlsTimeoutRef.current);
      
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setIsControlsVisible(false);
        }, 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) {
          setIsControlsVisible(false);
        }
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Événements vidéo
  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
  };

  // Contrôles de lecture
  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const skipBackward = () => {
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const skipForward = () => {
    videoRef.current.currentTime = Math.min(
      videoRef.current.duration, 
      videoRef.current.currentTime + 10
    );
  };

  const handleSeek = (value) => {
    const time = (value[0] / 100) * duration;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Contrôles audio
  const adjustVolume = (delta) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Plein écran
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  };

  // Vitesse de lecture
  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
  };

  // Téléchargement
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `${video.title || 'video'}.mp4`;
    link.click();
  };

  // Partage
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Regardez cette vidéo: ${video.title}`,
          url: video.url,
        });
      } catch (err) {
        console.log('Erreur de partage:', err);
      }
    } else {
      // Fallback - copier l'URL
      navigator.clipboard.writeText(video.url);
      alert('URL copiée dans le presse-papiers !');
    }
  };

  const resetVideo = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoading(true);
    setIsBuffering(false);
    setPlaybackRate(1);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = 1;
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetVideo();
    }
  }, [isOpen, video]);

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-6xl p-0 bg-black ${isFullscreen ? 'fixed inset-0 max-w-none' : ''}`}
        ref={containerRef}
      >
        {!isFullscreen && (
          <DialogHeader className="absolute top-4 left-4 z-50">
            <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
              {video.title || 'Vidéo'}
              <div className="flex gap-1">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-white/20 text-white border-white/30"
                >
                  {allUrls[currentUrlIndex]?.source || 'Source inconnue'}
                </Badge>
                {allUrls[currentUrlIndex]?.isHLS && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-blue-500/80 text-white border-blue-400"
                  >
                    HLS
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
        )}

        {/* Bouton fermer */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Conteneur vidéo */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={allUrls[currentUrlIndex]?.url || video.url}
            className="w-full h-auto max-h-[70vh]"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => {
              const error = e.target.error;
              console.error('[ERROR] ERREUR VIDÉO:', error);
              console.error('[ERROR] Code erreur:', error?.code);
              console.error('[ERROR] Message erreur:', error?.message);
              console.error('[ERROR] URL vidéo problématique:', video.url);
              console.error('[ERROR] Objet vidéo complet:', video);
              
              // Détecter le type d'erreur
              let errorType = 'Erreur inconnue';
              if (error) {
                switch (error.code) {
                  case 1: errorType = 'MEDIA_ERR_ABORTED - Lecture annulée'; break;
                  case 2: errorType = 'MEDIA_ERR_NETWORK - Erreur réseau'; break;
                  case 3: errorType = 'MEDIA_ERR_DECODE - Erreur de décodage'; break;
                  case 4: errorType = 'MEDIA_ERR_SRC_NOT_SUPPORTED - Format non supporté'; break;
                }
              }
              
              // Essayer l'URL suivante si disponible
              const nextIndex = currentUrlIndex + 1;
              if (nextIndex < allUrls.length) {
                const nextUrl = allUrls[nextIndex];
                console.log(`🔄 Tentative URL suivante (${nextIndex + 1}/${allUrls.length}):`, nextUrl);
                console.log(`🔄 Type: ${nextUrl.isHLS ? 'HLS' : 'MP4'}, Source: ${nextUrl.source}`);
                
                setCurrentUrlIndex(nextIndex);
                setIsLoading(true);
                setHasError(false);
                
                // Changer la source vidéo
                if (videoRef.current) {
                  videoRef.current.src = nextUrl.url;
                  videoRef.current.load();
                }
              } else {
                // Plus d'URLs à essayer
                console.error('[ERROR] Toutes les URLs ont échoué');
                setIsLoading(false);
                setIsBuffering(false);
                setHasError(true);
                setErrorMessage(`${errorType}\n\nToutes les sources ont échoué (${allUrls.length} tentatives)\nDernière URL: ${allUrls[currentUrlIndex]?.url}`);
              }
            }}
            onLoadStart={() => {
              console.log('🎬 Début de chargement vidéo:', video.url);
              setIsLoading(true);
            }}
            poster={video.thumbnail}
            crossOrigin="anonymous"
          />

          {/* Overlay de chargement */}
          {(isLoading || isBuffering) && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-sm text-center">
                Chargement depuis <strong>{allUrls[currentUrlIndex]?.source || 'source inconnue'}</strong>
              </p>
              {allUrls[currentUrlIndex]?.isHLS && (
                <p className="text-xs mt-1 text-blue-300">Stream adaptatif HLS</p>
              )}
              {currentUrlIndex > 0 && (
                <p className="text-xs mt-2 text-gray-300">
                  Tentative {currentUrlIndex + 1}/{allUrls.length}
                </p>
              )}
            </div>
          )}

          {/* Overlay d'erreur */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-8">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-bold mb-2">Erreur de chargement vidéo</h3>
              <p className="text-center mb-4 max-w-md">{errorMessage}</p>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong>URL:</strong> {video.url}</p>
                <p><strong>Titre:</strong> {video.title}</p>
              </div>
              <Button 
                onClick={() => {
                  setHasError(false);
                  setErrorMessage('');
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="mt-4"
              >
                🔄 Réessayer
              </Button>
            </div>
          )}

          {/* Contrôles vidéo */}
          <div 
            className={`absolute inset-0 transition-opacity duration-300 ${
              isControlsVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Bouton play central */}
            {!isPlaying && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <Play className="h-10 w-10 ml-1" />
                </Button>
              </div>
            )}

            {/* Barre de contrôles */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Barre de progression */}
              <div className="mb-4">
                <Slider
                  value={[duration ? (currentTime / duration) * 100 : 0]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Contrôles principaux */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Lecture/Pause */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  {/* Reculer/Avancer */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipBackward}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipForward}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <div className="w-24">
                      <Slider
                        value={[isMuted ? 0 : volume * 100]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Temps */}
                  <div className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Vitesse de lecture */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-white hover:bg-white/20">
                        <Settings className="h-5 w-5 mr-1" />
                        {playbackRate}x
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                        <DropdownMenuItem
                          key={rate}
                          onClick={() => handlePlaybackRateChange(rate)}
                          className={playbackRate === rate ? 'bg-accent' : ''}
                        >
                          {rate}x
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Télécharger */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-5 w-5" />
                  </Button>

                  {/* Partager */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>

                  {/* Plein écran */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations vidéo */}
        {!isFullscreen && (
          <div className="p-4 bg-gray-900 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">
                {video.title || 'Vidéo'}
              </h3>
              <div className="flex items-center space-x-2">
                {video.date && (
                  <Badge variant="secondary">
                    {new Date(video.date).toLocaleDateString('fr-FR')}
                  </Badge>
                )}
                {video.duration && (
                  <Badge variant="outline">
                    {formatTime(video.duration)}
                  </Badge>
                )}
              </div>
            </div>
            
            {video.description && (
              <p className="text-gray-300 text-sm">
                {video.description}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
