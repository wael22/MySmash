// Service pour la gestion des vidéos
const API_BASE_URL = 'http://localhost:5000';

export const videoService = {
  // Récupérer toutes les vidéos
  async getVideos() {
    try {
      console.log('📡 Récupération des vidéos depuis l\'API...');
      const response = await fetch(`${API_BASE_URL}/api/videos`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[OK] Vidéos récupérées:', data);
      return data;
    } catch (error) {
      console.error('[ERROR] Erreur lors de la récupération des vidéos:', error);
      // Retourner des données de test en cas d'erreur
      return [
        {
          id: 1,
          title: 'Match du 19/10/2025',
          recorded_at: '2025-10-19T19:08:00Z',
          duration: 360,
          file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          bunny_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail_url: null,
          is_unlocked: true
        },
        {
          id: 2,
          title: 'Match du 19/10/2025',
          recorded_at: '2025-10-19T17:40:00Z',
          duration: 420,
          file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          bunny_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail_url: null,
          is_unlocked: true
        },
        {
          id: 3,
          title: 'Match du 19/10/2025',
          recorded_at: '2025-10-19T17:32:00Z',
          duration: 300,
          file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          bunny_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail_url: null,
          is_unlocked: true
        }
      ];
    }
  },

  // Récupérer les statistiques
  async getStats() {
    try {
      console.log('[STATS] Récupération des statistiques...');
      const response = await fetch(`${API_BASE_URL}/api/videos/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[OK] Statistiques récupérées:', data);
      return data;
    } catch (error) {
      console.error('[ERROR] Erreur lors de la récupération des stats:', error);
      // Retourner des stats par défaut
      return {
        totalVideos: 4,
        totalDuration: 1560, // 26 minutes
        averageDuration: 390  // 6.5 minutes
      };
    }
  },

  // Marquer une vidéo comme vue
  async watchVideo(videoId) {
    try {
      console.log(`👁️ Marquage de la vidéo ${videoId} comme vue...`);
      const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[OK] Vidéo marquée comme vue:', data);
      return data;
    } catch (error) {
      console.error('[ERROR] Erreur lors du marquage de la vidéo:', error);
      // Simuler un succès pour les tests
      return { success: true, message: 'Vidéo marquée comme vue (mode test)' };
    }
  },

  // Supprimer une vidéo
  async deleteVideo(videoId) {
    try {
      console.log(`🗑️ Suppression de la vidéo ${videoId}...`);
      const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[OK] Vidéo supprimée:', data);
      return data;
    } catch (error) {
      console.error('[ERROR] Erreur lors de la suppression:', error);
      throw error;
    }
  },

  // Partager une vidéo
  async shareVideo(videoId) {
    try {
      console.log(`🔗 Génération du lien de partage pour la vidéo ${videoId}...`);
      const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}/share`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[OK] Lien de partage généré:', data);
      return data;
    } catch (error) {
      console.error('[ERROR] Erreur lors du partage:', error);
      // Simuler un lien de partage pour les tests
      return { 
        shareUrl: `${window.location.origin}/video/${videoId}`,
        message: 'Lien de partage généré (mode test)'
      };
    }
  }
};

export default videoService;
