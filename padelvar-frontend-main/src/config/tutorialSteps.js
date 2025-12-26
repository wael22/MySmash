// src/config/tutorialSteps.js

/**
 * Configuration des étapes du tutoriel pour les nouveaux joueurs
 * Chaque étape cible un élément spécifique de l'interface
 */

export const tutorialSteps = [
    {
        id: 1,
        title: "🎾 Bienvenue sur MySmash !",
        description: "Découvrez votre tableau de bord où vous pourrez gérer vos enregistrements vidéo de padel, vos clips et bien plus encore.",
        targetSelector: "#dashboard-container",
        position: "center",
        highlightElement: false,
        showProgress: true
    },
    {
        id: 2,
        title: "💳 Vos Crédits",
        description: "Votre solde de crédits s'affiche ici. Chaque enregistrement coûte 1 crédit. Vous pouvez en acheter plus à tout moment !",
        targetSelector: "#credits-balance",
        position: "bottom",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 3,
        title: "🎬 Lancer un Enregistrement",
        description: "Cliquez ici pour démarrer un nouvel enregistrement. Vous devrez scanner le QR code du terrain et choisir la durée de votre match.",
        targetSelector: "#new-recording-button",
        position: "bottom",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 4,
        title: "📹 Vos Vidéos",
        description: "Accédez à toutes vos vidéos enregistrées ici. Consultez, téléchargez ou partagez vos matchs !",
        targetSelector: "#videos-section",
        position: "top",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 5,
        title: "📤 Partager une Vidéo",
        description: "Partagez vos vidéos avec d'autres joueurs MySmash ou sur les réseaux sociaux pour montrer vos meilleurs moments !",
        targetSelector: "#share-video-button",
        position: "left",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 6,
        title: "✂️ Créer un Clip",
        description: "Créez des clips courts de vos meilleures actions ! Sélectionnez une portion de votre vidéo pour créer un highlight.",
        targetSelector: "#create-clip-button",
        position: "left",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 7,
        title: "🏟️ Suivre votre Club",
        description: "Suivez votre club pour retrouver facilement le terrain où vous jouez et rester informé des actualités !",
        targetSelector: "#club-following",
        position: "right",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 8,
        title: "💬 Contacter le Support",
        description: "Une question ? Un problème ? Notre équipe de support est là pour vous aider. Contactez-nous à tout moment !",
        targetSelector: "#support-button",
        position: "bottom",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 9,
        title: "💰 Acheter des Crédits",
        description: "Besoin de plus de crédits ? Rechargez votre compte ici pour continuer à enregistrer vos matchs.",
        targetSelector: "#buy-credits-button",
        position: "bottom",
        highlightElement: true,
        showProgress: true
    },
    {
        id: 10,
        title: "👤 Votre Profil",
        description: "Gérez vos informations personnelles, vos paramètres et accédez à vos statistiques depuis votre profil.",
        targetSelector: "#profile-button",
        position: "bottom-left",
        highlightElement: true,
        showProgress: true
    }
];

export const TOTAL_TUTORIAL_STEPS = tutorialSteps.length;
