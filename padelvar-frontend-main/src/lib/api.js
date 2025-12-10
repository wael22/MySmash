// padelvar-frontend/src/lib/api.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRedirecting = false;

// Intercepteur pour logger les requêtes
api.interceptors.request.use(
  (config) => {
    console.log('[API DEBUG] Requete:', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('[API DEBUG] Erreur dans la demande:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('[API DEBUG] Erreur de reponse:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });

    // Ne rediriger vers login QUE pour les vraies erreurs 401 (non authentifié)
    // PAS pour les erreurs 500 (erreurs serveur)
    if (error.response?.status === 401) {
      if (!isRedirecting && window.location.pathname !== '/login') {
        isRedirecting = true;
        console.warn('[API] Redirection vers login - Erreur 401');
        window.location.href = '/login';
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/update-profile', profileData),
  // NOUVELLE FONCTION
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
};

export const videoService = {
  getMyVideos: () => api.get(`/videos/my-videos?_t=${Date.now()}`),
  startRecording: (data) => api.post('/videos/record', data),
  stopRecording: (data) => api.post('/videos/stop-recording', data),
  unlockVideo: (videoId) => api.post(`/videos/${videoId}/unlock`),
  getVideo: (videoId) => api.get(`/videos/${videoId}`),
  shareVideo: (videoId, platform) => api.post(`/videos/${videoId}/share`, { platform }),
  buyCredits: (purchaseData) => api.post('/players/credits/buy', purchaseData),
  getCreditPackages: () => api.get('/players/credits/packages'),
  getPaymentMethods: () => api.get('/players/credits/payment-methods'),
  getCreditsHistory: () => api.get('/players/credits/history'),
  scanQrCode: (qrCode) => api.post('/videos/qr-scan', { qr_code: qrCode }),
  getCameraStream: (courtId) => api.get(`/videos/courts/${courtId}/camera-stream`),
  getCourtsForClub: (clubId) => api.get(`/videos/clubs/${clubId}/courts`),
  // NOUVELLES FONCTIONS AMÉLIORÉES
  updateVideo: (videoId, data) => api.put(`/videos/${videoId}`, data),
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`),
  getRecordingStatus: (recordingId) => api.get(`/videos/recording/${recordingId}/status`),
  stopRecordingById: (recordingId, data) => api.post(`/videos/recording/${recordingId}/stop`, data),
  getAvailableCourts: () => api.get('/videos/courts/available'),
  downloadVideo: (videoId) => api.get(`/videos/download/${videoId}`, { responseType: 'blob' }),
  // New endpoint for player court access
  getClubCourtsForPlayers: (clubId) => api.get(`/recording/v3/clubs/${clubId}/courts?_t=${Date.now()}`),
};

export const recordingService = {
  // Nouvelles API pour l'enregistrement avancé - système v3
  startAdvancedRecording: (data) => api.post('/recording/v3/start', data),
  stopRecording: (recordingId) => api.post(`/recording/v3/stop/${recordingId}`),
  forceStopRecording: (recordingId) => api.post(`/recording/v3/force-stop/${recordingId}`),
  getMyActiveRecording: () => api.get('/recording/v3/my-active'),
  getClubActiveRecordings: () => api.get('/recording/v3/club/active'),
  getAvailableCourts: (clubId) => api.get(`/recording/v3/available-courts/${clubId}`),
  cleanupExpiredRecordings: () => api.post('/recording/v3/cleanup-expired'),
  // New endpoints for court access
  getClubCourtsForPlayers: (clubId) => api.get(`/recording/v3/clubs/${clubId}/courts?_t=${Date.now()}`),
  getAllAvailableCourts: () => api.get('/recording/v3/available-courts'),
  // Test endpoint without authentication
  testGetClubCourts: (clubId) => api.get(`/recording/v3/test-clubs/${clubId}/courts`),
  // Debug endpoints
  debugCourts: () => api.get('/recording/v3/debug/courts'),
  debugService: () => api.get('/recording/v3/debug/service'),
  // Simple recording (fallback)
  startSimpleRecording: (data) => api.post('/recording/v3/start-simple', data),
};

export const adminService = {
  getAllUsers: () => api.get('/admin/users'),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getAllClubs: () => api.get('/admin/clubs'),
  createClub: (clubData) => api.post('/admin/clubs', clubData),
  updateClub: (clubId, clubData) => api.put(`/admin/clubs/${clubId}`, clubData),
  deleteClub: (clubId) => api.delete(`/admin/clubs/${clubId}`),
  createCourt: (clubId, courtData) => api.post(`/admin/clubs/${clubId}/courts`, courtData),
  getClubCourts: (clubId) => api.get(`/admin/clubs/${clubId}/courts`),
  updateCourt: (courtId, courtData) => api.put(`/admin/courts/${courtId}`, courtData),
  deleteCourt: (courtId) => api.delete(`/admin/courts/${courtId}`),
  getAllVideos: () => api.get('/admin/videos'),
  addCredits: (userId, credits) => api.post(`/admin/users/${userId}/credits`, { credits }),
  addCreditsToClub: (clubId, credits) => api.post(`/admin/clubs/${clubId}/credits`, { credits }),
  getAllClubsHistory: () => api.get('/admin/clubs/history/all'),

  // Configuration management
  getSystemConfig: () => api.get('/admin/config'),
  getBunnyCDNConfig: () => api.get('/admin/config/bunny-cdn'),
  updateBunnyCDNConfig: (config) => api.put('/admin/config/bunny-cdn', config),
  testBunnyCDN: (config) => api.post('/admin/config/test-bunny', config),

  // Logs management
  getLogs: (params) => api.get('/admin/logs', { params }),
  downloadLogs: () => api.get('/admin/logs/download', { responseType: 'blob' }),

  // Gestion CRUD des packages de crédits
  getCreditPackages: (type) => api.get(`/admin/credit-packages${type ? `?type=${type}` : ''}`),
  createCreditPackage: (packageData) => api.post('/admin/credit-packages', packageData),
  updateCreditPackage: (packageId, packageData) => api.put(`/admin/credit-packages/${packageId}`, packageData),
  deleteCreditPackage: (packageId) => api.delete(`/admin/credit-packages/${packageId}`),
};

export const playerService = {
  getAvailableClubs: () => api.get('/players/clubs/available'),
  followClub: (clubId) => api.post(`/players/clubs/${clubId}/follow`),
  unfollowClub: (clubId) => api.post(`/players/clubs/${clubId}/unfollow`),
  getFollowedClubs: () => api.get('/players/clubs/followed'),
};

export const supportService = {
  createMessage: (data) => api.post('/support/messages', data),
  getMyMessages: () => api.get('/support/messages'),
  // Admin routes
  getAllMessages: (params) => api.get('/support/admin/messages', { params }),
  updateMessage: (messageId, data) => api.patch(`/support/admin/messages/${messageId}`, data),
};

// Notification service
export const notificationService = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.post(`/notifications/${id}/mark-read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
};

export const clubService = {
  getDashboard: () => api.get('/clubs/dashboard'),
  getClubInfo: () => api.get('/clubs/info'),
  getCourts: () => api.get('/clubs/courts'),
  getClubVideos: () => api.get('/clubs/videos'),
  getAllClubs: () => api.get('/clubs/all'),
  getClubHistory: () => api.get('/clubs/history'),
  getFollowers: () => api.get('/clubs/followers'),
  updatePlayer: (playerId, playerData) => api.put(`/clubs/${playerId}`, playerData),
  addCreditsToPlayer: (playerId, credits) => api.post(`/clubs/${playerId}/add-credits`, { credits }),
  updateFollower: (playerId, playerData) => clubService.updatePlayer(playerId, playerData),
  addCreditsToFollower: (playerId, credits) => clubService.addCreditsToPlayer(playerId, credits),
  // NOUVELLE FONCTION
  updateClubProfile: (clubData) => api.put('/clubs/profile', clubData),
  // Fonction pour arrêter un enregistrement depuis le dashboard club
  stopRecording: (courtId) => api.post(`/clubs/courts/${courtId}/stop-recording`),
  // Fonction pour nettoyer les sessions expirées
  cleanupExpiredSessions: () => api.post('/clubs/cleanup-expired-sessions'),
  // Nouvelles routes pour la gestion des crédits du club
  buyCredits: (purchaseData) => api.post('/clubs/credits/buy', purchaseData),
  getCreditsHistory: () => api.get('/clubs/credits/history'),
  getCreditPackages: () => api.get('/clubs/credits/packages'),
  getPaymentMethods: () => api.get('/players/credits/payment-methods'), // Utilise la même route que les joueurs
};

// ==============================================
// NOUVEAU SYSTÈME VIDÉO STABLE
// ==============================================
// Pipeline : Caméra → video_proxy_server.py → FFmpeg → MP4 unique
// Pas de segmentation, pas de go2rtc/MediaMTX
// ==============================================

export const videoSystemService = {
  // Sessions
  createSession: (terrainId, cameraUrl = null) => {
    const payload = { terrain_id: terrainId };
    if (cameraUrl) payload.camera_url = cameraUrl;
    return api.post('/video/session/create', payload);
  },
  closeSession: (sessionId) => api.post('/video/session/close', { session_id: sessionId }),
  listSessions: () => api.get('/video/session/list'),
  getSession: (sessionId) => api.get(`/video/session/${sessionId}`),

  // Enregistrement
  startRecording: (sessionId, durationMinutes = 90) =>
    api.post('/video/record/start', { session_id: sessionId, duration_minutes: durationMinutes }),
  stopRecording: (sessionId) => api.post('/video/record/stop', { session_id: sessionId }),
  getRecordingStatus: (sessionId) => api.get(`/video/record/status/${sessionId}`),

  // Fichiers
  listVideos: (clubId = null) => {
    const params = clubId ? { club_id: clubId } : {};
    return api.get('/video/files/list', { params });
  },
  downloadVideo: (sessionId, clubId) =>
    api.get(`/video/files/${sessionId}/download`, {
      params: { club_id: clubId },
      responseType: 'blob'
    }),
  deleteVideo: (sessionId, clubId) =>
    api.delete(`/video/files/${sessionId}/delete`, { params: { club_id: clubId } }),

  // Preview
  getPreviewInfo: (sessionId) => api.get(`/preview/${sessionId}/info`),

  // Health & Maintenance
  checkHealth: () => api.get('/video/health'),
  cleanupSessions: () => api.post('/video/cleanup'),

  // URLs (pas d'appel API, juste construction d'URL)
  getStreamUrl: (sessionId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/api/preview/${sessionId}/stream.mjpeg?token=${token}`;
  },
  getSnapshotUrl: (sessionId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const baseUrl = API_BASE_URL.replace('/api', '');
    const timestamp = Date.now();
    return `${baseUrl}/api/preview/${sessionId}/snapshot.jpg?token=${token}&t=${timestamp}`;
  },
};

export default api;
