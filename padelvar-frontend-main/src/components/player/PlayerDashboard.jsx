// padelvar-frontend/src/pages/PlayerDashboard.jsx
// REFONTE AVEC NOUVEAU DESIGN MODERNE

import { useState, useEffect } from 'react';
import { videoService, recordingService } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/common/Navbar';
import StatCardModern from '@/components/common/StatCardModern';
import NavigationBadges from '@/components/common/NavigationBadges';
import VideoCardModern from '@/components/common/VideoCardModern';
import ClubFollowing from '@/components/player/ClubFollowing';
import AdvancedRecordingModal from '@/components/player/AdvancedRecordingModal';
import ActiveRecordingBanner from '@/components/player/ActiveRecordingBanner';
import BuyCreditsModal from '@/components/player/BuyCreditsModal';
import VideoEditorModal from '@/components/player/VideoEditorModal';
import BunnyVideoPlayerModal from '@/components/player/BunnyVideoPlayerModal';
import CreditSystemDisplay from '@/components/player/CreditSystemDisplay';
import ContactSupport from './ContactSupport';
import NotificationsTab from './NotificationsTab';
import ShareVideoModal from './ShareVideoModal';
import ClipsList from '@/components/player/ClipsList';  // 🆕 Liste des clips
import VideoClipEditor from '@/components/player/VideoClipEditor';  // 🆕 Éditeur de clips
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, Clock, BarChart, Plus, QrCode, Loader2, Building, MessageSquare, Bell, Coins, Scissors } from 'lucide-react';

const PlayerDashboard = () => {
  const { user } = useAuth();

  // États pour les données
  const [dashboardData, setDashboardData] = useState({ stats: {}, videos: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navigation par badges
  const [activeTab, setActiveTab] = useState('videos');

  // États pour les modals
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isClipEditorOpen, setIsClipEditorOpen] = useState(false);  // 🆕 Modal clip editor
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Enregistrement actif
  const [activeRecording, setActiveRecording] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
    checkActiveRecording();

    const interval = setInterval(() => {
      checkActiveRecording();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger seulement les vidéos (pas de getMyStats qui n'existe pas)
      const videosRes = await videoService.getMyVideos();

      setDashboardData({
        stats: {}, // Stats calculées côté frontend
        videos: videosRes.data.videos || []
      });
    } catch (err) {
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveRecording = async () => {
    try {
      // Utiliser getMyActiveRecording au lieu de getActiveRecording
      const response = await recordingService.getMyActiveRecording();
      setActiveRecording(response.data.recording || null);
    } catch (err) {
      console.error('Erreur vérification enregistrement:', err);
    }
  };

  // Calculs de statistiques
  const totalVideos = dashboardData.stats.total_videos || dashboardData.videos.length || 0;
  const totalDuration = dashboardData.stats.total_duration || 0;
  const avgDuration = totalVideos > 0 ? Math.round(totalDuration / totalVideos) : 0;

  // Formater la durée en minutes
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  // Handlers pour les actions vidéo
  const handlePlayVideo = (video) => {
    const videoData = {
      id: video.id,
      title: video.title || `Match du ${new Date(video.recorded_at).toLocaleDateString()}`,
      bunny_video_id: video.bunny_video_id,
      url: video.file_url || video.bunny_video_url,
      thumbnail: video.thumbnail_url,
      duration: video.duration,
      recordedAt: video.recorded_at,
    };
    setSelectedVideo(videoData);
    setIsPlayerOpen(true);
  };

  const handleShareVideo = (video) => {
    setSelectedVideo(video);
    setIsShareModalOpen(true);
  };

  const handleDownloadVideo = (video) => {
    if (video.file_url) {
      window.open(video.file_url, '_blank');
    }
  };

  const handleEditVideo = (video) => {
    setSelectedVideo(video);
    setIsEditModalOpen(true);
  };

  const handleDeleteVideo = async (video) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
      try {
        if (video.is_shared) {
          await videoService.removeSharedAccess(video.shared_video_id);
        } else {
          await videoService.deleteVideo(video.id);
        }
        await loadDashboardData();
      } catch (err) {
        setError('Erreur lors de la suppression.');
      }
    }
  };

  // 🆕 Handler pour créer un clip
  const handleCreateClip = (video) => {
    const videoData = {
      id: video.id,
      title: video.title || `Match du ${new Date(video.recorded_at).toLocaleDateString()}`,
      bunny_video_id: video.bunny_video_id,
      file_url: video.file_url || video.bunny_video_url,
      thumbnail_url: video.thumbnail_url,
      duration: video.duration,
      recorded_at: video.recorded_at,
    };
    setSelectedVideo(videoData);
    setIsClipEditorOpen(true);
  };

  // Items de navigation
  const navigationItems = [
    { value: 'videos', label: 'Mes Vidéos', icon: Video },
    { value: 'clips', label: 'Mes Clips', icon: Scissors },  // 🆕 Nouvel onglet
    { value: 'clubs', label: 'Clubs', icon: Building },
    { value: 'support', label: 'Support', icon: MessageSquare },
    { value: 'notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
    { value: 'credits', label: 'Crédits', icon: Coins }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Tableau de bord" />

      {/* Bannière enregistrement actif */}
      {activeRecording && (
        <ActiveRecordingBanner
          recording={activeRecording}
          onRefresh={checkActiveRecording}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-safe">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* === STATISTIQUES (Cartes empilées mobile, grille desktop) === */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 mb-6">
          <StatCardModern
            icon={Video}
            title="Total Vidéos"
            value={totalVideos}
            subtitle="Matchs enregistrés"
          />
          <StatCardModern
            icon={Clock}
            title="Temps Total"
            value={formatDuration(totalDuration)}
            subtitle="Minutes d'enregistrement"
          />
          <StatCardModern
            icon={BarChart}
            title="Durée Moyenne"
            value={formatDuration(avgDuration)}
            subtitle="Par vidéo"
          />
        </div>

        {/* === BOUTONS D'ACTION === */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button
            onClick={() => setIsRecordingModalOpen(true)}
            disabled={activeRecording !== null}
            className="btn-primary-modern flex-1 sm:flex-none"
          >
            <Plus className="h-5 w-5" />
            {activeRecording ? 'Enregistrement en cours...' : 'Nouvel Enregistrement'}
          </Button>

          <Button
            variant="outline"
            className="btn-secondary-modern flex-1 sm:flex-none"
          >
            <QrCode className="h-5 w-5" />
            Scanner QR Code
          </Button>
        </div>

        {/* === NAVIGATION PAR BADGES === */}
        <NavigationBadges
          items={navigationItems}
          activeValue={activeTab}
          onChange={setActiveTab}
        />

        {/* === CONTENU DES ONGLETS === */}
        <div className="mt-6">
          {/* Onglet Mes Vidéos */}
          {activeTab === 'videos' && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : dashboardData.videos.length > 0 ? (
                <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.videos.map((video) => (
                    <VideoCardModern
                      key={video.id}
                      video={video}
                      onPlay={handlePlayVideo}
                      onShare={handleShareVideo}
                      onDownload={handleDownloadVideo}
                      onEdit={handleEditVideo}
                      onDelete={handleDeleteVideo}
                      onCreateClip={handleCreateClip}  // 🆕 Handler pour créer un clip
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Aucune vidéo pour le moment
                  </h3>
                  <p className="text-gray-500">
                    Commencez par enregistrer votre premier match !
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Onglet Clips */}
          {activeTab === 'clips' && (
            <ClipsList onRefresh={() => console.log('Clips rafraîchis')} />
          )}

          {/* Onglet Clubs */}
          {activeTab === 'clubs' && (
            <ClubFollowing onDataChange={loadDashboardData} />
          )}

          {/* Onglet Support */}
          {activeTab === 'support' && (
            <ContactSupport />
          )}

          {/* Onglet Notifications */}
          {activeTab === 'notifications' && (
            <NotificationsTab onCountChange={setNotificationCount} />
          )}

          {/* Onglet Crédits */}
          {activeTab === 'credits' && (
            <CreditSystemDisplay onBuyCreditsClick={() => setIsBuyCreditsModalOpen(true)} />
          )}
        </div>
      </div>

      {/* === MODALS === */}
      <AdvancedRecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        onRecordingStarted={() => {
          setIsRecordingModalOpen(false);
          checkActiveRecording();
        }}
      />

      <BuyCreditsModal
        isOpen={isBuyCreditsModalOpen}
        onClose={() => setIsBuyCreditsModalOpen(false)}
        onSuccess={loadDashboardData}
      />


      {isShareModalOpen && selectedVideo && (
        <ShareVideoModal
          isOpen={isShareModalOpen}
          video={selectedVideo}
          onClose={() => {
            setIsShareModalOpen(false);
            setSelectedVideo(null);
          }}
          onSuccess={() => {
            loadDashboardData();
            setIsShareModalOpen(false);
            setSelectedVideo(null);
          }}
        />
      )}


      {isEditModalOpen && selectedVideo && (
        <VideoEditorModal
          video={selectedVideo}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedVideo(null);
          }}
          onSuccess={() => {
            loadDashboardData();
            setIsEditModalOpen(false);
            setSelectedVideo(null);
          }}
        />
      )}

      {isPlayerOpen && selectedVideo && (
        <BunnyVideoPlayerModal
          video={selectedVideo}
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false);
            setSelectedVideo(null);
          }}
        />
      )}

      {/* 🆕 Modal de création de clips */}
      {isClipEditorOpen && selectedVideo && (
        <VideoClipEditor
          isOpen={isClipEditorOpen}
          onClose={() => {
            setIsClipEditorOpen(false);
            setSelectedVideo(null);
          }}
          video={selectedVideo}
          onClipCreated={(clip) => {
            console.log('✂️ Clip créé:', clip);
            setIsClipEditorOpen(false);
            setSelectedVideo(null);
            // Rafraîchir l'onglet clips si actif
            if (activeTab === 'clips') {
              loadDashboardData();
            }
          }}
        />
      )}
    </div>
  );
};

export default PlayerDashboard;
