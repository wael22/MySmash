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
        nextStep,
        previousStep,
        skipTutorial,
    } = useTutorial();

    const spotlightRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;

        updateSpotlight();
        window.addEventListener('resize', updateSpotlight);
        window.addEventListener('scroll', updateSpotlight);

        return () => {
            window.removeEventListener('resize', updateSpotlight);
            window.removeEventListener('scroll', updateSpotlight);
            removeHighlights();
        };
    }, [isActive, currentStepData]);

    const updateSpotlight = () => {
        if (!currentStepData.highlightElement || !currentStepData.targetSelector) {
            return;
        }

        const targetElement = document.querySelector(currentStepData.targetSelector);
        if (!targetElement || !spotlightRef.current) return;

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
