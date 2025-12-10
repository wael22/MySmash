import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Clock, 
  User, 
  MapPin, 
  Square,
  RefreshCw,
  AlertTriangle,
  Timer,
  Play
} from 'lucide-react';

const ClubRecordingManager = () => {
  const [activeRecordings, setActiveRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadActiveRecordings();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadActiveRecordings, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveRecordings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recording/club/active', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des enregistrements');
      }

      const data = await response.json();
      setActiveRecordings(data.active_recordings || []);
      setError('');
    } catch (error) {
      console.error('Error loading active recordings:', error);
      setError('Erreur lors du chargement des enregistrements actifs');
    } finally {
      setLoading(false);
    }
  };

  const handleForceStop = async (recordingId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir arrêter cet enregistrement ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/recording/force-stop/${recordingId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'arrêt');
      }

      await loadActiveRecordings(); // Recharger la liste
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError('Erreur lors de l\'arrêt de l\'enregistrement');
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getStatusColor = (recording) => {
    if (recording.remaining_minutes <= 5) return 'destructive';
    if (recording.remaining_minutes <= 15) return 'secondary';
    return 'default';
  };

  const RecordingCard = ({ recording }) => (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{recording.title}</span>
          </div>
          <Badge variant={getStatusColor(recording)} className="flex items-center space-x-1">
            <Timer className="h-3 w-3" />
            <span>{formatTime(recording.remaining_minutes)} restant</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium">{recording.player?.name || 'Joueur inconnu'}</p>
              <p className="text-xs text-gray-500">{recording.player?.email || ''}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium">{recording.court?.name || 'Terrain inconnu'}</p>
              <p className="text-xs text-gray-500">Terrain #{recording.court?.id || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Démarré: {new Date(recording.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Play className="h-4 w-4" />
            <span>Durée: {formatTime(recording.planned_duration)}</span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              recording.remaining_minutes <= 5 ? 'bg-red-500' : 
              recording.remaining_minutes <= 15 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{
              width: `${Math.min(100, (recording.elapsed_minutes / recording.planned_duration) * 100)}%`
            }}
          ></div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleForceStop(recording.recording_id)}
            className="flex items-center space-x-2"
          >
            <Square className="h-4 w-4" />
            <span>Arrêter l'enregistrement</span>
          </Button>
        </div>

        {recording.remaining_minutes <= 5 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cet enregistrement se terminera automatiquement dans {formatTime(recording.remaining_minutes)}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  if (loading && activeRecordings.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des enregistrements actifs...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enregistrements en cours</h2>
          <p className="text-gray-600">
            {activeRecordings.length} enregistrement(s) actif(s) sur vos terrains
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadActiveRecordings}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {activeRecordings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Aucun enregistrement en cours
            </h3>
            <p className="text-gray-500">
              Tous vos terrains sont disponibles pour de nouveaux enregistrements.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeRecordings.map((recording) => (
            <RecordingCard key={recording.recording_id} recording={recording} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubRecordingManager;
