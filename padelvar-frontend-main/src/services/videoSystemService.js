/**
 * Nouveau Service Vidéo PadelVar
 * ================================
 * 
 * Utilise la nouvelle architecture backend :
 * - Caméra → video_proxy_server.py → FFmpeg → MP4 unique
 * - Pas de segmentation
 * - Proxy universel pour tous les flux
 * 
 * Endpoints :
 * - /api/video/session/*     (Sessions caméra)
 * - /api/video/record/*      (Enregistrement)
 * - /api/video/files/*       (Fichiers vidéo)
 * - /api/preview/<id>/*      (Preview temps réel)
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class VideoSystemService {
  /**
   * Obtenir le token d'authentification
   */
  getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  }

  /**
   * Headers par défaut avec authentification
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    };
  }

  // ======================
  // SESSIONS CAMÉRA
  // ======================

  /**
   * Créer une session caméra avec proxy
   * @param {number} terrainId - ID du terrain
   * @param {string} cameraUrl - URL de la caméra (optionnel, sera récupéré depuis Court)
   * @returns {Promise<Object>} Session créée
   */
  async createSession(terrainId, cameraUrl = null) {
    try {
      const payload = { terrain_id: terrainId };
      if (cameraUrl) {
        payload.camera_url = cameraUrl;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/video/session/create`,
        payload,
        { headers: this.getHeaders() }
      );

      console.log('✅ Session créée:', response.data.session);
      return response.data.session;
    } catch (error) {
      console.error('❌ Erreur création session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Fermer une session (seulement si pas d'enregistrement actif)
   * @param {string} sessionId - ID de la session
   */
  async closeSession(sessionId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/video/session/close`,
        { session_id: sessionId },
        { headers: this.getHeaders() }
      );

      console.log('✅ Session fermée:', sessionId);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur fermeture session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Lister toutes les sessions actives (filtrées selon le rôle)
   */
  async listSessions() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/video/session/list`,
        { headers: this.getHeaders() }
      );

      return response.data.sessions;
    } catch (error) {
      console.error('❌ Erreur liste sessions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les détails d'une session
   * @param {string} sessionId - ID de la session
   */
  async getSession(sessionId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/video/session/${sessionId}`,
        { headers: this.getHeaders() }
      );

      return response.data.session;
    } catch (error) {
      console.error('❌ Erreur récupération session:', error);
      throw this.handleError(error);
    }
  }

  // ======================
  // ENREGISTREMENT
  // ======================

  /**
   * Démarrer un enregistrement
   * @param {string} sessionId - ID de la session
   * @param {number} durationMinutes - Durée en minutes (défaut: 90)
   */
  async startRecording(sessionId, durationMinutes = 90) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/video/record/start`,
        {
          session_id: sessionId,
          duration_minutes: durationMinutes
        },
        { headers: this.getHeaders() }
      );

      console.log('✅ Enregistrement démarré:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur démarrage enregistrement:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Arrêter un enregistrement
   * @param {string} sessionId - ID de la session
   * @returns {Promise<Object>} Chemin du fichier vidéo créé
   */
  async stopRecording(sessionId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/video/record/stop`,
        { session_id: sessionId },
        { headers: this.getHeaders() }
      );

      console.log('✅ Enregistrement arrêté:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur arrêt enregistrement:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir le statut d'un enregistrement
   * @param {string} sessionId - ID de la session
   */
  async getRecordingStatus(sessionId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/video/record/status/${sessionId}`,
        { headers: this.getHeaders() }
      );

      return response.data.status;
    } catch (error) {
      console.error('❌ Erreur statut enregistrement:', error);
      throw this.handleError(error);
    }
  }

  // ======================
  // FICHIERS VIDÉO
  // ======================

  /**
   * Lister les fichiers vidéo d'un club
   * @param {number} clubId - ID du club (optionnel si user a club_id)
   */
  async listVideos(clubId = null) {
    try {
      const params = clubId ? { club_id: clubId } : {};
      const response = await axios.get(
        `${API_BASE_URL}/api/video/files/list`,
        {
          headers: this.getHeaders(),
          params
        }
      );

      return response.data.videos;
    } catch (error) {
      console.error('❌ Erreur liste vidéos:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Télécharger une vidéo
   * @param {string} sessionId - ID de la session
   * @param {number} clubId - ID du club
   * @returns {string} URL de téléchargement
   */
  getDownloadUrl(sessionId, clubId) {
    const token = this.getToken();
    return `${API_BASE_URL}/api/video/files/${sessionId}/download?club_id=${clubId}&token=${token}`;
  }

  /**
   * Télécharger une vidéo (avec axios pour gérer le blob)
   */
  async downloadVideo(sessionId, clubId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/video/files/${sessionId}/download`,
        {
          headers: this.getHeaders(),
          params: { club_id: clubId },
          responseType: 'blob'
        }
      );

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${sessionId}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Vidéo téléchargée:', sessionId);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer une vidéo (admin uniquement)
   * @param {string} sessionId - ID de la session
   * @param {number} clubId - ID du club
   */
  async deleteVideo(sessionId, clubId) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/video/files/${sessionId}/delete`,
        {
          headers: this.getHeaders(),
          params: { club_id: clubId }
        }
      );

      console.log('✅ Vidéo supprimée:', sessionId);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      throw this.handleError(error);
    }
  }

  // ======================
  // PREVIEW TEMPS RÉEL
  // ======================

  /**
   * Obtenir l'URL du stream MJPEG en direct
   * @param {string} sessionId - ID de la session
   * @returns {string} URL du stream
   */
  getStreamUrl(sessionId) {
    const token = this.getToken();
    return `${API_BASE_URL}/api/preview/${sessionId}/stream.mjpeg?token=${token}`;
  }

  /**
   * Obtenir l'URL d'un snapshot JPEG
   * @param {string} sessionId - ID de la session
   * @returns {string} URL du snapshot
   */
  getSnapshotUrl(sessionId) {
    const token = this.getToken();
    const timestamp = Date.now();
    return `${API_BASE_URL}/api/preview/${sessionId}/snapshot.jpg?token=${token}&t=${timestamp}`;
  }

  /**
   * Obtenir les infos du preview
   * @param {string} sessionId - ID de la session
   */
  async getPreviewInfo(sessionId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/preview/${sessionId}/info`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erreur info preview:', error);
      throw this.handleError(error);
    }
  }

  // ======================
  // HEALTH & MAINTENANCE
  // ======================

  /**
   * Vérifier la santé du système vidéo
   */
  async checkHealth() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/video/health`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erreur health check:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Nettoyer les sessions orphelines (admin uniquement)
   */
  async cleanupSessions() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/video/cleanup`,
        {},
        { headers: this.getHeaders() }
      );

      console.log('✅ Cleanup effectué:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur cleanup:', error);
      throw this.handleError(error);
    }
  }

  // ======================
  // WORKFLOW COMPLET
  // ======================

  /**
   * Workflow complet : Créer session + Démarrer enregistrement
   * @param {number} terrainId - ID du terrain
   * @param {number} durationMinutes - Durée en minutes
   * @returns {Promise<Object>} { session, recording }
   */
  async startFullRecording(terrainId, durationMinutes = 90) {
    try {
      // 1. Créer session
      const session = await this.createSession(terrainId);

      // 2. Démarrer enregistrement
      const recording = await this.startRecording(session.session_id, durationMinutes);

      console.log('✅ Workflow complet démarré:', { session, recording });

      return {
        session,
        recording,
        sessionId: session.session_id
      };
    } catch (error) {
      console.error('❌ Erreur workflow complet:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Workflow complet : Arrêter enregistrement + Fermer session
   * @param {string} sessionId - ID de la session
   * @returns {Promise<Object>} { videoPath }
   */
  async stopFullRecording(sessionId) {
    try {
      // 1. Arrêter enregistrement
      const result = await this.stopRecording(sessionId);

      // 2. La session est automatiquement fermée par le backend après stop

      console.log('✅ Workflow complet arrêté:', result);

      return result;
    } catch (error) {
      console.error('❌ Erreur workflow complet:', error);
      throw this.handleError(error);
    }
  }

  // ======================
  // UTILITAIRES
  // ======================

  /**
   * Gérer les erreurs de façon uniforme
   */
  handleError(error) {
    if (error.response) {
      // Erreur avec réponse du serveur
      const message = error.response.data?.error || error.response.data?.message || error.message;
      return new Error(message);
    } else if (error.request) {
      // Erreur réseau (pas de réponse)
      return new Error('Erreur réseau : impossible de contacter le serveur');
    } else {
      // Autre erreur
      return new Error(error.message || 'Erreur inconnue');
    }
  }

  /**
   * Formater la durée en minutes:secondes
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formater la taille de fichier
   */
  formatFileSize(sizeMB) {
    if (sizeMB < 1) {
      return `${(sizeMB * 1024).toFixed(0)} KB`;
    } else if (sizeMB < 1024) {
      return `${sizeMB.toFixed(2)} MB`;
    } else {
      return `${(sizeMB / 1024).toFixed(2)} GB`;
    }
  }
}

// Exporter une instance singleton
export default new VideoSystemService();
