import { useState, useEffect } from 'react';
// MODIFIÉ : On importe playerService car c'est lui qui connaît les clubs suivis
import { videoService, playerService } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CameraPreview from './CameraPreview';
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
  QrCode,
  Loader2,
  Camera
} from 'lucide-react';

// MODIFIÉ : J'ai renommé le composant pour qu'il corresponde à son fichier
const RecordingModal = ({ isOpen, onClose, onVideoCreated }) => {
  const [step, setStep] = useState('setup');
  const [recordingData, setRecordingData] = useState({
    title: '',
    description: '',
    club_id: '',
    court_id: '',
    qr_code: '',
    recording_id: null,
    startTime: null
  });
  // Cet état contient maintenant uniquement les clubs suivis
  const [followedClubs, setFollowedClubs] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // La fonction est renommée pour plus de clarté
      loadFollowedClubs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (recordingData.club_id) {
      loadCourts(recordingData.club_id);
    } else {
      setCourts([]);
      setRecordingData(prev => ({ ...prev, court_id: '' }));
    }
  }, [recordingData.club_id]);

  // ====================================================================
  // CORRECTION PRINCIPALE ICI
  // ====================================================================
  const loadFollowedClubs = async () => {
    try {
      setLoadingClubs(true);
      // MODIFIÉ : On appelle playerService.getFollowedClubs()
      // C'est la fonction qui renvoie UNIQUEMENT les clubs que l'utilisateur suit.
      const response = await playerService.getFollowedClubs();
      setFollowedClubs(response.data.clubs || []);
    } catch (error) {
      console.error('Error loading followed clubs:', error);
      setError('Erreur lors du chargement de vos clubs suivis');
    } finally {
      setLoadingClubs(false);
    }
  };

  const loadCourts = async (clubId) => {
    try {
      setLoadingCourts(true);
      setError('');
      // Use the new player-accessible endpoint
      const response = await videoService.getClubCourtsForPlayers(clubId);
      setCourts(response.data.courts || []);

      if (!response.data.courts || response.data.courts.length === 0) {
        setError('Aucun terrain trouvé pour ce club');
      }
    } catch (error) {
      console.error('Error loading courts:', error);
      setError('Erreur lors du chargement des terrains');
      setCourts([]);
    } finally {
      setLoadingCourts(false);
    }
  };
  // ====================================================================
  // FIN DE LA CORRECTION PRINCIPALE
  // ====================================================================

  useEffect(() => {
    let interval;
    if (step === 'recording' && recordingData.startTime) {
      interval = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - recordingData.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, recordingData.startTime]);

  const handleStartRecording = async () => {
    if (!recordingData.club_id || !recordingData.court_id) {
      setError('Veuillez sélectionner un club et un terrain');
      return;
    }
    if (!recordingData.qr_code) {
      setError('Le code QR du terrain est requis');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Validate QR code matches selected court
      const qrValidation = await videoService.scanQrCode(recordingData.qr_code);

      // Check if the QR code corresponds to the selected court
      if (qrValidation.data.court.id.toString() !== recordingData.court_id) {
        setError(`Le code QR ne correspond pas au terrain sélectionné. Ce code est pour le terrain "${qrValidation.data.court.name}"`);
        setIsLoading(false);
        return;
      }

      // QR code is valid, proceed with recording
      const response = await videoService.startRecording({
        court_id: recordingData.court_id,
        duration: 90, // Durée par défaut de 90 minutes
        title: recordingData.title,
        description: recordingData.description,
        qr_code: recordingData.qr_code || undefined
      });

      setRecordingData(prev => ({
        ...prev,
        recording_id: response.data.recording_id,
        startTime: Date.now()
      }));

      setStep('recording');

      // Optionnel : programmer un arrêt automatique après la durée prévue
      setTimeout(() => {
        if (step === 'recording') {
          // Avertir l'utilisateur que le temps est écoulé
          setError('Temps d\'enregistrement écoulé. Veuillez arrêter l\'enregistrement.');
        }
      }, 90 * 60 * 1000); // 90 minutes

    } catch (error) {
      if (error.response?.status === 404) {
        setError('Code QR invalide. Veuillez scanner le QR code du terrain.');
      } else {
        setError(error.response?.data?.error || 'Erreur lors du démarrage');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Calculer la durée réelle d'enregistrement
      const actualDuration = recordingData.startTime
        ? Math.floor((Date.now() - recordingData.startTime) / 1000 / 60) // en minutes
        : 90;

      const response = await videoService.stopRecording({
        recording_id: recordingData.recording_id,
        title: recordingData.title || null,  // Ne pas générer de titre par défaut, laisser le backend le faire
        description: recordingData.description,
        court_id: recordingData.court_id,
        duration: actualDuration
      });

      // Afficher un message de succès
      setError('');
      alert(`Enregistrement sauvegardé avec succès ! Durée: ${actualDuration} minutes`);

      onVideoCreated();
      handleClose();
    } catch (error) {
      // Affiche l'erreur renvoyée par le backend
      setError(error.response?.data?.error || 'Erreur lors de l\'arrêt de l\'enregistrement');
      console.error('Error stopping recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setRecordingData({ title: '', description: '', club_id: '', court_id: '', qr_code: '', recording_id: null, startTime: null });
    setRecordingTime(0);
    setError('');
    setFollowedClubs([]);
    setCourts([]);
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'setup' && 'Nouvel Enregistrement'}
            {step === 'recording' && 'Enregistrement en cours'}
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Configurez votre enregistrement de match'}
            {step === 'recording' && 'Votre match est en cours d\'enregistrement'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          {step === 'setup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Titre du match (optionnel)</Label>
                <Input id="title" placeholder="Ex: Match contre équipe X" value={recordingData.title} onChange={(e) => setRecordingData(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea id="description" placeholder="Notes sur le match..." value={recordingData.description} onChange={(e) => setRecordingData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club">Club *</Label>
                <Select value={recordingData.club_id} onValueChange={(value) => setRecordingData(prev => ({ ...prev, club_id: value }))} disabled={loadingClubs}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClubs ? "Chargement..." : "Sélectionnez un club"} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* MODIFIÉ : On utilise la liste des clubs suivis */}
                    {followedClubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>{club.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="court">Terrain *</Label>
                <Select value={recordingData.court_id} onValueChange={(value) => setRecordingData(prev => ({ ...prev, court_id: value }))} disabled={!recordingData.club_id || loadingCourts}>
                  <SelectTrigger>
                    <SelectValue placeholder={!recordingData.club_id ? "Sélectionnez d'abord un club" : loadingCourts ? "Chargement..." : "Sélectionnez un terrain"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id.toString()}>{court.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>QR Code du terrain *</Label>
                <div className="flex space-x-2">
                  <Input placeholder="Code du terrain" value={recordingData.qr_code} onChange={(e) => setRecordingData(prev => ({ ...prev, qr_code: e.target.value }))} required />
                  <Button type="button" variant="outline"><QrCode className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleClose}>Annuler</Button>
                <Button onClick={handleStartRecording} disabled={isLoading || !recordingData.club_id || !recordingData.court_id || !recordingData.qr_code}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Démarrer
                </Button>
              </div>
            </>
          )}

          {step === 'recording' && (
            <div className="space-y-6">
              {/* Preview de la caméra pendant l'enregistrement */}
              <CameraPreview
                cameraUrl={courts.find(c => c.id.toString() === recordingData.court_id)?.camera_url}
                courtName={courts.find(c => c.id.toString() === recordingData.court_id)?.name || 'Terrain'}
                isRecording={true}
              />

              {/* Timer et contrôles */}
              <div className="text-center space-y-4">
                <div>
                  <div className="text-3xl font-mono font-bold text-red-600">{formatTime(recordingTime)}</div>
                  <p className="text-gray-600 mt-2">Enregistrement en cours...</p>
                  <p className="text-sm text-gray-500">
                    {recordingData.title || `Match du ${new Date().toLocaleDateString('fr-FR')}`}
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <Button onClick={handleStopRecording} disabled={isLoading} variant="destructive" size="lg">
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
                    Arrêter l'enregistrement
                  </Button>
                </div>

                {/* Informations supplémentaires */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Club:</span> {followedClubs.find(c => c.id.toString() === recordingData.club_id)?.name}
                    </div>
                    <div>
                      <span className="font-medium">Terrain:</span> {courts.find(c => c.id.toString() === recordingData.court_id)?.name}
                    </div>
                    <div>
                      <span className="font-medium">Démarré à:</span> {recordingData.startTime ? new Date(recordingData.startTime).toLocaleTimeString('fr-FR') : '-'}
                    </div>
                    <div>
                      <span className="font-medium">ID:</span> {recordingData.recording_id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingModal;
