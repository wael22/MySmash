/**
 * Service API pour la gestion des clips vidéo
 */

import api from '@/lib/api';

const clipService = {
    /**
     * Créer un nouveau clip
     */
    async createClip(videoId, startTime, endTime, title, description = '') {
        const response = await api.post('/clips/create', {
            video_id: videoId,
            start_time: startTime,
            end_time: endTime,
            title,
            description
        });
        return response.data;
    },

    /**
     * Récupérer un clip
     */
    async getClip(clipId) {
        const response = await api.get(`/clips/${clipId}`);
        return response.data;
    },

    /**
     * Récupérer tous les clips d'une vidéo
     */
    async getVideoClips(videoId) {
        const response = await api.get(`/clips/video/${videoId}`);
        return response.data;
    },

    /**
     * Récupérer tous les clips de l'utilisateur connecté
     */
    async getMyClips() {
        const response = await api.get('/clips/my-clips');
        return response.data;
    },

    /**
     * Supprimer un clip
     */
    async deleteClip(clipId) {
        const response = await api.delete(`/clips/${clipId}`);
        return response.data;
    },

    /**
     * Obtenir les liens de partage pour un clip
     */
    async getShareLinks(clipId, platform = null) {
        const body = platform ? { platform } : {};
        const response = await api.post(`/clips/${clipId}/share`, body);
        return response.data;
    },

    /**
     * Enregistrer un téléchargement
     */
    async trackDownload(clipId) {
        const response = await api.post(`/clips/${clipId}/download`);
        return response.data;
    },

    /**
     * Obtenir les meta tags Open Graph
     */
    async getClipMeta(clipId) {
        const response = await api.get(`/clips/${clipId}/meta`);
        return response.data;
    }
};

export default clipService;
