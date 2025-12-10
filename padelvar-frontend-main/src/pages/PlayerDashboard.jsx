
import { useState, useEffect } from 'react';
import { videoService, recordingService } from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import StatCard from '@/components/player/StatCard';
import ClubFollowing from '@/components/player/ClubFollowing';
import AdvancedRecordingModal from '@/components/player/AdvancedRecordingModal';
import ActiveRecordingBanner from '@/components/player/ActiveRecordingBanner';
import BuyCreditsModal from '@/components/player/BuyCreditsModal';
import VideoEditorModal from '@/components/player/VideoEditorModal';
import VideoPlayerModal from '@/components/player/VideoPlayerModal';
import CreditSystemDisplay from '@/components/player/CreditSystemDisplay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Video, Clock, BarChart, Plus, QrCode, Loader2, Play, Share2, MoreHorizontal, Calendar, Lock, Unlock, Edit, Trash2, Coins, Timer, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import NotificationsTab from '@/components/player/NotificationsTab';

// ====================================================================
// COMPOSANT VIDÉO, SORTI ET AMÉLIORÉ
// ====================================================================
const MyVideoSection = ({ keyProp, onDataChange }) => {
  const { user, fetchUser } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [keyProp]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await videoService.getMyVideos();
      console.log('🎬 VIDEOS CHARGÉES:', response.data.videos);
      response.data.videos?.forEach((video, index) => {
        console.log(`📹 Vidéo ${index + 1}: ID=${video.id}, unlocked=${video.is_unlocked}, title=${video.title}`);
      });
      setVideos(response.data.videos || []);
    } catch (err) {
      console.error('[ERROR] Erreur chargement vidéos:', err);
      setError('Erreur lors du chargement des vidéos.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (video) => {
    if (user.credits_balance < video.credits_cost) {
      setActionError('Crédits insuffisants pour déverrouiller cette vidéo.');
      return;
    }
    try {
      await videoService.unlockVideo(video.id);
      await loadVideos(); // Recharger les vidéos
      await fetchUser(); // Mettre à jour le solde de crédits global
      onDataChange(); // Mettre à jour les stats du tableau de bord
    } catch (err) {
      setActionError('Erreur lors du déverrouillage.');
    }
  };

  const handleDelete = async (videoId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
      try {
        await videoService.deleteVideo(videoId);
        await loadVideos();
        onDataChange();
      } catch (err) {
        setActionError('Erreur lors de la suppression.');
      }
    }
  };

  const handleWatch = async (video) => {
    console.log('🎬 Clic sur Regarder pour vidéo:', video);
    try {
      setActionError('');
      // Récupérer les détails de la vidéo avec l'URL CDN
      console.log('📡 Appel API pour vidéo:', video.id);
      const response = await videoService.getVideo(video.id);
      const videoData = response.data.video;

      console.log('📹 Données vidéo reçues:', videoData);

      // Ouvrir le modal avec la vidéo
      if (videoData.file_url) {
        console.log('🎬 Ouverture modal avec vidéo:', videoData.file_url);
        setSelectedVideo({
          ...videoData,
          url: videoData.file_url,
          title: videoData.title || video.title,
          date: videoData.created_at || video.created_at,
          duration: videoData.duration,
          thumbnail: videoData.thumbnail_url
        });
        setIsVideoModalOpen(true);
      } else {
        console.error('[ERROR] Aucune URL de vidéo disponible');
        setActionError('URL de la vidéo non disponible.');
      }
    } catch (err) {
      console.error('[CRASH] Erreur lecture vidéo:', err);
      setActionError('Erreur lors du chargement de la vidéo.');
    }
  };

  const VideoCard = ({ video, onWatch, onDelete }) => {
    const formatDate = (dateString) => new Date(dateString).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formatDuration = (seconds) => {
      if (!seconds) return 'N/A';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
      <Card className="flex flex-col">
        <CardHeader className="p-0 relative">
          <div className="aspect-video bg-gray-200 flex items-center justify-center">
            <Play className="h-12 w-12 text-gray-400" />
          </div>
          <Badge className={`absolute top-2 right-2 ${video.is_unlocked ? 'bg-green-500' : 'bg-gray-500'}`}>
            {video.is_unlocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
            {video.is_unlocked ? 'Déverrouillée' : 'Verrouillée'}
          </Badge>
        </CardHeader>
        <CardContent className="flex-grow pt-4">
          <CardTitle className="text-lg mb-2">{video.title || `Match`}</CardTitle>
          <div className="text-sm text-gray-500 flex items-center space-x-4">
            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" />{formatDate(video.recorded_at)}</span>
            <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" />{formatDuration(video.duration)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start">
          <div className="flex w-full space-x-2">
            <button
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('� Ouverture vidéo:', video.id);
                onWatch(video);
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#1d4ed8';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#2563eb';
              }}
            >
              ▶️ Regarder Vidéo
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Share2 className="mr-2 h-4 w-4" />Partager</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(video.id)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
    );
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div>
      {actionError && <Alert variant="destructive" className="mb-4"><AlertDescription>{actionError}</AlertDescription></Alert>}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => <VideoCard key={video.id} video={video} onWatch={handleWatch} onDelete={handleDelete} />)}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Aucune vidéo pour le moment</h3>
          <p className="text-gray-500 mt-2">Commencez par enregistrer votre premier match !</p>
        </div>
      )}

      {/* Modal de lecture vidéo */}
      <VideoPlayerModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setSelectedVideo(null);
        }}
        video={selectedVideo}
      />
    </div>
  );
};

// ====================================================================
// COMPOSANT PRINCIPAL
// ====================================================================
const PlayerDashboard = () => {
  const [stats, setStats] = useState({ totalVideos: 0, totalDuration: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [dataVersion]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await videoService.getMyVideos();
      const videos = response.data.videos || [];
      const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
      setStats({ totalVideos: videos.length, totalDuration });
    } catch (error) {
      console.error("Erreur lors du chargement du tableau de bord:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = () => setDataVersion(prev => prev + 1);
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };
  const averageDuration = stats.totalVideos > 0 ? stats.totalDuration / stats.totalVideos : 0;

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Bonjour, gérez vos enregistrements !</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={Video} title="Total Vidéos" value={stats.totalVideos} />
          <StatCard icon={Clock} title="Temps Total Enregistré" value={formatDuration(stats.totalDuration)} />
          <StatCard icon={BarChart} title="Durée Moyenne" value={formatDuration(averageDuration)} />
        </div>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-4">
            <Button onClick={() => setIsModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvel Enregistrement</Button>
            <Button variant="outline"><QrCode className="h-4 w-4 mr-2" />Scanner QR Code</Button>
          </CardContent>
        </Card>
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos">Mes Vidéos</TabsTrigger>
            <TabsTrigger value="clubs">Clubs</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1 inline" />Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="videos" className="mt-6">
            <MyVideoSection keyProp={dataVersion} onDataChange={handleDataChange} />
          </TabsContent>
          <TabsContent value="clubs" className="mt-6">
            <ClubFollowing onFollowChange={handleDataChange} />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </main>
      <AdvancedRecordingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRecordingCreated={handleDataChange} />
    </div>
  );
};

export default PlayerDashboard;
