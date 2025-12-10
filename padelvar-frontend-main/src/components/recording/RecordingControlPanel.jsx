/**
 * Composant pour contrôler l'enregistrement vidéo
 * Permet de démarrer, arrêter et surveiller les enregistrements
 */

import React, { useState, useEffect } from 'react';
import recordingService from '../../services/recordingService';
import './RecordingControlPanel.css';

export const RecordingControlPanel = ({ matchId, courtId, onRecordingStart, onRecordingStop }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Vérifier le statut de l'enregistrement au chargement
  useEffect(() => {
    checkRecordingStatus();
    const interval = setInterval(checkRecordingStatus, 5000); // Vérifier toutes les 5 secondes
    return () => clearInterval(interval);
  }, [matchId]);

  // Mettre à jour la durée si un enregistrement est en cours
  useEffect(() => {
    if (isRecording && startTime) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRecording, startTime]);

  const checkRecordingStatus = async () => {
    try {
      const status = await recordingService.getRecordingStatus(matchId);
      setRecordingStatus(status);
      setIsRecording(status.is_recording);
      setError(null);
    } catch (err) {
      console.error('Error checking recording status:', err);
      // Ne pas afficher l'erreur si c'est une erreur d'authentification
      if (err.response?.status !== 401) {
        setError('Erreur lors de la vérification du statut');
      }
    }
  };

  const handleStartRecording = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await recordingService.startRecording(matchId);
      setIsRecording(true);
      setStartTime(Date.now());
      setDuration(0);
      setRecordingStatus(result);
      if (onRecordingStart) {
        onRecordingStart(result);
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err.response?.data?.message || 'Erreur lors du démarrage de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await recordingService.stopRecording(matchId);
      setIsRecording(false);
      setStartTime(null);
      setDuration(0);
      setRecordingStatus(result);
      if (onRecordingStop) {
        onRecordingStop(result);
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'arrêt de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="recording-control-panel">
      <div className="recording-header">
        <h3>Contrôle d'enregistrement</h3>
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-text">En cours d'enregistrement</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="recording-controls">
        {!isRecording ? (
          <button
            className="btn btn-primary btn-start-recording"
            onClick={handleStartRecording}
            disabled={loading}
          >
            {loading ? 'Démarrage...' : 'Démarrer l\'enregistrement'}
          </button>
        ) : (
          <div className="recording-active">
            <div className="duration-display">
              <span className="duration-label">Durée:</span>
              <span className="duration-value">{formatDuration(duration)}</span>
            </div>
            <button
              className="btn btn-danger btn-stop-recording"
              onClick={handleStopRecording}
              disabled={loading}
            >
              {loading ? 'Arrêt...' : 'Arrêter l\'enregistrement'}
            </button>
          </div>
        )}
      </div>

      {recordingStatus && (
        <div className="recording-status">
          <div className="status-item">
            <span className="status-label">Statut:</span>
            <span className="status-value">{recordingStatus.recording_status}</span>
          </div>
          {recordingStatus.video_path && (
            <div className="status-item">
              <span className="status-label">Fichier vidéo:</span>
              <span className="status-value">{recordingStatus.video_path}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingControlPanel;
