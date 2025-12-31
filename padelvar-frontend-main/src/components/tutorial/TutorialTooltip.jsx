// src/components/tutorial/TutorialTooltip.jsx

import { useEffect, useState, useRef } from 'react';
import { useTutorial } from '../../contexts/TutorialContext';
import './Tutorial.css';

const TutorialTooltip = ({ step, onNext, onPrevious, onSkip, currentStepNumber, totalSteps }) => {
    const { currentSubstep, currentSubstepData, hasSubsteps, totalSubsteps } = useTutorial();
    const tooltipRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [tooltipPosition, setTooltipPosition] = useState(step.position || 'bottom');

    // Utiliser le substep actuel si disponible, sinon l'étape principale
    const displayStep = currentSubstepData || step;
    const displayTargetSelector = currentSubstepData?.targetSelector || step.targetSelector;

    useEffect(() => {
        calculatePosition();
        window.addEventListener('resize', calculatePosition);
        window.addEventListener('scroll', calculatePosition);

        return () => {
            window.removeEventListener('resize', calculatePosition);
            window.removeEventListener('scroll', calculatePosition);
        };
    }, [displayTargetSelector]);

    const calculatePosition = () => {
        if (displayStep.position === 'center' || !displayTargetSelector) {
            setTooltipPosition('center');
            return;
        }

        const targetElement = document.querySelector(displayTargetSelector);
        if (!targetElement || !tooltipRef.current) {
            setTooltipPosition('center');
            return;
        }

        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const padding = 40; // ✅ Augmenté pour plus d'espace

        let top = 0;
        let left = 0;
        let finalPosition = displayStep.position;

        switch (displayStep.position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - padding;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - padding;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + padding;
                break;
            case 'bottom-left':
                top = targetRect.bottom + padding;
                left = targetRect.left;
                finalPosition = 'bottom-left';
                break;
            case 'bottom-right':
                top = targetRect.bottom + padding;
                left = targetRect.right - tooltipRect.width;
                finalPosition = 'bottom-right';
                break;
            default:
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        }

        // Adjust if tooltip goes off screen
        if (left < padding) {
            left = padding;
        } else if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - tooltipRect.width - padding;
        }

        if (top < padding) {
            top = targetRect.bottom + padding;
            finalPosition = 'bottom';
        } else if (top + tooltipRect.height > window.innerHeight - padding) {
            top = targetRect.top - tooltipRect.height - padding;
            finalPosition = 'top';
        }

        setPosition({ top, left });
        setTooltipPosition(finalPosition);
    };

    const progressPercentage = (currentStepNumber / totalSteps) * 100;

    return (
        <div
            ref={tooltipRef}
            className="tutorial-tooltip"
            data-position={tooltipPosition}
            style={tooltipPosition !== 'center' ? { top: `${position.top}px`, left: `${position.left}px` } : {}}
        >
            {/* Progress Bar */}
            {step.showProgress && (
                <div className="tutorial-progress">
                    <div className="tutorial-progress-text">
                        Étape {currentStepNumber} sur {totalSteps}
                        {hasSubsteps && (
                            <span style={{ marginLeft: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                                ({currentSubstep + 1}/{totalSubsteps})
                            </span>
                        )}
                    </div>
                    <div className="tutorial-progress-bar">
                        <div
                            className="tutorial-progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="tutorial-header">
                <div className="tutorial-title">{displayStep.title}</div>
            </div>

            {/* Description */}
            <p className="tutorial-description">{displayStep.description}</p>

            {/* Buttons */}
            <div className="tutorial-buttons">
                {currentStepNumber > 1 && (
                    <button
                        className="tutorial-button tutorial-button-secondary"
                        onClick={onPrevious}
                    >
                        ← Précédent
                    </button>
                )}

                <button
                    className="tutorial-button tutorial-button-primary"
                    onClick={onNext}
                >
                    {currentStepNumber === totalSteps ? 'Terminer' : 'Suivant'} →
                </button>
            </div>

            <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <button
                    className="tutorial-button tutorial-button-skip"
                    onClick={onSkip}
                >
                    Passer le tutoriel
                </button>
            </div>
        </div>
    );
};

export default TutorialTooltip;
