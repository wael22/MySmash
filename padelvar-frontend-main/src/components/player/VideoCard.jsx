import { useState } from 'react';
import { videoService } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import VideoPlayerModal from './VideoPlayerModal';
import HighlightsButton from './HighlightsButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Lock,
  Unlock,
  Share2,
  Download,
  MoreVertical,
  Clock,
  Calendar,
  Coins,
  Loader2,
  Scissors
} from 'lucide-react';

const VideoCard = ({ video, onVideoUnlocked, onEditVideo }) => {
  const { user } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleUnlock = async () => {
    if (user.credits_balance < video.credits_cost) {
      alert('Crédits insuffisants pour déverrouiller cette vidéo');
      return;
    }

    setIsUnlocking(true);
    try {
      await videoService.unlockVideo(video.id);
      onVideoUnlocked(video.id);
      // Mettre à jour le solde de crédits dans le contexte
      user.credits_balance -= video.credits_cost;
    } catch (error) {
      console.error('Error unlocking video:', error);
      alert('Erreur lors du déverrouillage de la vidéo');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleShare = async (platform) => {
    if (!video.is_unlocked) {
      alert('La vidéo doit être déverrouillée pour être partagée');
      return;
    }

    setIsSharing(true);
    try {
      const response = await videoService.shareVideo(video.id, platform);
      const shareUrl = response.data.share_urls[platform] || response.data.video_url;

      if (platform === 'facebook') {
        window.open(shareUrl, '_blank');
      } else if (platform === 'instagram') {
        // Pour Instagram, on copie le lien
        navigator.clipboard.writeText(shareUrl);
        alert('Lien copié ! Collez-le dans votre story Instagram');
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Lien de partage copié dans le presse-papiers');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      alert('Erreur lors du partage de la vidéo');
    } finally {
      setIsSharing(false);
    }
  };

  const handleWatch = () => {
    if (video.is_unlocked && video.file_url) {
      // Ouvrir le lecteur vidéo modal
      setShowVideoPlayer(true);
    } else if (!video.is_unlocked) {
      alert('Veuillez d\'abord débloquer cette vidéo');
    } else {
      alert('URL de la vidéo non disponible');
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {/* Thumbnail */}
        <div className="aspect-video bg-gray-200 flex items-center justify-center">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Play className="h-12 w-12 text-gray-400" />
          )}
        </div>

        {/* Badge de statut */}
        <div className="absolute top-2 right-2">
          {video.is_unlocked ? (
            <Badge variant="default" className="bg-green-500">
              <Unlock className="h-3 w-3 mr-1" />
              Déverrouillée
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Verrouillée
            </Badge>
          )}
        </div>

        {/* Durée */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
            {video.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {video.description}
              </CardDescription>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {video.is_unlocked && (
                <>
                  <DropdownMenuItem onClick={handleWatch}>
                    <Play className="mr-2 h-4 w-4" />
                    Regarder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditVideo && onEditVideo(video)}>
                    <Scissors className="mr-2 h-4 w-4" />
                    Découper
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('direct')}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Informations */}
        <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(video.recorded_at || video.created_at)}
          </div>
          {video.duration && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDuration(video.duration)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleWatch}>
              <Play className="h-4 w-4 mr-2" />
              Regarder
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={isSharing}>
                  {isSharing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Partager
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('instagram')}>
                  Instagram
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('direct')}>
                  Lien direct
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <HighlightsButton
              video={video}
              onHighlightGenerated={(highlight) => {
                console.log('Highlight generated:', highlight);
                // Optionnel: rafraîchir la liste des vidéos
              }}
            />
          </div>
        </div>

        {!video.is_unlocked && user.credits_balance < video.credits_cost && (
          <p className="text-xs text-red-500 mt-2">
            Crédits insuffisants
          </p>
        )}
      </CardContent>

      {/* Lecteur vidéo modal */}
      <VideoPlayerModal
        video={video}
        isOpen={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
      />
    </Card>
  );
};

export default VideoCard;

