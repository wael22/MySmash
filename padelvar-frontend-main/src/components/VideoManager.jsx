import React, { useState, useEffect  } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Download, 
  Play, 
  Clock, 
  HardDrive, 
  Calendar,
  Trash2,
  RefreshCw,
  Eye
} from 'lucide-react';

const VideoManager = ({ matchId = null, courtId = null }) => {
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recording/list');
      const data = await response.json();
      
      if (response.ok) {
        let filteredRecordings = data.recordings || [];
        
        // Filtrer par match ou terrain si spécifié
        if (matchId) {
          filteredRecordings = filteredRecordings.filter(
            r => r.match_id === matchId
          );
        }
        if (courtId) {
          filteredRecordings = filteredRecordings.filter(
            r => r.court_id === courtId
          );
        }
        
        setRecordings(filteredRecordings);
      } else {
        setError(data.detail || 'Erreur chargement vidéos');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur load recordings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getVideoInfo = async (matchId) => {
    try {
      const response = await fetch(`/api/recording/video/${matchId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedVideo(data);
      } else {
        setError(data.detail || 'Vidéo non disponible');
      }
    } catch (err) {
      setError('Erreur récupération vidéo');
      console.error('Erreur get video info:', err);
    }
  };

  const cleanupRecording = async (matchId) => {
    try {
      const response = await fetch(`/api/recording/cleanup/${matchId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Recharger la liste
        loadRecordings();
      } else {
        const data = await response.json();
        setError(data.detail || 'Erreur nettoyage');
      }
    } catch (err) {
      setError('Erreur nettoyage');
      console.error('Erreur cleanup:', err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (mb) => {
    if (!mb) return 'N/A';
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'recording':
        return (
          <Badge variant="destructive" className="animate-pulse">
            En cours
          </Badge>
        );
      case 'done':
        return <Badge variant="default">Terminé</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Video className="w-5 h-5 mr-2" />
              Gestionnaire de Vidéos
              {matchId && ` - Match ${matchId}`}
              {courtId && ` - Terrain ${courtId}`}
            </span>
            <Button 
              onClick={loadRecordings}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des enregistrements */}
      <div className="space-y-3">
        {recordings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <Video className="w-8 h-8 mx-auto mb-2" />
                <p>Aucun enregistrement trouvé</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          recordings.map((recording) => (
            <Card key={recording.match_id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold">
                        Match {recording.match_id}
                      </h3>
                      {getStatusBadge(recording.status)}
                      <Badge variant="outline">
                        Terrain {recording.court_id}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(recording.start_time)}
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDuration(recording.duration_recorded_seconds)}
                      </div>
                      
                      <div className="flex items-center">
                        <HardDrive className="w-4 h-4 mr-1" />
                        {formatFileSize(recording.file_size_mb)}
                      </div>
                      
                      {recording.end_time && (
                        <div className="flex items-center">
                          <span className="text-xs">
                            Fini: {formatDate(recording.end_time)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    {recording.status === 'done' && (
                      <>
                        <Button
                          onClick={() => getVideoInfo(recording.match_id)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        
                        <Button
                          onClick={() => {
                            // Ouvrir le lien de téléchargement
                            window.open(`/static/videos/${recording.video_path?.split('/').pop()}`, '_blank');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                      </>
                    )}
                    
                    <Button
                      onClick={() => cleanupRecording(recording.match_id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Nettoyer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de visualisation vidéo */}
      {selectedVideo && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Vidéo Match {selectedVideo.match_id}</span>
              <Button
                onClick={() => setSelectedVideo(null)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Taille:</span>{' '}
                  {formatFileSize(selectedVideo.file_size_mb)}
                </div>
                <div>
                  <span className="font-medium">Durée:</span>{' '}
                  {formatDuration(selectedVideo.duration_recorded_seconds)}
                </div>
                <div>
                  <span className="font-medium">Début:</span>{' '}
                  {formatDate(selectedVideo.start_time)}
                </div>
                <div>
                  <span className="font-medium">Fin:</span>{' '}
                  {formatDate(selectedVideo.end_time)}
                </div>
              </div>

              {selectedVideo.video_url && (
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    src={selectedVideo.video_url}
                    controls
                    className="w-full h-auto max-h-96"
                    preload="metadata"
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => window.open(selectedVideo.video_url, '_blank')}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Ouvrir dans nouvel onglet
                </Button>
                <Button
                  onClick={() => window.open(selectedVideo.video_url.replace('/static/', '/api/download/'), '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {recordings.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-lg">
                  {recordings.length}
                </div>
                <div className="text-gray-500">Total</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-green-600">
                  {recordings.filter(r => r.status === 'done').length}
                </div>
                <div className="text-gray-500">Terminés</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-blue-600">
                  {recordings.filter(r => r.status === 'recording').length}
                </div>
                <div className="text-gray-500">En cours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoManager;
