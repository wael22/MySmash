/**
 * Hook personnalisé pour le système vidéo
 * ========================================
 * 
 * Simplifie l'utilisation du nouveau système vidéo :
 * - Gestion de l'état d'enregistrement
 * - Polling automatique du statut
 * - Gestion des erreurs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { videoSystemService } from '@/lib/api';

export const useVideoRecording = () => {
  const [session, setSession] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const statusIntervalRef = useRef(null);

  // Démarrer un enregistrement complet
  const startRecording = useCallback(async (terrainId, durationMinutes = 90) => {
    try {
      setIsLoading(true);
      setError(null);

      // Créer session
      const sessionResponse = await videoSystemService.createSession(terrainId);
      const newSession = sessionResponse.data.session;
      setSession(newSession);

      // Démarrer enregistrement
      await videoSystemService.startRecording(newSession.session_id, durationMinutes);
      
      setIsRecording(true);
      
      // Démarrer le polling du statut
      startStatusPolling(newSession.session_id);

      return newSession;
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du démarrage');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Arrêter un enregistrement
  const stopRecording = useCallback(async () => {
    if (!session) {
      throw new Error('Aucune session active');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Arrêter l'enregistrement
      const response = await videoSystemService.stopRecording(session.session_id);
      
      // Arrêter le polling
      stopStatusPolling();
      
      setIsRecording(false);
      setRecordingStatus(null);
      
      const videoPath = response.data.video_path;
      
      // Réinitialiser la session
      setSession(null);

      return videoPath;
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de l\'arrêt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Démarrer le polling du statut
  const startStatusPolling = useCallback((sessionId) => {
    stopStatusPolling(); // Nettoyer l'ancien intervalle

    const pollStatus = async () => {
      try {
        const response = await videoSystemService.getRecordingStatus(sessionId);
        const status = response.data.status;
        
        setRecordingStatus(status);

        // Si l'enregistrement est terminé automatiquement
        if (status && !status.active) {
          stopStatusPolling();
          setIsRecording(false);
        }
      } catch (err) {
        console.error('Erreur polling statut:', err);
      }
    };

    // Premier appel immédiat
    pollStatus();

    // Puis toutes les 2 secondes
    statusIntervalRef.current = setInterval(pollStatus, 2000);
  }, []);

  // Arrêter le polling du statut
  const stopStatusPolling = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  }, []);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, [stopStatusPolling]);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    stopStatusPolling();
    setSession(null);
    setRecordingStatus(null);
    setIsRecording(false);
    setIsLoading(false);
    setError(null);
  }, [stopStatusPolling]);

  return {
    session,
    recordingStatus,
    isRecording,
    isLoading,
    error,
    startRecording,
    stopRecording,
    reset
  };
};

export const useVideoList = (clubId) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await videoSystemService.listVideos(clubId);
      setVideos(response.data.videos);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const deleteVideo = useCallback(async (sessionId) => {
    try {
      await videoSystemService.deleteVideo(sessionId, clubId);
      
      // Retirer de la liste
      setVideos(prev => prev.filter(v => v.session_id !== sessionId));
    } catch (err) {
      throw err;
    }
  }, [clubId]);

  return {
    videos,
    loading,
    error,
    loadVideos,
    deleteVideo
  };
};

export const useSystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await videoSystemService.checkHealth();
      setHealth(response.data);
    } catch (err) {
      console.error('Erreur health check:', err);
      setHealth({ status: 'error', error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    health,
    loading,
    checkHealth
  };
};
