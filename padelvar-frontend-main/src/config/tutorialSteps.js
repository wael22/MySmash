// src/config/tutorialSteps.js

/**
 * Configuration des étapes du tutoriel pour les nouveaux joueurs
 * Chaque étape cible un élément spécifique de l'interface
 * 
 * Nouvelles propriétés:
 * - autoTrigger: Ouvre automatiquement un modal
 * - modalComponent: Nom du composant modal à ouvrir
 * - substeps: Étapes interactives dans un modal
 * - showDummyData: Affiche des données virtuelles
 * - dummyDataType: Type de données ('videos', 'clips', 'club')
 * - useDummyVideo: Utilise une vidéo virtuelle pour la démo
 */

export const tutorialSteps = [
    {
        id: 1,
        title: "🎾 Bienvenue sur MySmash !",
        description: "Découvrez votre tableau de bord où vous pourrez gérer vos enregistrements vidéo de padel, vos clips et bien plus encore. Cliquez sur 'Suivant' pour commencer la visite guidée !",
        targetSelector: "#dashboard-container",
        position: "center",
        highlightElement: false,
        showProgress: true
    },
    {
        id: 2,
        title: "💳 Vos Crédits",
        description: "Votre solde de crédits s'affiche ici. Chaque enregistrement coûte 1 crédit. Vous pouvez en acheter plus à tout moment en cliquant sur le bouton 'Acheter des Crédits' !",
        targetSelector: "#credits-balance",
        position: "bottom",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 3,
        title: "🎬 Lancer un Enregistrement",
        description: "Prêt à enregistrer votre premier match ? Cliquez ici et nous allons vous montrer comment configurer un enregistrement étape par étape !",
        targetSelector: "#new-recording-button",
        position: "bottom",
        highlightElement: true,
        showProgress: true,
        autoTrigger: true,
        modalComponent: 'AdvancedRecordingModal',
        substeps: [
            {
                id: 1,
                targetSelector: "#recording-name-input",
                title: "Nom de l'enregistrement",
                description: "Donnez un nom à votre enregistrement pour le retrouver facilement",
                position: "bottom-right",
                highlightElement: true
            },
            {
                id: 2,
                targetSelector: "#duration-select",
                title: "Durée du match",
                description: "Choisissez la durée estimée de votre match (vous pourrez l'arrêter avant si besoin)",
                position: "bottom-left",
                highlightElement: true
            },
            {
                id: 3,
                targetSelector: "#qr-scanner-button",
                title: "Scanner le QR Code",
                description: "Scannez le QR code du terrain pour lier votre enregistrement au bon lieu",
                position: "bottom-left",
                highlightElement: true
            }
        ]
    },
    {
        id: 4,
        title: "📹 Vos Vidéos",
        description: "Retrouvez toutes vos vidéos enregistrées ici ! Cliquez sur une vidéo pour la regarder, la télécharger ou la partager avec vos amis.",
        targetSelector: "#videos-section",
        position: "top",
        highlightElement: true,
        showProgress: true,
        showDummyData: true,
        dummyDataType: 'videos'
    },
    {
        id: 5,
        title: "📤 Partager une Vidéo",
        description: "Partagez vos meilleures performances ! Envoyez vos vidéos à d'autres joueurs MySmash ou sur les réseaux sociaux.",
        targetSelector: ".share-button",
        position: "left",
        highlightElement: true,
        showProgress: true,
        showDummyData: true,
        dummyDataType: 'videos',
        useDummyVideo: true
    },
    {
        id: 6,
        title: "✂️ Créer un Clip",
        description: "Transformez vos meilleurs moments en clips ! Sélectionnez une portion de votre vidéo pour créer un highlight partageable.",
        targetSelector: ".create-clip-button",
        position: "left",
        highlightElement: true,
        showProgress: true,
        showDummyData: true,
        dummyDataType: 'clips',
        useDummyVideo: true
    },
    {
        id: 7,
        title: "🏟️ Suivre votre Club",
        description: "Suivez votre club de padel pour retrouver facilement les terrains, consulter les actualités et rester connecté avec votre communauté !",
        targetSelector: "#club-following",
        position: "right",
        highlightElement: true,
        showProgress: true,
        showDummyData: true,
        dummyDataType: 'club'
    },
    {
        id: 8,
        title: "💬 Contacter le Support",
        description: "Une question ? Un problème technique ? Notre équipe de support est là pour vous aider. Cliquez ici pour nous envoyer un message !",
        targetSelector: "#support-button",
        position: "bottom",
        highlightElement: true,
        showProgress: true,
        autoTrigger: true,
        modalComponent: 'SupportModal',
        substeps: [
            {
                id: 1,
                targetSelector: "#support-subject",
                title: "Sujet de votre demande",
                description: "Sélectionnez le sujet qui correspond le mieux à votre question",
                position: "right"
            },
            {
                id: 2,
                targetSelector: "#support-message",
                title: "Votre message",
                description: "Décrivez votre demande en détail pour que nous puissions vous aider au mieux",
                position: "top"
            }
        ]
    },
    {
        id: 9,
        title: "💰 Acheter des Crédits",
        description: "Vous manquez de crédits ? Rechargez votre compte ici pour continuer à enregistrer vos matchs. Plusieurs packs sont disponibles !",
        targetSelector: "#buy-credits-button",
        position: "bottom",
        highlightElement: true,
        showProgress: true,
        autoTrigger: true,
        modalComponent: 'BuyCreditsModal',
        substeps: [
            {
                id: 1,
                targetSelector: ".credit-packages",
                title: "Choisir un pack",
                description: "Sélectionnez le pack de crédits qui correspond à vos besoins",
                position: "right"
            },
            {
                id: 2,
                targetSelector: ".payment-method",
                title: "Mode de paiement",
                description: "Choisissez votre mode de paiement préféré (carte bancaire, mobile money, etc.)",
                position: "top"
            }
        ]
    },
    {
        id: 10,
        title: "👤 Votre Profil",
        description: "Gérez vos informations personnelles, consultez vos statistiques et personnalisez vos paramètres depuis votre profil.",
        targetSelector: "#profile-button",
        position: "bottom-left",
        highlightElement: true,
        showProgress: true,
        autoTrigger: true,
        modalComponent: 'ProfileModal',
        substeps: [
            {
                id: 1,
                targetSelector: ".profile-stats",
                title: "Vos statistiques",
                description: "Consultez vos stats: nombre de matchs, temps de jeu total, clips créés, etc.",
                position: "right"
            },
            {
                id: 2,
                targetSelector: ".profile-settings",
                title: "Paramètres",
                description: "Modifiez vos informations personnelles et vos préférences",
                position: "right"
            }
        ]
    }
];

export const TOTAL_TUTORIAL_STEPS = tutorialSteps.length;
