import { useState, useEffect } from 'react';
import { recordingService, playerService, videoService } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Clock,
  QrCode,
  Loader2,
  Camera,
  AlertCircle,
  CheckCircle,
  Timer,
  Infinity,
  User
} from 'lucide-react';
import QRScannerModal from './QRScannerModal';  // 🆕 Scanner QR

const AdvancedRecordingModal = ({ isOpen, onClose, onRecordingStarted, initialQRCode = '' }) => {
  const { user } = useAuth();
  const [step, setStep] = useState('setup');
  const [recordingData, setRecordingData] = useState({
    title: '',
    description: '',
    club_id: '',
    court_id: '',
    duration: 90,
    qr_code: ''
  });

  const [followedClubs, setFollowedClubs] = useState([]);
  const [availableCourts, setAvailableCourts] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);  // 🆕 QR scanner modal

  // Options de durée
  const durationOptions = [
    { value: 60, label: '60 minutes', icon: <Clock className="h-4 w-4" />, description: 'Match court' },
    { value: 90, label: '90 minutes', icon: <Clock className="h-4 w-4" />, description: 'Durée standard' },
    { value: 120, label: '120 minutes', icon: <Clock className="h-4 w-4" />, description: 'Match long' },
    { value: 200, label: 'MAX (200 min)', icon: <Infinity className="h-4 w-4" />, description: 'Durée maximale' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadFollowedClubs();
      // Réinitialiser le formulaire
      setRecordingData({
        title: '',
        description: '',
        club_id: '',
        court_id: '',
        duration: 90,
        qr_code: initialQRCode  // 🆕 Use initial QR code if provided
      });
      setStep('setup');
      setError('');
    }
  }, [isOpen, initialQRCode]);  // 🆕 Add initialQRCode to dependencies

  useEffect(() => {
    if (recordingData.club_id) {
      loadAvailableCourts(recordingData.club_id);
    } else {
      setAvailableCourts([]);
      setRecordingData(prev => ({ ...prev, court_id: '' }));
    }
  }, [recordingData.club_id]);

  const loadFollowedClubs = async () => {
    try {
      setLoadingClubs(true);
      const response = await playerService.getFollowedClubs();

      const clubs = response.data.clubs || [];
      setFollowedClubs(clubs);

      if (clubs.length === 0) {
        setError('Vous ne suivez aucun club. Rendez-vous dans l\'onglet "Clubs" pour suivre un club.');
      } else {
        setError('');  // Clear any previous error
      }
    } catch (error) {
      console.error('[DEBUG] Erreur loadFollowedClubs:', error);
      console.error('[DEBUG] Message d\'erreur:', error.message);
      console.error('[DEBUG] Reponse d\'erreur:', error.response);
      console.error('[STATS] [DEBUG] Status d\'erreur:', error.response?.status);
      console.error('[DEBUG] Data d\'erreur:', error.response?.data);
      setError('Erreur lors du chargement de vos clubs suivis');
    } finally {
      setLoadingClubs(false);
    }
  };

  const loadAvailableCourts = async (clubId) => {
    try {
      setLoadingCourts(true);
      setError('');

      // Use the new player-accessible endpoint
      const response = await recordingService.getClubCourtsForPlayers(clubId);

      const courts = response.data.courts || [];
      setAvailableCourts(courts);

      if (!response.data.courts || response.data.courts.length === 0) {
        setError('Aucun terrain trouvé pour ce club');
      }
    } catch (error) {
      console.error('[CRASH] [DEBUG] Erreur dans loadAvailableCourts:', error);
      console.error('[INFO] [DEBUG] Message d\'erreur:', error.message);
      console.error('[SEARCH] [DEBUG] Réponse d\'erreur:', error.response);
      console.error('[STATS] [DEBUG] Status d\'erreur:', error.response?.status);
      console.error('[DEBUG] Data d\'erreur:', error.response?.data);

      setError('Erreur lors du chargement des terrains');
      setAvailableCourts([]);
    } finally {
      setLoadingCourts(false);
    }
  };

  const handleStartRecording = async () => {
    if (!recordingData.club_id || !recordingData.court_id) {
      setError('Veuillez sélectionner un club et un terrain');
      return;
    }

    if (!recordingData.qr_code) {
      setError('Le code QR du terrain est requis');
      return;
    }

    if (!user || !user.id) {
      setError('Utilisateur non authentifié');
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
      // Utiliser le recordingService au lieu de fetch direct
      const response = await recordingService.startAdvancedRecording({
        court_id: recordingData.court_id,
        user_id: user.id,
        duration_minutes: recordingData.duration,
        title: recordingData.title || null,  // Ne pas générer de titre par défaut, laisser le backend le faire
        description: recordingData.description
      });

      // Notifier le parent du succès
      onRecordingStarted(response.data.recording_session);
      handleClose();

    } catch (error) {
      if (error.response?.status === 404) {
        setError('Code QR invalide. Veuillez scanner le QR code du terrain.');
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Erreur lors du démarrage de l\'enregistrement';
        setError(errorMessage);
      }
      console.error('Error starting recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Handler pour le scan QR
  const handleQRCodeScanned = async (code) => {
    console.log('✅ QR Code scanné:', code);
    setRecordingData(prev => ({ ...prev, qr_code: code }));
    setIsQRScannerOpen(false);
    setError('');
    setIsLoading(true);

    try {
      // Appeler l'API pour valider le QR code et récupérer les infos
      const response = await videoService.scanQrCode(code);
      const { court, club } = response.data;

      console.log('✅ QR Code validé - Club:', club?.name, 'Terrain:', court?.name);

      // Auto-remplir les champs club et terrain
      setRecordingData(prev => ({
        ...prev,
        qr_code: code,
        club_id: club?.id?.toString() || '',
        court_id: court?.id?.toString() || ''
      }));

      // Charger les terrains du club si pas déjà fait
      if (club?.id && availableCourts.length === 0) {
        await loadAvailableCourts(club.id);
      }

    } catch (err) {
      console.error('❌ Erreur validation QR:', err);
      if (err.response?.status === 404) {
        setError('Code QR invalide. Veuillez scanner un QR code valide ou le saisir manuellement.');
      } else {
        setError('Erreur lors de la validation du QR code. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setRecordingData({
      title: '',
      description: '',
      club_id: '',
      court_id: '',
      duration: 90,
      qr_code: ''
    });
    setError('');
    setFollowedClubs([]);
    setAvailableCourts([]);
    onClose();
  };

  const selectedDuration = durationOptions.find(opt => opt.value === recordingData.duration);

  const CourtCard = ({ court }) => (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-all ${recordingData.court_id === court.id.toString()
        ? 'border-blue-500 bg-blue-50'
        : court.available
          ? 'border-gray-200 hover:border-gray-300'
          : 'border-red-200 bg-red-50 cursor-not-allowed opacity-75'
        }`}
      onClick={() => {
        if (court.available) {
          setRecordingData(prev => ({ ...prev, court_id: court.id.toString() }));
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{court.name}</p>
          <p className="text-xs text-gray-500">Terrain #{court.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          {court.available ? (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Disponible</span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Occupé</span>
            </Badge>
          )}
        </div>
      </div>

      {!court.available && court.recording_info && (
        <div className="mt-2 p-2 bg-red-50 rounded border text-xs">
          <div className="flex items-center space-x-1 text-red-700">
            <User className="h-3 w-3" />
            <span className="font-medium">{court.recording_info.player_name}</span>
          </div>
          <div className="flex items-center space-x-1 text-red-600 mt-1">
            <Clock className="h-3 w-3" />
            <span>Reste: {court.recording_info.remaining_minutes} min</span>
          </div>
        </div>
      )}

      {!court.available && !court.recording_info && (
        <div className="mt-2 text-xs text-red-600">
          <p>⚠️ Terrain temporairement indisponible</p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel Enregistrement avec Durée</DialogTitle>
          <DialogDescription>
            Configurez votre enregistrement de match avec une durée personnalisée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Informations de base */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du match</Label>
              <Input
                id="recording-name-input"
                placeholder="Ex: Match contre équipe X"
                value={recordingData.title}
                onChange={(e) => setRecordingData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Notes sur le match..."
                value={recordingData.description}
                onChange={(e) => setRecordingData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          {/* Sélection de durée */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="h-5 w-5 text-gray-700" />
              <h3 className="text-base font-semibold text-gray-900">Durée d'enregistrement</h3>
            </div>

            <div id="duration-select" className="grid grid-cols-2 gap-3">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-left ${recordingData.duration === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  onClick={() => setRecordingData(prev => ({ ...prev, duration: option.value }))}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {option.icon}
                    <span className="font-semibold text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>

            {selectedDuration && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <strong className="text-blue-900">Durée sélectionnée:</strong>{' '}
                <span className="text-blue-700">{selectedDuration.label}</span>
                {recordingData.duration === 'MAX' && (
                  <span className="text-blue-600"> (arrêt automatique après 200 minutes)</span>
                )}
              </div>
            )}
          </div>


          {/* Sélection du club */}
          <div className="space-y-2">
            <Label htmlFor="club">Club *</Label>
            <Select
              value={recordingData.club_id}
              onValueChange={(value) => setRecordingData(prev => ({ ...prev, club_id: value }))}
              disabled={loadingClubs}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClubs ? "Chargement..." : "Sélectionnez un club"} />
              </SelectTrigger>
              <SelectContent>
                {followedClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection du terrain */}
          <div className="space-y-2">
            <Label>Terrain disponible *</Label>
            {!recordingData.club_id ? (
              <p className="text-sm text-gray-500">Sélectionnez d'abord un club</p>
            ) : loadingCourts ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Chargement des terrains...</span>
              </div>
            ) : availableCourts.length === 0 ? (
              <p className="text-sm text-red-600">Aucun terrain disponible</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableCourts.map((court) => (
                  <CourtCard key={court.id} court={court} />
                ))}
              </div>
            )}
          </div>

          {/* QR Code required */}
          <div className="space-y-2">
            <Label>QR Code du terrain *</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Code du terrain"
                value={recordingData.qr_code}
                onChange={(e) => setRecordingData(prev => ({ ...prev, qr_code: e.target.value }))}
                onBlur={(e) => {
                  // Valider le QR code quand l'utilisateur quitte le champ
                  const code = e.target.value.trim();
                  if (code && code !== recordingData.qr_code) {
                    handleQRCodeScanned(code);
                  }
                }}
                required
              />
              <Button
                id="qr-scanner-button"
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsQRScannerOpen(true)}
                title="Scanner avec la caméra"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary-modern px-6"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={
                isLoading ||
                !recordingData.club_id ||
                !recordingData.court_id ||
                !recordingData.qr_code ||
                availableCourts.find(c => c.id.toString() === recordingData.court_id)?.available === false
              }
              className="btn-primary-modern px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Démarrage...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Démarrer l'enregistrement</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 🆕 QR Scanner Modal */}
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onCodeScanned={handleQRCodeScanned}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedRecordingModal;
