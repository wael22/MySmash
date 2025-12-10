import { useState, useEffect } from 'react';
import { videoService } from '../../lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Play, Share2, MoreHorizontal, Calendar, Lock, Unlock } from 'lucide-react';
import VideoPlayerModal from './VideoPlayerModal';

const VideoList = () => {
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await videoService.getMyVideos();
      setAllVideos(response.data.videos || []);
    } catch (err) {
      setError('Erreur lors du chargement des vidéos.');
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchVideo = (video) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleUnlockVideo = async (video) => {
    try {
      await videoService.unlockVideo(video.id);
      loadVideos(); // Recharger la liste
    } catch (err) {
      setError('Erreur lors du déverrouillage de la vidéo.');
      console.error('Error unlocking video:', err);
    }
  };

  const unlockedVideos = allVideos.filter(v => v.is_unlocked);
  const lockedVideos = allVideos.filter(v => !v.is_unlocked);

  const VideoCard = ({ video }) => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    };

    return (
      <Card className="flex flex-col">
        <CardHeader className="p-0 relative">
          <div className="aspect-video bg-gray-200 flex items-center justify-center">
            <Play className="h-12 w-12 text-gray-400" />
          </div>
          {/* Badge pour indiquer le statut de la vidéo */}
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full ${
            video.is_unlocked 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {video.is_unlocked ? <Unlock className="h-3 w-3 inline-block mr-1" /> : <Lock className="h-3 w-3 inline-block mr-1" />}
            {video.is_unlocked ? 'Déverrouillée' : 'Verrouillée'}
          </span>
        </CardHeader>
        <CardContent className="flex-grow pt-4">
          <CardTitle className="text-lg mb-2 flex justify-between items-center">
            <span>{video.title || `Match du ${formatDate(video.recorded_at)}`}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Modifier</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">Supprimer</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
          <div className="text-sm text-gray-500 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(video.recorded_at)}
          </div>
        </CardContent>
        <CardFooter>
          {video.is_unlocked ? (
            <>
              <Button className="w-full mr-2" onClick={() => handleWatchVideo(video)}>
                <Play className="h-4 w-4 mr-2" />Regarder
              </Button>
              <Button variant="outline" className="w-full"><Share2 className="h-4 w-4 mr-2" />Partager</Button>
            </>
          ) : (
            <Button className="w-full" variant="secondary" onClick={() => handleUnlockVideo(video)}>
              <Lock className="h-4 w-4 mr-2" />
              Déverrouiller (1 crédit)
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">Toutes les vidéos ({allVideos.length})</TabsTrigger>
        <TabsTrigger value="unlocked">Déverrouillées ({unlockedVideos.length})</TabsTrigger>
        <TabsTrigger value="locked">Verrouillées ({lockedVideos.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="mt-6">
        {allVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allVideos.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        ) : <p className="text-center text-gray-500 py-8">Aucune vidéo enregistrée.</p>}
      </TabsContent>

      <TabsContent value="unlocked" className="mt-6">
        {unlockedVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedVideos.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        ) : <p className="text-center text-gray-500 py-8">Vous n'avez aucune vidéo déverrouillée.</p>}
      </TabsContent>

      <TabsContent value="locked" className="mt-6">
        {lockedVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedVideos.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        ) : <p className="text-center text-gray-500 py-8">Vous n'avez aucune vidéo verrouillée.</p>}
      </TabsContent>

      {/* Modal pour lire les vidéos */}
      {selectedVideo && (
        <VideoPlayerModal 
          video={selectedVideo}
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
        />
      )}
    </Tabs>
  );
};

export default VideoList; 
