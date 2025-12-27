/**
 * Éditeur de clips vidéo avec FFmpeg.wasm
 * Traitement client-side pour éviter téléchargement serveur
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Scissors, Play, Pause, Loader2, CheckCircle2, Download, Upload } from 'lucide-react';
import { ffmpegService } from '@/services/ffmpegService';
import api from '@/lib/api';

const VideoClipEditor = ({ isOpen, onClose, video, onClipCreated }) => {
    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [processingStep, setProcessingStep] = useState(''); // 'ffmpeg-load', 'download', 'cut', 'upload'
    const [progress, setProgress] = useState(0);

    // Player states
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Selection states
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(30);

    // Clip metadata
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [videoElement, setVideoElement] = useState(null);

    const videoCallbackRef = useCallback((node) => {
        if (node) {
            videoRef.current = node;
            setVideoElement(node);
        }
    }, []);

    // Get video URL (HLS or MP4)
    const getVideoUrl = () => {
        if (video?.bunny_video_id && video?.url) {
            const match = video.url.match(/vz-([^.]+)\.b-cdn\.net/);
            if (match) {
                const libraryId = match[1];
                return `https://vz-${libraryId}.b-cdn.net/${video.bunny_video_id}/playlist.m3u8`;
            }
        }

        if (video?.bunny_video_id) {
            const libraryId = 'f2c97d0e-5d4';
            return `https://vz-${libraryId}.b-cdn.net/${video.bunny_video_id}/playlist.m3u8`;
        }

        return video?.url || '';
    };

    // Initialize HLS player
    useEffect(() => {
        if (!video || !isOpen || !videoElement) return;

        const videoUrl = getVideoUrl();
        if (!videoUrl) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const isMP4 = videoUrl.includes('.mp4');
        const isHLS = videoUrl.includes('.m3u8');

        if (isMP4) {
            videoElement.src = videoUrl;
            videoElement.load();
        } else if (isHLS && Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true });
            hls.loadSource(videoUrl);
            hls.attachMedia(videoElement);
            hlsRef.current = hls;

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('[HLS] Ready');
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error('[HLS] Fatal error:', data);
                    setError('Erreur de lecture vidéo');
                }
            });
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [video, isOpen, videoElement]);

    // Update duration when video loads
    const handleVideoLoaded = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setEndTime(Math.min(30, videoRef.current.duration));
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Download video segment as MP4 using MediaRecorder
     * (Alternative: could use fetch for MP4 URLs)
     */
    const downloadVideoSegment = async (videoUrl, start, end) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.src = videoUrl;

            const chunks = [];
            let mediaRecorder;

            video.onloadedmetadata = () => {
                video.currentTime = start;
            };

            video.onseeked = () => {
                const stream = video.captureStream();
                mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp8,opus'
                });

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    resolve(blob);
                };

                mediaRecorder.start();
                video.play();

                setTimeout(() => {
                    mediaRecorder.stop();
                    video.pause();
                }, (end - start) * 1000);
            };

            video.onerror = () => reject(new Error('Video download failed'));
        });
    };

    /**
     * Create clip with FFmpeg.wasm processing
     */
    const handleCreateClip = async () => {
        // Validation
        if (!title.trim()) {
            setError('Veuillez entrer un titre');
            return;
        }

        if (endTime - startTime < 1) {
            setError('Le clip doit durer au moins 1 seconde');
            return;
        }

        if (endTime - startTime > 60) {
            setError('Le clip ne peut pas durer plus de 60 secondes');
            return;
        }

        setLoading(true);
        setError('');
        setProgress(0);

        try {
            // Step 1: Load FFmpeg
            setProcessingStep('ffmpeg-load');
            if (!ffmpegService.isLoaded()) {
                await ffmpegService.load((p) => setProgress(p * 25));
            } else {
                setProgress(25);
            }

            // Step 2: Download video segment
            setProcessingStep('download');
            setProgress(30);

            const videoUrl = getVideoUrl();
            const videoBlob = await downloadVideoSegment(videoUrl, startTime, endTime);
            setProgress(50);

            // Step 3: Cut with FFmpeg
            setProcessingStep('cut');
            const clipBlob = await ffmpegService.cutVideo(
                videoBlob,
                0, // Start from 0 since we already downloaded the segment
                endTime - startTime,
                (p) => setProgress(50 + p * 25)
            );
            setProgress(75);

            // Step 4: Upload to backend
            setProcessingStep('upload');
            const formData = new FormData();
            formData.append('file', clipBlob, `clip_${Date.now()}.mp4`);
            formData.append('video_id', video.id);
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('start_time', startTime);
            formData.append('end_time', endTime);

            const response = await api.post('/clips/upload-direct', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (e.total) {
                        setProgress(75 + (e.loaded / e.total) * 25);
                    }
                }
            });

            setProgress(100);
            setSuccess(true);

            if (onClipCreated) {
                onClipCreated(response.data.clip);
            }

            setTimeout(() => {
                onClose();
                setSuccess(false);
                setTitle('');
                setDescription('');
                setProcessingStep('');
            }, 2000);

        } catch (err) {
            console.error('[Clip] Creation error:', err);
            setError(err.response?.data?.error || err.message || 'Erreur lors de la création du clip');
        } finally {
            setLoading(false);
        }
    };

    const getStepIcon = () => {
        switch (processingStep) {
            case 'ffmpeg-load': return <Download className="h-4 w-4 mr-2" />;
            case 'download': return <Download className="h-4 w-4 mr-2" />;
            case 'cut': return <Scissors className="h-4 w-4 mr-2" />;
            case 'upload': return <Upload className="h-4 w-4 mr-2" />;
            default: return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
        }
    };

    const getStepLabel = () => {
        switch (processingStep) {
            case 'ffmpeg-load': return 'Chargement FFmpeg...';
            case 'download': return 'Téléchargement vidéo...';
            case 'cut': return 'Découpe du clip...';
            case 'upload': return 'Envoi vers le serveur...';
            default: return 'Traitement...';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Créer un clip vidéo</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Video Player */}
                    <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                            ref={videoCallbackRef}
                            className="w-full aspect-video"
                            onLoadedMetadata={handleVideoLoaded}
                            onTimeUpdate={handleTimeUpdate}
                        />

                        <button
                            onClick={togglePlay}
                            className="absolute bottom-4 left-4 bg-white/80 hover:bg-white rounded-full p-3"
                        >
                            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </button>

                        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div className="space-y-4">
                        <div>
                            <Label>Début: {formatTime(startTime)}</Label>
                            <Slider
                                value={[startTime]}
                                max={duration}
                                step={0.1}
                                onValueChange={([v]) => setStartTime(Math.min(v, endTime - 1))}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label>Fin: {formatTime(endTime)}</Label>
                            <Slider
                                value={[endTime]}
                                max={duration}
                                step={0.1}
                                onValueChange={([v]) => setEndTime(Math.max(v, startTime + 1))}
                                className="mt-2"
                            />
                        </div>

                        <Alert>
                            <AlertDescription>
                                Durée du clip: {formatTime(endTime - startTime)} (max 60s)
                            </AlertDescription>
                        </Alert>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Titre *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Mon meilleur point"
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description du clip..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Progress */}
                    {loading && (
                        <div className="space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                                {getStepIcon()}
                                <span>{getStepLabel()}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}%</p>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <Alert className="border-green-500 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <AlertDescription className="text-green-700">
                                Clip créé avec succès !
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            Annuler
                        </Button>
                        <Button onClick={handleCreateClip} disabled={loading || !title.trim()}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    <Scissors className="mr-2 h-4 w-4" />
                                    Créer le clip
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default VideoClipEditor;
