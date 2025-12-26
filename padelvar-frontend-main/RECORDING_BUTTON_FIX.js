// PlayerDashboard.jsx - FIX POUR LE BOUTON D'ENREGISTREMENT

// PROBLÈME IDENTIFIÉ:
// Quand un enregistrement démarre, checkActiveRecording() est appelé immédiatement,
// mais le backend n'a pas encore fini de créer la session d'enregistrement.
// Résultat: activeRecording reste null, donc le bouton ne change pas d'état.

// SOLUTION: Ajouter un délai avant de vérifier l'enregistrement actif

// ========= TROUVER CETTE LIGNE (environ ligne 309-312 dans PlayerDashboard.jsx) =========

// AVANT (ne fonctionne pas):
/*
onRecordingStarted={() => {
  setIsRecordingModalOpen(false);
  checkActiveRecording();
}}
*/

// APRÈS (fonctionne):
onRecordingStarted = {() => {
    setIsRecordingModalOpen(false);
    // Attendre 500ms pour que le backend crée la session
    setTimeout(() => {
        checkActiveRecording();
    }, 500);
}}

// ========= MODIFICATION COMPLÈTE =========

// Cherchez le composant <AdvancedRecordingModal> dans PlayerDashboard.jsx
// Remplacez la propriété onRecordingStarted par:

/*
<AdvancedRecordingModal
  isOpen={isRecordingModalOpen}
  onClose={() => setIsRecordingModalOpen(false)}
  onRecordingStarted={() => {
    setIsRecordingModalOpen(false);
    // ✅ FIX: Attendre que le backend crée la session
    setTimeout(() => {
      checkActiveRecording();
    }, 500);
  }}
/>
*/

// EXPLICATION:
// Le setTimeout de 500ms donne le temps au backend de:
// 1. Créer la session d'enregistrement
// 2. Démarrer FFmpeg
// 3. Mettre à jour l'état du terrain
// 
// Après ce délai, checkActiveRecording() va trouver la session active
// et mettre à jour activeRecording, ce qui va:
// - Désactiver le bouton "Nouvel Enregistrement"
// - Changer le texte en "Enregistrement en cours..."
// - Afficher la bannière d'enregistrement actif

// ALTERNATIVE (plus robuste):
// Au lieu de setTimeout, on pourrait aussi faire un retry jusqu'à 3 fois

onRecordingStarted = {() => {
    setIsRecordingModalOpen(false);

    // Retry jusqu'à trouver l'enregistrement actif
    const checkWithRetry = async (attempt = 1) => {
        await checkActiveRecording();

        setTimeout(async () => {
            const response = await recordingService.getMyActiveRecording();
            if (!response.data.recording && attempt < 3) {
                // Pas encore créé, réessayer
                checkWithRetry(attempt + 1);
            }
        }, 300 * attempt); // Délai croissant: 300ms, 600ms, 900ms
    };

    checkWithRetry();
}}
