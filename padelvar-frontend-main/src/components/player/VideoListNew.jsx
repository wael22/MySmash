/**
 * Composant Liste des Vidéos (Nouveau Système)
 * =============================================
 * 
 * Affiche les vidéos enregistrées avec le nouveau système
 * - Liste des fichiers MP4
 * - Téléchargement
 * - Suppression (admin)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Download, 
  Trash2, 
  Video, 
  Calendar,
  HardDrive,
  Loader2,
  RefreshCw
} from 'lucide-react';
import videoSystemService from '@/services/videoSystemService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const VideoListNew = ({ clubId, onVideoDeleted }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger les vidéos au montage
  useEffect(() => {
    loadVideos();
  }, [clubId]);

  // Charger la liste des vidéos
  const loadVideos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const videosList = await videoSystemService.listVideos(clubId);
      setVideos(videosList);
      
      console.log('✅ Vidéos chargées:', videosList);
    } catch (error) {
      console.error('❌ Erreur chargement vidéos:', error);
      setError(error.message || 'Erreur lors du chargement des vidéos');
    } finally {
      setLoading(false);
    }
  };

  // Télécharger une vidéo
  const handleDownload = async (video) => {
    try {
      console.log('📥 Téléchargement de:', video.session_id);
      await videoSystemService.downloadVideo(video.session_id, clubId);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement de la vidéo');
    }
  };

  // Ouvrir le dialogue de suppression
  const openDeleteDialog = (video) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  // Supprimer une vidéo
  const handleDelete = async () => {
    if (!videoToDelete) return;

    try {
      setIsDeleting(true);
      
      await videoSystemService.deleteVideo(videoToDelete.session_id, clubId);
      
      // Retirer la vidéo de la liste
      setVideos(prev => prev.filter(v => v.session_id !== videoToDelete.session_id));
      
      // Notifier le parent si callback fournie
      if (onVideoDeleted) {
        onVideoDeleted(videoToDelete);
      }
      
      console.log('✅ Vidéo supprimée:', videoToDelete.session_id);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression de la vidéo');
    } finally {
      setIsDeleting(false);
    }
  };

  // Formater la date
  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp * 1000); // timestamp en secondes
      return format(date, 'PPP à HH:mm', { locale: fr });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  // Chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">Chargement des vidéos...</p>
        </div>
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <Video className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadVideos}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Aucune vidéo
  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium mb-1">Aucune vidéo</p>
            <p className="text-sm">
              Les vidéos enregistrées apparaîtront ici
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Liste des vidéos
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Vidéos enregistrées</h3>
          <p className="text-sm text-gray-600">
            {videos.length} vidéo{videos.length > 1 ? 's' : ''} disponible{videos.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadVideos}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Grille de vidéos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card key={video.session_id} className="overflow-hidden">
            {/* Thumbnail (placeholder pour l'instant) */}
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Video className="h-12 w-12 text-white/50" />
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono truncate">
                {video.filename}
              </CardTitle>
              <CardDescription className="flex items-center text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(video.created_at)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Infos */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center">
                  <HardDrive className="h-3 w-3 mr-1" />
                  <span>{videoSystemService.formatFileSize(video.size_mb)}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  MP4
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleDownload(video)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openDeleteDialog(video)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogue de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la vidéo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La vidéo 
              <strong className="font-mono text-sm"> {videoToDelete?.filename} </strong>
              sera définitivement supprimée du serveur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VideoListNew;
