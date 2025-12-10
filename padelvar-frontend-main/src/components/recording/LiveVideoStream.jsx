/**
 * Composant pour afficher le flux vidéo en direct d'une caméra
 */

import React, { useState, useEffect, useRef } from 'react';
import recordingService from '../../services/recordingService';
import './LiveVideoStream.css';

export const LiveVideoStream = ({ courtId, cameraUrl, onStreamUrlChange }) => {
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (cameraUrl) {
      // Utiliser l'URL de la caméra directement si fournie
      setStreamUrl(cameraUrl);
      setLoading(false);
    } else if (courtId) {
      // Obtenir l'URL du flux vidéo depuis le backend
      fetchStreamUrl();
    }
  }, [courtId, cameraUrl]);

  const fetchStreamUrl = async () => {
    try {
      setLoading(true);
      const result = await recordingService.getStreamUrl(courtId);
      setStreamUrl(result.stream_url);
      setError(null);
      if (onStreamUrlChange) {
        onStreamUrlChange(result.stream_url);
      }
    } catch (err) {
      console.error('Error fetching stream URL:', err);
      setError('Erreur lors de la récupération du flux vidéo');
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsConnected(true);
    setError(null);
  };

  const handleImageError = () => {
    setIsConnected(false);
    setError('Impossible de se connecter au flux vidéo');
  };

  const handleRetry = () => {
    setLoading(true);
    fetchStreamUrl();
  };

  return (
    <div className="live-video-stream">
      <div className="stream-header">
        <h3>Flux vidéo en direct</h3>
        {isConnected && (
          <div className="connection-indicator">
            <span className="connection-dot connected"></span>
            <span className="connection-text">Connecté</span>
          </div>
        )}
        {!isConnected && !loading && (
          <div className="connection-indicator">
            <span className="connection-dot disconnected"></span>
            <span className="connection-text">Déconnecté</span>
          </div>
        )}
      </div>

      <div className="stream-container">
        {loading ? (
          <div className="stream-loading">
            <div className="spinner"></div>
            <p>Chargement du flux vidéo...</p>
          </div>
        ) : error ? (
          <div className="stream-error">
            <p>{error}</p>
            <button className="btn btn-retry" onClick={handleRetry}>
              Réessayer
            </button>
          </div>
        ) : streamUrl ? (
          <div className="stream-wrapper">
            <img
              ref={imgRef}
              src={streamUrl}
              alt="Flux vidéo en direct"
              className="stream-image"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!isConnected && (
              <div className="stream-overlay">
                <p>Tentative de connexion...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="stream-error">
            <p>Aucune URL de flux vidéo disponible</p>
          </div>
        )}
      </div>

      <div className="stream-info">
        <p className="info-text">
          <strong>Caméra:</strong> {cameraUrl || 'Non configurée'}
        </p>
      </div>
    </div>
  );
};

export default LiveVideoStream;
