// src/contexts/TutorialContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { tutorialSteps, TOTAL_TUTORIAL_STEPS } from '../config/tutorialSteps';
import { tutorialService } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const TutorialContext = createContext();

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};

export const TutorialProvider = ({ children }) => {
    console.log('[TUTORIAL] 🎬 TutorialProvider MOUNTED');
    const { user } = useAuth();
    console.log('[TUTORIAL] User from useAuth:', user);
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [currentSubstep, setCurrentSubstep] = useState(0);  // Pour naviguer dans les substeps
    const [completed, setCompleted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Charger le statut du tutoriel au montage
    useEffect(() => {
        console.log('[TUTORIAL] useEffect triggered:', { user, role: user?.role });
        if (user && user.role === 'player') {
            console.log('[TUTORIAL] User is player, loading status...');
            loadTutorialStatus();
        } else {
            console.log('[TUTORIAL] User not player or not loaded:', user?.role);
            setLoading(false);
        }
    }, [user]);

    const loadTutorialStatus = async () => {
        try {
            console.log('[TUTORIAL] Fetching status from API...');
            const response = await tutorialService.getStatus();
            console.log('[TUTORIAL] API Response:', response);
            const { tutorial_completed, tutorial_step } = response.data;

            console.log('[TUTORIAL] Status:', { tutorial_completed, tutorial_step });
            setCompleted(tutorial_completed);

            // Si le tutoriel n'est pas complété et qu'il y a une étape sauvegardée
            if (!tutorial_completed) {
                console.log('[TUTORIAL] Tutorial not completed, checking step...');
                if (tutorial_step) {
                    console.log('[TUTORIAL] Resuming at step:', tutorial_step);
                    setCurrentStep(tutorial_step);
                } else {
                    // Nouveau utilisateur - démarrer le tutoriel automatiquement
                    console.log('[TUTORIAL] 🚀 Starting tutorial for new user!');
                    setIsActive(true);
                    setCurrentStep(1);
                }
            } else {
                console.log('[TUTORIAL] Tutorial already completed, not starting');
            }
        } catch (error) {
            console.error('[TUTORIAL] ❌ Error loading tutorial status:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTutorial = async () => {
        try {
            // Réinitialiser le tutoriel côté serveur
            await tutorialService.reset();
            setIsActive(true);
            setCurrentStep(1);
            setCompleted(false);
        } catch (error) {
            console.error('Error starting tutorial:', error);
        }
    };

    const nextStep = async () => {
        const currentStepInfo = getCurrentStepData();
        const hasSubsteps = currentStepInfo?.substeps && currentStepInfo.substeps.length > 0;

        // Si on a des substeps et qu'on n'est pas au dernier
        if (hasSubsteps && currentSubstep < currentStepInfo.substeps.length - 1) {
            // Passer au substep suivant
            setCurrentSubstep(currentSubstep + 1);
            console.log('[TUTORIAL] Moving to substep', currentSubstep + 1);
            return;
        }

        // Sinon, passer à l'étape suivante
        setCurrentSubstep(0);  // Reset substep

        if (currentStep < TOTAL_TUTORIAL_STEPS) {
            const nextStepNumber = currentStep + 1;
            try {
                await tutorialService.updateStep(nextStepNumber);
                setCurrentStep(nextStepNumber);
            } catch (error) {
                console.error('Error updating tutorial step:', error);
                // Continuer même en cas d'erreur pour ne pas bloquer l'utilisateur
                setCurrentStep(nextStepNumber);
            }
        } else {
            // Dernière étape - compléter le tutoriel
            await completeTutorial();
        }
    };

    const previousStep = async () => {
        // Si on est sur un substep, revenir au substep précédent
        if (currentSubstep > 0) {
            setCurrentSubstep(currentSubstep - 1);
            console.log('[TUTORIAL] Moving back to substep', currentSubstep - 1);
            return;
        }

        // Sinon, revenir à l'étape précédente
        if (currentStep > 1) {
            const prevStepNumber = currentStep - 1;
            try {
                await tutorialService.updateStep(prevStepNumber);
                setCurrentStep(prevStepNumber);
                // Réinitialiser au dernier substep de l'étape précédente si elle en a
                const prevStepInfo = tutorialSteps.find(s => s.id === prevStepNumber);
                if (prevStepInfo?.substeps && prevStepInfo.substeps.length > 0) {
                    setCurrentSubstep(prevStepInfo.substeps.length - 1);
                } else {
                    setCurrentSubstep(0);
                }
            } catch (error) {
                console.error('Error updating tutorial step:', error);
                setCurrentStep(prevStepNumber);
            }
        }
    };

    const skipTutorial = async () => {
        try {
            await tutorialService.skip();
            setIsActive(false);
            setCompleted(true);
        } catch (error) {
            console.error('Error skipping tutorial:', error);
            // Fermer quand même côté client
            setIsActive(false);
        }
    };

    const completeTutorial = async () => {
        try {
            await tutorialService.complete();
            setIsActive(false);
            setCompleted(true);
            setCurrentStep(1);
        } catch (error) {
            console.error('Error completing tutorial:', error);
            setIsActive(false);
        }
    };

    const resetTutorial = async () => {
        await startTutorial();
    };

    const getCurrentStepData = () => {
        return tutorialSteps.find(step => step.id === currentStep) || tutorialSteps[0];
    };

    const getCurrentSubstepData = () => {
        const stepData = getCurrentStepData();
        if (stepData?.substeps && stepData.substeps.length > 0) {
            return stepData.substeps[currentSubstep] || null;
        }
        return null;
    };

    const value = {
        isActive,
        currentStep,
        currentSubstep,
        totalSteps: TOTAL_TUTORIAL_STEPS,
        completed,
        loading,
        currentStepData: getCurrentStepData(),
        currentSubstepData: getCurrentSubstepData(),
        hasSubsteps: getCurrentStepData()?.substeps?.length > 0,
        totalSubsteps: getCurrentStepData()?.substeps?.length || 0,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        completeTutorial,
        resetTutorial,
    };

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
};
