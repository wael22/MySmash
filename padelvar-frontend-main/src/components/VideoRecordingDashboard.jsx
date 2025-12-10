import React, { useState, useEffect, useRef } from 'react';

const VideoRecordingDashboard = () => {
  // États du composant
  const [cameraUrl, setCameraUrl] = useState('');
  const [isProxyActive, setIsProxyActive] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [duration, setDuration] = useState(90);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Références
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  
  // URL de base de l'API
  const API_BASE = '/api/recording';
  const PROXY_STREAM = 'http://127.0.0.1:8080/stream.mjpg';

  // Charger les données initiales
  useEffect(() => {
    loadMatches();
    checkProxyStatus();
    
    // Vérifier le statut du proxy toutes les 30 secondes
    const proxyInterval = setInterval(checkProxyStatus, 30000);
    
    return () => clearInterval(proxyInterval);
  }, []);

  // Mettre à jour le statut d'enregistrement
  useEffect(() => {
    if (recordingStatus === 'recording' && currentMatch) {
      intervalRef.current = setInterval(() => {
        updateRecordingStatus();
      }, 5000); // Toutes les 5 secondes
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [recordingStatus, currentMatch]);

  // Fonctions utilitaires
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  // API calls
  const checkProxyStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/proxy_status`);
      if (response.ok) {
        const data = await response.json();
        setIsProxyActive(data.running);
        if (data.camera_url) {
          setCameraUrl(data.camera_url);
        }
      } else {
        setIsProxyActive(false);
      }
    } catch (error) {
      setIsProxyActive(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await fetch(`${API_BASE}/matches`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      showError('Erreur lors du chargement des matches');
    }
  };

  const updateRecordingStatus = async () => {
    if (!currentMatch) return;
    
    try {
      const response = await fetch(`${API_BASE}/recording_status/${currentMatch.id}`);
      if (response.ok) {
        const data = await response.json();
        setRecordingStatus(data.recording_status);
        
        if (data.is_active) {
          setElapsedTime(data.elapsed_minutes || 0);
          setRemainingTime(data.remaining_minutes || 0);
        } else if (data.recording_status === 'done') {
          // Enregistrement terminé
          setRecordingStatus('idle');
          setCurrentMatch(null);
          setElapsedTime(0);
          setRemainingTime(0);
          showSuccess('Enregistrement terminé avec succès');
          loadMatches(); // Recharger la liste
        }
      }
    } catch (error) {
      console.error('Erreur statut enregistrement:', error);
    }
  };

  const setCameraConfig = async () => {
    if (!cameraUrl.trim()) {
      showError('Veuillez saisir une URL de caméra');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/set_camera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_url: cameraUrl })
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsProxyActive(true);
        showSuccess('Caméra configurée avec succès');
        
        // Recharger le flux vidéo
        if (videoRef.current) {
          videoRef.current.src = PROXY_STREAM + '?t=' + Date.now();
        }
      } else {
        showError(data.error || 'Erreur de configuration caméra');
      }
    } catch (error) {
      showError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async (matchId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/start_recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          duration_minutes: duration,
          title: `Match ${matchId}`,
          quality: '1280x720'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRecordingStatus('recording');
        const match = matches.find(m => m.id === matchId);
        setCurrentMatch(match);
        setElapsedTime(0);
        setRemainingTime(duration);
        showSuccess('Enregistrement démarré');
      } else {
        showError(data.error || 'Erreur de démarrage enregistrement');
      }
    } catch (error) {
      showError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    if (!currentMatch) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/stop_recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: currentMatch.id,
          reason: 'manual'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRecordingStatus('idle');
        setCurrentMatch(null);
        setElapsedTime(0);
        setRemainingTime(0);
        showSuccess('Enregistrement arrêté');
        loadMatches();
      } else {
        showError(data.error || 'Erreur d\'arrêt enregistrement');
      }
    } catch (error) {
      showError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const createTestMatch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/create_match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: 1,
          court_id: 1,
          player1_id: 1,
          player2_id: 2,
          title: `Match Test ${Date.now()}`,
          planned_duration_minutes: duration
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Match de test créé');
        loadMatches();
      } else {
        showError(data.error || 'Erreur de création du match');
      }
    } catch (error) {
      showError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* En-tête */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          🎥 Système d'Enregistrement Vidéo PadelVar
        </h1>
        <p style={{ color: '#6b7280' }}>
          Contrôle d'enregistrement des matchs avec flux caméra en temps réel
        </p>
      </div>

      {/* Messages d'état */}
      {error && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fca5a5', 
          color: '#dc2626', 
          padding: '12px 16px', 
          borderRadius: '6px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #86efac', 
          color: '#16a34a', 
          padding: '12px 16px', 
          borderRadius: '6px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          ✅ {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Configuration caméra */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            📷 Configuration Caméra
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Statut proxy */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '6px'
            }}>
              <span>Statut Proxy Vidéo:</span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: isProxyActive ? '#dcfce7' : '#fef2f2',
                color: isProxyActive ? '#166534' : '#dc2626'
              }}>
                {isProxyActive ? '✅ Actif' : '❌ Inactif'}
              </span>
            </div>

            {/* URL caméra */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                URL de la caméra IP:
              </label>
              <input
                type="url"
                value={cameraUrl}
                onChange={(e) => setCameraUrl(e.target.value)}
                placeholder="http://192.168.1.100:8080/video.mjpg"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              onClick={setCameraConfig}
              disabled={loading || !cameraUrl.trim()}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: loading || !cameraUrl.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !cameraUrl.trim() ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? '⏳' : '⚙️'} Connecter Caméra
            </button>
          </div>
        </div>

        {/* Contrôles d'enregistrement */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            🎬 Contrôles d'Enregistrement
          </h2>

          {recordingStatus === 'recording' && currentMatch ? (
            /* Enregistrement en cours */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                backgroundColor: '#fef2f2', 
                borderRadius: '8px'
              }}>
                <div style={{ color: '#dc2626', fontWeight: '500', marginBottom: '8px' }}>
                  🔴 Enregistrement en cours
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Match: {currentMatch.title || currentMatch.id}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Temps écoulé</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px' }}>{formatTime(elapsedTime)}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Temps restant</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px' }}>{formatTime(remainingTime)}</div>
                </div>
              </div>

              <button
                onClick={stopRecording}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                ⏹️ Arrêter l'Enregistrement
              </button>
            </div>
          ) : (
            /* Pas d'enregistrement */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Durée d'enregistrement:
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value={60}>1 heure</option>
                  <option value={90}>1h30</option>
                  <option value={120}>2 heures</option>
                  <option value={150}>2h30</option>
                  <option value={180}>3 heures</option>
                </select>
              </div>

              <button
                onClick={createTestMatch}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? '⏳' : '▶️'} Créer Match Test
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Flux vidéo en direct */}
      {isProxyActive && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            📹 Flux Vidéo en Direct
          </h2>
          
          <div style={{ position: 'relative', backgroundColor: 'black', borderRadius: '8px', overflow: 'hidden' }}>
            <img
              ref={videoRef}
              src={PROXY_STREAM}
              alt="Flux caméra en direct"
              style={{ width: '100%', height: '400px', objectFit: 'contain' }}
              onError={() => showError('Erreur de chargement du flux vidéo')}
            />
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              🔴 LIVE
            </div>
          </div>
        </div>
      )}

      {/* Liste des matches */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          ⏰ Matches Récents
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Titre</th>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Statut</th>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Durée prévue</th>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Vidéo</th>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.slice(0, 10).map((match) => (
                <tr key={match.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 0' }}>{match.id}</td>
                  <td style={{ padding: '8px 0' }}>{match.title || `Match ${match.id}`}</td>
                  <td style={{ padding: '8px 0' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: 
                        match.recording_status === 'recording' ? '#fef2f2' :
                        match.recording_status === 'done' ? '#f0fdf4' : '#f9fafb',
                      color: 
                        match.recording_status === 'recording' ? '#dc2626' :
                        match.recording_status === 'done' ? '#16a34a' : '#6b7280'
                    }}>
                      {match.recording_status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 0' }}>{formatTime(match.planned_duration_minutes)}</td>
                  <td style={{ padding: '8px 0' }}>
                    {match.has_video ? (
                      <a
                        href={`${API_BASE}/video/${match.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        📹 Voir vidéo
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Aucune vidéo</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    {match.recording_status === 'idle' && (
                      <button
                        onClick={() => startRecording(match.id)}
                        disabled={loading || recordingStatus === 'recording'}
                        style={{
                          backgroundColor: '#2563eb',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '12px',
                          cursor: (loading || recordingStatus === 'recording') ? 'not-allowed' : 'pointer',
                          opacity: (loading || recordingStatus === 'recording') ? 0.5 : 1
                        }}
                      >
                        Démarrer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {matches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
              Aucun match trouvé. Créez un match test pour commencer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecordingDashboard;