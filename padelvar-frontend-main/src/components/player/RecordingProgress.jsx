import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, Circle } from 'lucide-react';

const RecordingProgress = ({ startTime, durationMinutes }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      if (!startTime || !durationMinutes) return;

      const start = new Date(startTime);
      const now = new Date();
      const elapsed = Math.floor((now - start) / 1000); // Secondes écoulées
      const totalSeconds = durationMinutes * 60;
      const progressPercent = Math.min((elapsed / totalSeconds) * 100, 100);

      setElapsedSeconds(elapsed);
      setProgress(progressPercent);
    };

    // Mise à jour immédiate
    updateProgress();

    // Mise à jour toutes les secondes
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const totalSeconds = (durationMinutes || 0) * 60;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);

  return (
    <div className="space-y-3">
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-green-600">
            <Circle className="h-3 w-3 fill-current animate-pulse" />
            <span className="font-medium">Enregistrement en cours</span>
          </div>
          <span className="text-gray-600 font-medium">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Compteurs de temps */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-gray-500 text-xs">Temps écoulé</div>
            <div className="font-mono font-semibold text-gray-900">
              {formatTime(elapsedSeconds)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-500" />
          <div>
            <div className="text-gray-500 text-xs">Temps restant</div>
            <div className="font-mono font-semibold text-gray-900">
              {formatTime(remainingSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Durée totale prévue */}
      <div className="text-center pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">Durée totale prévue</div>
        <div className="text-sm font-semibold text-gray-700">
          {durationMinutes} minutes ({formatTime(totalSeconds)})
        </div>
      </div>
    </div>
  );
};

export default RecordingProgress;
