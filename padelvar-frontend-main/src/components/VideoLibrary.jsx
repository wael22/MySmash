import React, { useState, useEffect  } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Play, 
  Download, 
  Calendar,
  Clock,
  HardDrive,
  Eye,
  Search
} from 'lucide-react';

const VideoLibrary = ({ clubId, playerId }) => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [clubId, playerId]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, filterStatus]);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      // Pour l'instant, nous utilisons des données de test
            const mockVideos = [
        {
          id: 1,
          match_id: 101,
          court_id: 1,
          title: 'Match du 20/10/2025',
          filename: 'match_101_court_1_20251020_140000.mp4',
          duration_seconds: 5400, // 90 minutes
          file_size_mb: 850,
          recorded_at: '2025-10-20T14:00:00Z',
          status: 'completed',
          court_name: 'Terrain 1',
          players: ['Joueur A', 'Joueur B', 'Joueur C', 'Joueur D']
        },
        {
          id: 2,
          match_id: 102,
          court_id: 2,
          title: 'Match du 20/10/2025',
          filename: 'match_102_court_2_20251020_160000.mp4',
          duration_seconds: 4800, // 80 minutes
          file_size_mb: 720,
          recorded_at: '2025-10-20T16:00:00Z',
          status: 'completed',
          court_name: 'Terrain 2',
          players: ['Joueur E', 'Joueur F', 'Joueur G', 'Joueur H']
        },
        {
          id: 3,
          match_id: 103,
          court_id: 1,
          title: 'Match du 21/10/2025',
          filename: 'match_103_court_1_20251021_100000.mp4',
          duration_seconds: 0,
          file_size_mb: 0,
          recorded_at: '2025-10-21T10:00:00Z',
          status: 'recording',
          court_name: 'Terrain 1',
          players: ['Joueur I', 'Joueur J', 'Joueur K', 'Joueur L']
        }
      ];

      setVideos(mockVideos);
    } catch (err) {
      console.error('Erreur chargement vidéos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.players.some(player => 
          player.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        video.court_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(video => video.status === filterStatus);
    }

    setFilteredVideos(filtered);
  };

  const formatDuration = (seconds) => {
    if (seconds === 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h${mins}m` : `${mins}m`;
  };

  const formatFileSize = (mb) => {
    if (mb === 0) return 'N/A';
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'recording':
        return (
          <Badge variant="destructive" className="animate-pulse">
            Enregistrement
          </Badge>
        );
      case 'completed':
        return <Badge variant="default">Terminé</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const playVideo = (video) => {
    setSelectedVideo(video);
  };

  const downloadVideo = (video) => {
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = `/static/videos/matches/${video.filename}`;
    link.download = video.filename;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* En-tête et contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Bibliothèque Vidéo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, joueur, terrain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-md"
              />
            </div>
            
            {/* Filtre par statut */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Terminés</option>
              <option value="recording">En cours</option>
              <option value="error">Erreurs</option>
            </select>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            {filteredVideos.length} vidéo{filteredVideos.length !== 1 ? 's' : ''} trouvée{filteredVideos.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Liste des vidéos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aucune vidéo trouvée</p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  {getStatusBadge(video.status)}
                </div>
                <div className="text-sm text-gray-500">
                  {video.court_name} • Match #{video.match_id}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Miniature vidéo (placeholder) */}
                <div className="relative bg-gray-900 rounded-lg h-32 flex items-center justify-center">
                  <Video className="w-8 h-8 text-white" />
                  {video.status === 'recording' && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                      ● LIVE
                    </div>
                  )}
                </div>

                {/* Informations */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Date
                    </span>
                    <span>{formatDate(video.recorded_at)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Durée
                    </span>
                    <span>{formatDuration(video.duration_seconds)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <HardDrive className="w-4 h-4 mr-1" />
                      Taille
                    </span>
                    <span>{formatFileSize(video.file_size_mb)}</span>
                  </div>
                </div>

                {/* Joueurs */}
                <div>
                  <div className="text-sm font-medium mb-1">Joueurs:</div>
                  <div className="flex flex-wrap gap-1">
                    {video.players.map((player, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {player}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => playVideo(video)}
                    disabled={video.status !== 'completed'}
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Regarder
                  </Button>
                  
                  <Button
                    onClick={() => downloadVideo(video)}
                    disabled={video.status !== 'completed'}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de lecture vidéo */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
              <Button
                onClick={() => setSelectedVideo(null)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>
            
            {/* Lecteur vidéo */}
            <div className="bg-black rounded-lg mb-4">
              <video
                src={`/static/videos/matches/${selectedVideo.filename}`}
                controls
                className="w-full h-auto max-h-96"
                preload="metadata"
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            </div>
            
            {/* Informations détaillées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Court:</span><br />
                {selectedVideo.court_name}
              </div>
              <div>
                <span className="font-medium">Date:</span><br />
                {formatDate(selectedVideo.recorded_at)}
              </div>
              <div>
                <span className="font-medium">Durée:</span><br />
                {formatDuration(selectedVideo.duration_seconds)}
              </div>
              <div>
                <span className="font-medium">Taille:</span><br />
                {formatFileSize(selectedVideo.file_size_mb)}
              </div>
            </div>
            
            <div className="mt-4">
              <span className="font-medium">Joueurs:</span><br />
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedVideo.players.map((player, index) => (
                  <Badge key={index} variant="outline">
                    {player}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2 mt-6">
              <Button
                onClick={() => downloadVideo(selectedVideo)}
                variant="default"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              
              <Button
                onClick={() => setSelectedVideo(null)}
                variant="outline"
                className="flex-1"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-lg text-blue-600">
                {videos.filter(v => v.status === 'completed').length}
              </div>
              <div className="text-gray-500">Vidéos terminées</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-green-600">
                {videos.filter(v => v.status === 'recording').length}
              </div>
              <div className="text-gray-500">En cours</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-purple-600">
                {videos.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) / 3600 | 0}h
              </div>
              <div className="text-gray-500">Temps total</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-orange-600">
                {(videos.reduce((acc, v) => acc + (v.file_size_mb || 0), 0) / 1024).toFixed(1)} GB
              </div>
              <div className="text-gray-500">Espace utilisé</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoLibrary;
