// src/components/tutorial/TutorialOverlay.jsx

import { useEffect, useRef } from 'react';
import { useTutorial } from '../../contexts/TutorialContext';
import TutorialTooltip from './TutorialTooltip';
import './Tutorial.css';

const TutorialOverlay = () => {
    const {
        isActive,
        currentStep,
        totalSteps,
        currentStepData,
        currentSubstepData,  // ✅ Ajouter substep data
        nextStep,
        previousStep,
        skipTutorial,
    } = useTutorial();

    const spotlightRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;

        // ✅ Délai pour laisser les modals se rendre avant de calculer la position
        const timer = setTimeout(() => {
            updateSpotlight();
        }, 400); // 400ms pour que le modal soit visible

        window.addEventListener('resize', updateSpotlight);
        window.addEventListener('scroll', updateSpotlight);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateSpotlight);
            window.removeEventListener('scroll', updateSpotlight);
            removeHighlights();
        };
    }, [isActive, currentStepData, currentSubstepData]);  // ✅ Ajouter currentSubstepData aux dépendances

    const updateSpotlight = () => {
        // ✅ Utiliser le substep si disponible, sinon l'étape principale
        const displayStep = currentSubstepData || currentStepData;

        if (!displayStep.highlightElement && !currentStepData.highlightElement) {
            return;
        }

        const targetSelector = displayStep.targetSelector || currentStepData.targetSelector;
        if (!targetSelector) return;

        const targetElement = document.querySelector(targetSelector);
        if (!targetElement || !spotlightRef.current) {
            console.warn('[TUTORIAL] Element not found, retrying...:', targetSelector);
            // ✅ Réessayer après un délai si l'élément n'est pas trouvé (modal en cours de rendu)
            setTimeout(() => {
                const retryElement = document.querySelector(targetSelector);
                if (retryElement && spotlightRef.current) {
                    console.log('[TUTORIAL] ✅ Element found on retry:', targetSelector);
                    positionSpotlight(retryElement);
                }
            }, 600);
            return;
        }

        positionSpotlight(targetElement);
    };

    const positionSpotlight = (targetElement) => {
        if (!spotlightRef.current) return;

        const rect = targetElement.getBoundingClientRect();
        const padding = 8;

        spotlightRef.current.style.top = `${rect.top - padding + window.scrollY}px`;
        spotlightRef.current.style.left = `${rect.left - padding}px`;
        spotlightRef.current.style.width = `${rect.width + padding * 2}px`;
        spotlightRef.current.style.height = `${rect.height + padding * 2}px`;

        // Add class to target element for higher z-index
        targetElement.classList.add('tutorial-target-element');
    };

    const removeHighlights = () => {
        document.querySelectorAll('.tutorial-target-element').forEach(el => {
            el.classList.remove('tutorial-target-element');
        });
    };

    if (!isActive) return null;

    return (
        <div className="tutorial-overlay">
            {/* Backdrop */}
            <div className="tutorial-backdrop" onClick={skipTutorial} />

            {/* Spotlight Effect */}
            {currentStepData.highlightElement && currentStepData.targetSelector && (
                <div ref={spotlightRef} className="tutorial-spotlight" />
            )}

            {/* Tooltip */}
            <TutorialTooltip
                step={currentStepData}
                onNext={nextStep}
                onPrevious={previousStep}
                onSkip={skipTutorial}
                currentStepNumber={currentStep}
                totalSteps={totalSteps}
            />
        </div>
    );
};

export default TutorialOverlay;
