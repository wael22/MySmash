/**
 * Service pour gérer les enregistrements vidéo
 * Intégration avec le système d'enregistrement backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class RecordingService {
  /**
   * Démarrer un enregistrement vidéo pour un match
   * @param {number} matchId - ID du match
   * @param {number} duration - Durée de l'enregistrement en secondes (optionnel)
   * @returns {Promise<Object>} Réponse du serveur
   */
  async startRecording(matchId, duration = null) {
    try {
      const payload = {};
      if (duration) {
        payload.duration = duration;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/recording/matches/${matchId}/recording/start`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Arrêter un enregistrement vidéo
   * @param {string|number} recordingIdOrMatchId - ID de l'enregistrement (ex: "rec_1_1762107366") ou ID du match
   * @returns {Promise<Object>} Réponse du serveur
   */
  async stopRecording(recordingIdOrMatchId) {
    try {
      // Si c'est un recordingId v3 (format: rec_X_TIMESTAMP)
      if (typeof recordingIdOrMatchId === 'string' && recordingIdOrMatchId.startsWith('rec_')) {
        const response = await axios.post(
          `${API_BASE_URL}/recording/v3/stop`,
          { recording_id: recordingIdOrMatchId },
          {
            headers: {
              'Authorization': `Bearer ${this.getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return response.data;
      }
      
      // Ancienne API avec matchId
      const response = await axios.post(
        `${API_BASE_URL}/recording/matches/${recordingIdOrMatchId}/recording/stop`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  /**
   * Obtenir le statut d'un enregistrement
   * @param {number} matchId - ID du match
   * @returns {Promise<Object>} Statut de l'enregistrement
   */
  async getRecordingStatus(matchId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/recording/matches/${matchId}/recording/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting recording status:', error);
      throw error;
    }
  }

  /**
   * Configurer la caméra pour un terrain
   * @param {number} courtId - ID du terrain
   * @param {string} cameraUrl - URL de la caméra
   * @returns {Promise<Object>} Réponse du serveur
   */
  async setCourtCamera(courtId, cameraUrl) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/recording/courts/${courtId}/camera`,
        { url: cameraUrl },
        {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error setting court camera:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'URL du flux vidéo pour un terrain
   * @param {number} courtId - ID du terrain
   * @returns {Promise<Object>} URL du flux vidéo
   */
  async getStreamUrl(courtId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/recording/courts/${courtId}/stream_url`,
        {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting stream URL:', error);
      throw error;
    }
  }

  /**
   * Obtenir la liste des enregistrements actifs
   * @returns {Promise<Object>} Liste des enregistrements actifs
   */
  async getActiveRecordings() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/recording/recordings/active`,
        {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting active recordings:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'enregistrement actif de l'utilisateur (API v3)
   * @returns {Promise<Object>} Enregistrement actif de l'utilisateur
   */
  async getMyActiveRecording() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/recording/v3/my-active`,
        {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`
          }
        }
      );
      
      // L'API retourne active_recordings (array), on prend le premier
      const activeRecordings = response.data.active_recordings || [];
      return {
        data: {
          active_recording: activeRecordings.length > 0 ? activeRecordings[0] : null
        }
      };
    } catch (error) {
      console.error('Error getting my active recording:', error);
      return { data: { active_recording: null } };
    }
  }

  /**
   * Obtenir l'URL du flux vidéo MJPEG pour un terrain
   * @param {number} courtId - ID du terrain
   * @returns {string} URL du flux vidéo
   */
  getStreamMjpegUrl(courtId) {
    return `${API_BASE_URL}/recording/stream/${courtId}`;
  }

  /**
   * Obtenir le token d'authentification
   * @returns {string} Token d'authentification
   */
  getToken() {
    // Récupérer le token depuis localStorage ou sessionStorage
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  }

  /**
   * Vérifier si un enregistrement est en cours
   * @param {number} matchId - ID du match
   * @returns {Promise<boolean>} True si un enregistrement est en cours
   */
  async isRecording(matchId) {
    try {
      const status = await this.getRecordingStatus(matchId);
      return status.is_recording;
    } catch (error) {
      console.error('Error checking recording status:', error);
      return false;
    }
  }
}

export default new RecordingService();
