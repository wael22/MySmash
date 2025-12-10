import { useState, useEffect } from 'react';
import { videoService, adminService } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Camera,
  Clock
} from 'lucide-react';

const RecordingModal = ({ isOpen, onClose, onVideoCreated }) => {
  const [step, setStep] = useState('setup'); // 'setup', 'recording', 'stopping'
  const [recordingData, setRecordingData] = useState({
    title: '',
    description: '',
    club_id: '',
    court_id: '',
    qr_code: '',
    recording_id: null,
    startTime: null
  });
  const [clubs, setClubs] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  // Charger les clubs au montage du composant
  useEffect(() => {
    if (isOpen) {
      loadClubs();
    }
  }, [isOpen]);

  // Charger les terrains quand un club est sélectionné
  useEffect(() => {
    if (recordingData.club_id) {
      loadCourts(recordingData.club_id);
    } else {
      setCourts([]);
      setRecordingData(prev => ({ ...prev, court_id: '' }));
    }
  }, [recordingData.club_id]);

  const loadClubs = async () => {
    try {
      setLoadingClubs(true);
      const response = await adminService.getAllClubs();
      setClubs(response.data.clubs || []);
    } catch (error) {
      console.error('Error loading clubs:', error);
      setError('Erreur lors du chargement des clubs');
    } finally {
      setLoadingClubs(false);
    }
  };

  const loadCourts = async (clubId) => {
    try {
      // Pour simplifier, on va simuler les terrains
      // Dans une vraie implémentation, il faudrait un endpoint pour récupérer les terrains d'un club
      const simulatedCourts = [
        { id: 1, name: 'Terrain 1', club_id: clubId },
        { id: 2, name: 'Terrain 2', club_id: clubId },
        { id: 3, name: 'Terrain 3', club_id: clubId },
      ];
      setCourts(simulatedCourts);
    } catch (error) {
      console.error('Error loading courts:', error);
      setError('Erreur lors du chargement des terrains');
    }
  };
  // Timer pour l'enregistrement
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
    setIsLoading(true);
    setError('');

    try {
      const response = await videoService.startRecording({
        qr_code: recordingData.qr_code || undefined
      });

      setRecordingData(prev => ({
        ...prev,
        recording_id: response.data.recording_id,
        court_id: response.data.court_id,
        startTime: Date.now()
      }));
      
      setStep('recording');
    } catch (error) {
      setError('Erreur lors du démarrage de l\'enregistrement');
      console.error('Error starting recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await videoService.stopRecording({
        recording_id: recordingData.recording_id,
        title: recordingData.title || `Match du ${new Date().toLocaleDateString('fr-FR')}`,
        description: recordingData.description,
        court_id: recordingData.court_id
      });

      // Fermer le modal et actualiser la liste des vidéos
      onVideoCreated();
      handleClose();
    } catch (error) {
      setError('Erreur lors de l\'arrêt de l\'enregistrement');
      console.error('Error stopping recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setRecordingData({
      title: '',
      description: '',
      qr_code: '',
      recording_id: null,
      court_id: null,
      startTime: null
    });
    setRecordingTime(0);
    setError('');
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQRScan = () => {
    // Simulation du scan QR code
    const simulatedQR = `court_${Math.random().toString(36).substr(2, 9)}`;
    setRecordingData(prev => ({ ...prev, qr_code: simulatedQR }));
    alert(`QR Code scanné: ${simulatedQR}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'setup' && 'Nouvel Enregistrement'}
            {step === 'recording' && 'Enregistrement en cours'}
            {step === 'stopping' && 'Arrêt de l\'enregistrement'}
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Configurez votre enregistrement de match'}
            {step === 'recording' && 'Votre match est en cours d\'enregistrement'}
            {step === 'stopping' && 'Finalisation de votre vidéo'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'setup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Titre du match (optionnel)</Label>
                <Input
                  id="title"
                  placeholder="Ex: Match contre équipe X"
                  value={recordingData.title}
                  onChange={(e) => setRecordingData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Notes sur le match..."
                  value={recordingData.description}
                  onChange={(e) => setRecordingData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>QR Code du terrain (optionnel)</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Code du terrain"
                    value={recordingData.qr_code}
                    onChange={(e) => setRecordingData(prev => ({ ...prev, qr_code: e.target.value }))}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleQRScan}
                    className="flex-shrink-0"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button onClick={handleStartRecording} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Démarrer l'enregistrement
                </Button>
              </div>
            </>
          )}

          {step === 'recording' && (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Camera className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full animate-ping"></div>
                </div>
              </div>

              <div>
                <div className="text-3xl font-mono font-bold text-red-600">
                  {formatTime(recordingTime)}
                </div>
                <p className="text-gray-600 mt-2">Enregistrement en cours...</p>
              </div>

              {recordingData.title && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{recordingData.title}</p>
                  {recordingData.description && (
                    <p className="text-sm text-gray-600 mt-1">{recordingData.description}</p>
                  )}
                </div>
              )}

              <Button 
                onClick={handleStopRecording} 
                disabled={isLoading}
                variant="destructive"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Arrêter l'enregistrement
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingModal;

