/**
 * Service API pour les Highlights
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const highlightsService = {
    /**
     * Démarre la génération de highlights pour une vidéo
     */
    generateHighlights: async (videoId, targetDuration = 90) => {
        const token = localStorage.getItem('token');

        const response = await axios.post(
            `${API_URL}/api/highlights/generate`,
            {
                video_id: videoId,
                target_duration: targetDuration
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    },

    /**
     * Récupère le statut d'un job de génération
     */
    getJobStatus: async (jobId) => {
        const response = await axios.get(`${API_URL}/api/highlights/jobs/${jobId}/status`);
        return response.data;
    },

    /**
     * Liste tous les highlights d'une vidéo
     */
    getVideoHighlights: async (videoId) => {
        const response = await axios.get(`${API_URL}/api/highlights/video/${videoId}`);
        return response.data;
    },

    /**
     * Liste tous les jobs de l'utilisateur connecté
     */
    getUserJobs: async () => {
        const token = localStorage.getItem('token');

        const response = await axios.get(
            `${API_URL}/api/highlights/jobs`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        return response.data;
    },

    /**
     * Annule un job en cours
     */
    cancelJob: async (jobId) => {
        const token = localStorage.getItem('token');

        const response = await axios.post(
            `${API_URL}/api/highlights/jobs/${jobId}/cancel`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        return response.data;
    }
};

export default highlightsService;
