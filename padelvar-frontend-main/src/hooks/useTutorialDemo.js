// src/hooks/useTutorialDemo.js

import { useMemo } from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import {
    dummyVideos,
    dummyClips,
    dummyClub,
    dummyVideo,
    mergeWithDummyData,
} from '../config/tutorialDummyData';

/**
 * Hook pour gérer l'affichage des données virtuelles pendant le tutoriel
 * 
 * @returns {Object} - État du mode démo et données virtuelles
 */
export const useTutorialDemo = () => {
    const { isActive, currentStep, currentStepData } = useTutorial();

    // Déterminer si on est en mode démo
    const isDemoMode = isActive && currentStepData?.showDummyData;

    // Obtenir les données virtuelles selon le type d'étape
    const dummyData = useMemo(() => {
        if (!isDemoMode || !currentStepData) {
            return null;
        }

        switch (currentStepData.dummyDataType) {
            case 'videos':
                return dummyVideos;
            case 'clips':
                return dummyClips;
            case 'club':
                return dummyClub;
            case 'video':
                return dummyVideo;
            default:
                return null;
        }
    }, [isDemoMode, currentStepData]);

    // Fonction pour fusionner données réelles et virtuelles
    const mergeData = (realData) => {
        if (!isDemoMode) {
            return realData;
        }

        return mergeWithDummyData(realData, dummyData, isDemoMode);
    };

    // Fonction pour vérifier si on doit afficher les données démo
    const shouldShowDummy = (realData) => {
        // Afficher les dummy si:
        // 1. Le tutoriel est actif
        // 2. L'étape actuelle demande des données démo
        // 3. Il n'y a pas de données réelles ou peu de données
        return isDemoMode && (!realData || realData.length === 0);
    };

    // Fonction pour obtenir une vidéo démo (pour modals)
    const getDemoVideo = () => {
        return currentStepData?.useDummyVideo ? dummyVideo : null;
    };

    // Fonction pour vérifier si un modal doit s' auto-ouvrir
    const shouldAutoTriggerModal = () => {
        return isActive && currentStepData?.autoTrigger;
    };

    // Obtenir le nom du modal à ouvrir
    const getModalToTrigger = () => {
        return currentStepData?.modalComponent || null;
    };

    // Obtenir les substeps de l'étape actuelle
    const getSubsteps = () => {
        return currentStepData?.substeps || [];
    };

    return {
        // État
        isDemoMode,
        isActive,
        currentStep,

        // Données
        dummyData,
        dummyVideos,
        dummyClips,
        dummyClub,

        // Fonctions
        mergeData,
        shouldShowDummy,
        getDemoVideo,
        shouldAutoTriggerModal,
        getModalToTrigger,
        getSubsteps,

        // Métadonnées de l'étape
        showDummyData: currentStepData?.showDummyData || false,
        dummyDataType: currentStepData?.dummyDataType || null,
        autoTrigger: currentStepData?.autoTrigger || false,
        modalComponent: currentStepData?.modalComponent || null,
        substeps: currentStepData?.substeps || [],
    };
};

export default useTutorialDemo;
