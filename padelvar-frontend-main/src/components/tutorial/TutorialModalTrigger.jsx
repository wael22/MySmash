// src/components/tutorial/TutorialModalTrigger.jsx

import { useEffect, useState } from 'react';
import { useTutorial } from '../../contexts/TutorialContext';

/**
 * Composant invisible qui auto-ouvre les modals pendant le tutoriel
 * Écoute les changements d'étape et déclenche l'ouverture des modals selon la configuration
 */
const TutorialModalTrigger = ({
    onOpenRecording,
    onOpenProfile,
    onOpenSupport,
    onOpenCredits,
    onOpenClipEditor
}) => {
    const { currentStepData, isActive, currentStep } = useTutorial();
    const [hasTriggered, setHasTriggered] = useState(false);

    // Effect pour auto-trigger les modals
    useEffect(() => {
        // Reset hasTriggered quand l'étape change
        setHasTriggered(false);
    }, [currentStep]);

    useEffect(() => {
        if (!isActive || !currentStepData?.autoTrigger || hasTriggered) {
            return;
        }

        console.log('[TUTORIAL TRIGGER] Auto-opening modal:', currentStepData.modalComponent);

        // Petit délai pour laisser l'UI se stabiliser et le spotlight se positionner
        const timer = setTimeout(() => {
            try {
                switch (currentStepData.modalComponent) {
                    case 'AdvancedRecordingModal':
                        console.log('[TUTORIAL TRIGGER] Opening AdvancedRecordingModal');
                        onOpenRecording?.();
                        break;

                    case 'ProfileModal':
                        console.log('[TUTORIAL TRIGGER] Opening ProfileModal');
                        onOpenProfile?.();
                        break;

                    case 'SupportModal':
                        console.log('[TUTORIAL TRIGGER] Opening SupportModal');
                        onOpenSupport?.();
                        break;

                    case 'BuyCreditsModal':
                        console.log('[TUTORIAL TRIGGER] Opening BuyCreditsModal');
                        onOpenCredits?.();
                        break;

                    case 'VideoClipEditor':
                        console.log('[TUTORIAL TRIGGER] Opening VideoClipEditor');
                        onOpenClipEditor?.();
                        break;

                    default:
                        console.warn('[TUTORIAL TRIGGER] Unknown modal component:', currentStepData.modalComponent);
                }

                setHasTriggered(true);
            } catch (error) {
                console.error('[TUTORIAL TRIGGER] Error opening modal:', error);
            }
        }, 800); // 800ms pour que le spotlight soit visible d'abord

        return () => clearTimeout(timer);
    }, [currentStepData, isActive, hasTriggered, onOpenRecording, onOpenProfile, onOpenSupport, onOpenCredits, onOpenClipEditor]);

    // Composant invisible
    return null;
};

export default TutorialModalTrigger;
