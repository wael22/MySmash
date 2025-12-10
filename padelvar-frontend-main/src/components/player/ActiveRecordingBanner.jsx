import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Square, 
  Video, 
  MapPin, 
  Timer,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import StreamViewer from './StreamViewer';
import RecordingProgress from './RecordingProgress';

const ActiveRecordingBanner = ({ activeRecording, onStopRecording, onRefresh }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!activeRecording) return;

    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(activeRecording.start_time);
      const elapsed = Math.floor((now - startTime) / 1000 / 60); // en minutes
      const remaining = Math.max(0, activeRecording.planned_duration - elapsed);
      
      setElapsedTime(elapsed);
      setTimeRemaining(remaining);
      
      // Si le temps est écoulé, rafraîchir pour vérifier l'arrêt automatique
      if (remaining <= 0) {
        onRefresh();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Mise à jour chaque minute

    return () => clearInterval(interval);
  }, [activeRecording, onRefresh]);

  if (!activeRecording) return null;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getStatusColor = () => {
    if (timeRemaining <= 5) return 'destructive';
    if (timeRemaining <= 15) return 'secondary';
    return 'default';
  };

  const getStatusIcon = () => {
    if (timeRemaining <= 5) return <AlertCircle className="h-4 w-4" />;
    if (timeRemaining <= 15) return <Timer className="h-4 w-4" />;
    return <Video className="h-4 w-4" />;
  };

  return (
    <Card className="mb-6 border-l-4 border-l-red-500 bg-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-700">Enregistrement en cours</span>
          </div>
          <Badge variant={getStatusColor()} className="flex items-center space-x-1">
            {getStatusIcon()}
            <span>{formatTime(timeRemaining)} restant</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Video className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium">{activeRecording.title}</p>
              <p className="text-xs text-gray-500">Titre du match</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium">
                {activeRecording.court?.name || 'Terrain inconnu'}
              </p>
              <p className="text-xs text-gray-500">
                {activeRecording.club?.name || 'Club inconnu'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium">{formatTime(elapsedTime)} écoulé</p>
              <p className="text-xs text-gray-500">
                Sur {formatTime(activeRecording.planned_duration)} planifié
              </p>
            </div>
          </div>
        </div>

        {/* Flux vidéo en direct */}
        <div className="mt-4">
          <StreamViewer 
            terrainId={activeRecording.court_id} 
            isActive={true}
          />
        </div>

        {/* Barre de progression détaillée */}
        <RecordingProgress
          startTime={activeRecording.start_time}
          durationMinutes={activeRecording.duration_minutes || activeRecording.planned_duration}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onRefresh}
            size="sm"
          >
            Actualiser
          </Button>
          <Button
            variant="destructive"
            onClick={() => onStopRecording(activeRecording.recording_id)}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Square className="h-4 w-4" />
            <span>Arrêter l'enregistrement</span>
          </Button>
        </div>

        {timeRemaining <= 5 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              L'enregistrement se terminera automatiquement dans {formatTime(timeRemaining)}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveRecordingBanner;
