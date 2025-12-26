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
        if (currentStep > 1) {
            const prevStepNumber = currentStep - 1;
            try {
                await tutorialService.updateStep(prevStepNumber);
                setCurrentStep(prevStepNumber);
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

    const value = {
        isActive,
        currentStep,
        totalSteps: TOTAL_TUTORIAL_STEPS,
        completed,
        loading,
        currentStepData: getCurrentStepData(),
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
