/**
 * Nouveau Composant Enregistrement Vidéo (Version avec Hooks)
 * ============================================================
 * 
 * Utilise les hooks personnalisés pour simplifier la logique :
 * - useVideoRecording : Gestion de l'enregistrement
 * - Workflow automatisé
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  Loader2,
  Camera,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import VideoPreview from './VideoPreview';
import { useVideoRecording } from '@/hooks/useVideoSystem';
import { playerService, videoSystemService } from '@/lib/api';

const NewRecordingModal = ({ isOpen, onClose, onVideoCreated }) => {
  // Hook personnalisé pour l'enregistrement
  const {
    session,
    recordingStatus,
    isRecording,
    isLoading: recordingLoading,
    error: recordingError,
    startRecording,
    stopRecording,
    reset
  } = useVideoRecording();

  // États locaux
  const [step, setStep] = useState('setup'); // 'setup' | 'recording' | 'complete'
  const [clubs, setClubs] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [error, setError] = useState('');
  
  // Sélections
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(90);

  // Charger les clubs au montage
  useEffect(() => {
    if (isOpen) {
      loadFollowedClubs();
      setError('');
    }
  }, [isOpen]);

  // Charger les terrains quand un club est sélectionné
  useEffect(() => {
    if (selectedClubId) {
      loadCourts(selectedClubId);
    } else {
      setCourts([]);
      setSelectedCourtId('');
    }
  }, [selectedClubId]);

  // Synchroniser l'erreur du hook avec l'état local
  useEffect(() => {
    if (recordingError) {
      setError(recordingError);
    }
  }, [recordingError]);

  // Charger les clubs suivis
  const loadFollowedClubs = async () => {
    try {
      setLoadingClubs(true);
      setError('');
      
      const response = await playerService.getFollowedClubs();
      setClubs(response.data.clubs || []);
      
      if (!response.data.clubs || response.data.clubs.length === 0) {
        setError('Vous ne suivez aucun club. Veuillez suivre un club avant d\'enregistrer.');
      }
    } catch (err) {
      console.error('Erreur chargement clubs:', err);
      setError('Erreur lors du chargement des clubs');
    } finally {
      setLoadingClubs(false);
    }
  };

  // Charger les terrains d'un club
  const loadCourts = async (clubId) => {
    try {
      setLoadingCourts(true);
      setError('');
      
      // Utiliser l'endpoint pour récupérer les terrains
      // Note: adapter selon votre API existante pour les terrains
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/clubs/${clubId}/courts`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur chargement terrains');
      }
      
      const data = await response.json();
      setCourts(data.courts || data || []);
      
      if (!data.courts || data.courts.length === 0) {
        setError('Aucun terrain trouvé pour ce club');
      }
    } catch (err) {
      console.error('Erreur chargement terrains:', err);
      setError('Erreur lors du chargement des terrains');
      setCourts([]);
    } finally {
      setLoadingCourts(false);
    }
  };

  // Démarrer l'enregistrement
  const handleStartRecording = async () => {
    if (!selectedClubId || !selectedCourtId) {
      setError('Veuillez sélectionner un club et un terrain');
      return;
    }

    try {
      setError('');
      
      // Utiliser le hook pour démarrer l'enregistrement
      await startRecording(parseInt(selectedCourtId), durationMinutes);
      
      setStep('recording');
    } catch (err) {
      // L'erreur est déjà gérée par le hook
      console.error('Erreur démarrage:', err);
    }
  };

  // Arrêter l'enregistrement
  const handleStopRecording = async () => {
    try {
      setError('');
      
      // Utiliser le hook pour arrêter l'enregistrement
      const videoPath = await stopRecording();
      
      setStep('complete');
      
      console.log('✅ Vidéo créée:', videoPath);
    } catch (err) {
      // L'erreur est déjà gérée par le hook
      console.error('Erreur arrêt:', err);
    }
  };

  // Fermer et réinitialiser
  const handleClose = () => {
    setStep('setup');
    setSelectedClubId('');
    setSelectedCourtId('');
    setError('');
    reset(); // Réinitialiser le hook
    onClose();
  };

  // Fermer après enregistrement terminé
  const handleCompleteClose = () => {
    // Notifier le parent
    if (onVideoCreated && session) {
      onVideoCreated({
        session_id: session.session_id,
        club_id: selectedClubId
      });
    }
    
    handleClose();
  };

  // Formater le temps d'enregistrement
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'setup' && '🎬 Nouvel Enregistrement'}
            {step === 'recording' && '🔴 Enregistrement en cours'}
            {step === 'complete' && '✅ Enregistrement terminé'}
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Configurez votre enregistrement vidéo'}
            {step === 'recording' && 'Votre match est en cours d\'enregistrement'}
            {step === 'complete' && 'Votre vidéo est prête'}
          </DialogDescription>
        </DialogHeader>

        {/* Erreur */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Étape 1 : Configuration */}
        {step === 'setup' && (
          <div className="space-y-4">
            {/* Sélection du club */}
            <div>
              <Label htmlFor="club">Club</Label>
              <Select 
                value={selectedClubId} 
                onValueChange={setSelectedClubId}
                disabled={loadingClubs}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sélection du terrain */}
            <div>
              <Label htmlFor="court">Terrain</Label>
              <Select 
                value={selectedCourtId} 
                onValueChange={setSelectedCourtId}
                disabled={!selectedClubId || loadingCourts}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingCourts 
                      ? 'Chargement...' 
                      : selectedClubId 
                        ? 'Sélectionnez un terrain' 
                        : 'Sélectionnez d\'abord un club'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((court) => (
                    <SelectItem key={court.id} value={court.id.toString()}>
                      {court.name}
                      {court.camera_url && <span className="text-xs text-gray-500 ml-2">(caméra configurée)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Durée */}
            <div>
              <Label htmlFor="duration">Durée (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 90)}
                min={1}
                max={180}
              />
              <p className="text-sm text-gray-500 mt-1">
                Durée recommandée : 90 minutes (match standard)
              </p>
            </div>

            {/* Info pipeline */}
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Pipeline : Caméra → Proxy local → FFmpeg → Fichier MP4 unique
              </AlertDescription>
            </Alert>

            {/* Bouton démarrer */}
            <Button 
              onClick={handleStartRecording}
              disabled={!selectedClubId || !selectedCourtId || recordingLoading || loadingCourts}
              className="w-full"
              size="lg"
            >
              {recordingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Démarrage de la session...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Démarrer l'enregistrement
                </>
              )}
            </Button>
          </div>
        )}

        {/* Étape 2 : Enregistrement en cours */}
        {step === 'recording' && session && (
          <div className="space-y-4">
            {/* Preview vidéo */}
            <VideoPreview 
              sessionId={session.session_id}
              isRecording={true}
              mode="snapshot"
            />

            {/* Statut */}
            {recordingStatus && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center font-medium">
                      <Clock className="mr-2 h-4 w-4 text-blue-600" />
                      Temps écoulé : {formatTime(recordingStatus.elapsed_seconds || 0)}
                    </span>
                    <span className="text-gray-600">
                      Durée totale : {durationMinutes} min
                    </span>
                  </div>

                  <Progress 
                    value={recordingStatus.progress_percent || 0} 
                    className="w-full h-2"
                  />

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{recordingStatus.progress_percent || 0}% complété</span>
                    <span>
                      {formatTime((durationMinutes * 60) - (recordingStatus.elapsed_seconds || 0))} restant
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info session */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Session ID :</span>
                <span className="font-mono">{session.session_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type caméra :</span>
                <span className="uppercase font-medium">{session.camera_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Port proxy :</span>
                <span className="font-mono">{session.proxy_port}</span>
              </div>
            </div>

            {/* Bouton arrêter */}
            <Button 
              onClick={handleStopRecording}
              disabled={recordingLoading}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {recordingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Arrêt en cours...
                </>
              ) : (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Arrêter l'enregistrement
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              L'enregistrement s'arrêtera automatiquement après {durationMinutes} minutes
            </p>
          </div>
        )}

        {/* Étape 3 : Terminé */}
        {step === 'complete' && (
          <div className="text-center space-y-4 py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Enregistrement terminé !
              </h3>
              
              <p className="text-gray-600">
                Votre vidéo a été enregistrée avec succès.
              </p>
              
              {session && (
                <p className="text-sm text-gray-500 mt-2 font-mono">
                  {session.session_id}
                </p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm font-medium text-green-900">
                ✅ Fichier MP4 créé
              </p>
              <p className="text-xs text-green-700">
                Vous pouvez retrouver votre vidéo dans l'onglet "Mes Vidéos"
              </p>
            </div>

            <Button 
              onClick={handleCompleteClose}
              className="w-full"
              size="lg"
            >
              Voir mes vidéos
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewRecordingModal;
