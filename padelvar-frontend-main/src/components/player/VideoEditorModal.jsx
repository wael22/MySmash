
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scissors, Download, Loader2, Play, Pause } from 'lucide-react';

// NOTE: Ce composant est une SIMULATION. Le découpage vidéo réel se fait sur le backend.
const VideoEditorModal = ({ isOpen, onClose, video }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (video && video.duration) {
      setDuration(video.duration);
      setEndTime(video.duration);
    }
    // Rembobiner la vidéo à chaque ouverture
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [video]);

  const handleTimeUpdate = () => setCurrentTime(videoRef.current.currentTime);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };
  
  const handleDownloadSegment = async () => {
    setIsLoading(true);
    // Simulation du traitement backend
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    alert(`Simulation : Téléchargement du segment de ${formatTime(startTime)} à ${formatTime(endTime)}.`);
    setIsLoading(false);
    onClose();
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center"><Scissors className="h-5 w-5 mr-2" />Découper la Vidéo</DialogTitle>
          <DialogDescription>{video.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} src={video.file_url} className="w-full h-full" onTimeUpdate={handleTimeUpdate} />
          </div>
          <div className="flex items-center justify-center">
            <Button variant="outline" size="lg" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          </div>
          <div>
            <div className="flex justify-between text-sm"><Label>Début: {formatTime(startTime)}</Label><span>{formatTime(currentTime)} / {formatTime(duration)}</span></div>
            <Slider value={[startTime]} max={duration} step={1} onValueChange={([val]) => setStartTime(val)} />
          </div>
          <div>
            <Label>Fin: {formatTime(endTime)}</Label>
            <Slider value={[endTime]} max={duration} step={1} onValueChange={([val]) => setEndTime(val)} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleDownloadSegment} disabled={isLoading || startTime >= endTime}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Télécharger le segment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoEditorModal;

