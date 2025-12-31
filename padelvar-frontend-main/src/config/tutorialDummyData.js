// src/config/tutorialDummyData.js

/**
 * Données virtuelles pour le tutoriel
 * Ces données s'affichent UNIQUEMENT pendant le tutoriel pour démontrer les fonctionnalités
 */

export const dummyVideo = {
    id: 'tutorial-demo-video-1',
    title: '🎾 Match de Démonstration - Tutorial',
    recorded_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Hier
    duration: 3180, // 53 minutes en secondes
    duration_minutes: 53,
    file_url: 'https://vz-f2c97d0e-5d4.b-cdn.net/demo/playlist.m3u8',
    bunny_video_id: 'tutorial-demo',
    thumbnail_url: null,
    views: 12,
    is_tutorial_dummy: true,  // Flag pour identifier les données démo
    club: {
        id: 1,
        name: 'Club de Padel MySmash',
    },
    terrain: {
        id: 1,
        name: 'Terrain Central',
    },
    status: 'completed',
};

export const dummyVideo2 = {
    id: 'tutorial-demo-video-2',
    title: '🏆 Finale Tournament - Tutorial',
    recorded_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 7 jours
    duration: 4200, // 70 minutes
    duration_minutes: 70,
    file_url: 'https://vz-f2c97d0e-5d4.b-cdn.net/demo/playlist.m3u8',
    bunny_video_id: 'tutorial-demo-2',
    thumbnail_url: null,
    views: 45,
    is_tutorial_dummy: true,
    club: {
        id: 1,
        name: 'Club de Padel MySmash',
    },
    terrain: {
        id: 2,
        name: 'Terrain 2',
    },
    status: 'completed',
};

export const dummyClip = {
    id: 'tutorial-demo-clip-1',
    title: '⚡ Meilleur Smash - Tutorial',
    description: 'Mon meilleur smash gagnant !',
    duration: 15,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 2 jours
    file_url: 'https://vz-f2c97d0e-5d4.b-cdn.net/demo-clip/playlist.m3u8',
    bunny_video_id: 'tutorial-demo-clip',
    thumbnail_url: null,
    views: 28,
    is_tutorial_dummy: true,
    source_video: dummyVideo,
};

export const dummyClip2 = {
    id: 'tutorial-demo-clip-2',
    title: '🎯 Point Décisif - Tutorial',
    description: 'Le point qui a fait la différence',
    duration: 12,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    file_url: 'https://vz-f2c97d0e-5d4.b-cdn.net/demo-clip-2/playlist.m3u8',
    bunny_video_id: 'tutorial-demo-clip-2',
    thumbnail_url: null,
    views: 15,
    is_tutorial_dummy: true,
    source_video: dummyVideo2,
};

export const dummyClub = {
    id: 1,
    name: 'Club de Padel MySmash',
    address: '123 Rue du Sport, Tunis',
    phone: '+216 71 123 456',
    email: 'contact@mysmash.tn',
    description: 'Le meilleur club de padel de Tunis avec 4 terrains couverts et éclairés',
    logo_url: null,
    terrains: [
        {
            id: 1,
            name: 'Terrain Central',
            qr_code: 'DEMO-TERRAIN-1',
            status: 'available',
        },
        {
            id: 2,
            name: 'Terrain 2',
            qr_code: 'DEMO-TERRAIN-2',
            status: 'occupied',
        },
        {
            id: 3,
            name: 'Terrain 3',
            qr_code: 'DEMO-TERRAIN-3',
            status: 'available',
        },
        {
            id: 4,
            name: 'Terrain VIP',
            qr_code: 'DEMO-TERRAIN-4',
            status: 'maintenance',
        },
    ],
    is_tutorial_dummy: true,
};

// Collections pour injection facile
export const dummyVideos = [dummyVideo, dummyVideo2];
export const dummyClips = [dummyClip, dummyClip2];

// Helper pour vérifier si une donnée est virtuelle
export const isTutorialDummy = (item) => {
    return item?.is_tutorial_dummy === true;
};

// Helper pour filtrer les données virtuelles
export const filterRealData = (items) => {
    return items.filter(item => !isTutorialDummy(item));
};

// Helper pour fusionner données réelles et virtuelles
export const mergeWithDummyData = (realData, dummyData, shouldShowDummy) => {
    if (!shouldShowDummy) {
        return realData;
    }

    // Si pas de données réelles, afficher seulement les dummy
    if (!realData || realData.length === 0) {
        return dummyData;
    }

    // Si données réelles existent, ne pas ajouter les dummy
    return realData;
};
