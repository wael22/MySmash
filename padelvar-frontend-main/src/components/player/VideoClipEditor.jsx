/**
 * Éditeur de clips vidéo
 * Permet de sélectionner et créer des clips personnalisés
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scissors, Play, Pause, Loader2, CheckCircle2 } from 'lucide-react';
import clipService from '@/services/clipService';

const VideoClipEditor = ({ isOpen, onClose, video, onClipCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // États du lecteur vidéo
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // États de sélection
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(30);

    // Métadonnées du clip
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [videoElement, setVideoElement] = useState(null);

    // Callback ref to capture video element when it mounts
    const videoCallbackRef = useCallback((node) => {
        if (node) {
            console.log('✅ Video element mounted');
            videoRef.current = node;
            setVideoElement(node);
        }
    }, []);

    // Générer l'URL de la vidéo
    const getVideoUrl = () => {
        // Debug log
        console.log('Video data:', video);

        // Si on a un bunny_video_id et une URL, extraire le library ID
        if (video?.bunny_video_id && video?.url) {
            // Extraire le library ID de l'URL (format: https://vz-LIBRARY_ID.b-cdn.net/...)
            const match = video.url.match(/vz-([^.]+)\.b-cdn\.net/);
            if (match) {
                const libraryId = match[1];
                const hlsUrl = `https://vz-${libraryId}.b-cdn.net/${video.bunny_video_id}/playlist.m3u8`;
                console.log('Using Bunny Stream HLS URL with extracted library ID:', hlsUrl);
                return hlsUrl;
            }
        }

        // Si on a juste un bunny_video_id, utiliser le library ID par défaut
        if (video?.bunny_video_id) {
            const libraryId = 'f2c97d0e-5d4';
            const url = `https://vz-${libraryId}.b-cdn.net/${video.bunny_video_id}/playlist.m3u8`;
            console.log('Using Bunny Stream HLS URL with default library ID:', url);
            return url;
        }

        // En dernier recours, utiliser video.url
        if (video?.url && video.url.trim() !== '') {
            console.log('Using video.url as fallback:', video.url);
            return video.url;
        }

        console.warn('No valid video URL found!');
        return '';
    };

    // Initialiser HLS.js pour la lecture vidéo
    useEffect(() => {
        console.log('🎬 HLS useEffect called', { video: !!video, isOpen, hasVideoElement: !!videoElement });

        if (!video || !isOpen || !videoElement) {
            console.warn('⚠️ HLS useEffect exit early:', { video: !!video, isOpen, hasVideoElement: !!videoElement });
            return;
        }

        const videoUrl = getVideoUrl();
        if (!videoUrl) {
            console.warn('⚠️ No video URL');
            return;
        }

        // Nettoyer l'instance HLS précédente
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // Détecter si c'est un fichier MP4 ou m3u8
        const isMP4 = videoUrl.includes('.mp4');
        const isHLS = videoUrl.includes('.m3u8');

        if (isMP4) {
            // Utiliser le lecteur natif pour MP4
            console.log('🎬 Using native video player for MP4');
            videoElement.src = videoUrl;
            videoElement.load();
        } else if (isHLS && Hls.isSupported()) {
            // Utiliser HLS.js pour m3u8
            console.log('🎬 Using HLS.js for m3u8');
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
            });

            hls.loadSource(videoUrl);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✅ HLS manifest parsed, video ready');
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('❌ HLS error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('Network error, trying to recover...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('Media error, trying to recover...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.error('Fatal error, destroying HLS instance');
                            hls.destroy();
                            break;
                    }
                }
            });

            hlsRef.current = hls;
        }
        // Safari supporte HLS nativement
        else if (isHLS && videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('✅ Using native HLS support (Safari)');
            videoElement.src = videoUrl;
            videoElement.load();
        }

        // Cleanup on unmount
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [video, isOpen, videoElement]); // Déclenché quand videoElement est disponible

    useEffect(() => {
        if (video && isOpen) {
            setStartTime(0);
            setEndTime(Math.min(30, video.duration || 30));
            setTitle(`Clip - ${video.title}`);
            setDescription('');
            setError('');
            setSuccess(false);
        }
    }, [video, isOpen]);

    const handleVideoLoaded = () => {
        const videoDuration = videoRef.current?.duration || 0;
        console.log('Video loaded, duration:', videoDuration);
        if (videoDuration > 0) {
            setDuration(videoDuration);
            setEndTime(Math.min(30, videoDuration));
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            setCurrentTime(current);

            // Arrêter la lecture si on dépasse la fin sélectionnée
            if (current >= endTime) {
                videoRef.current.pause();
                setIsPlaying(false);
                videoRef.current.currentTime = startTime;
            }
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                // Commencer depuis startTime si on n'est pas dans la plage
                if (currentTime < startTime || currentTime >= endTime) {
                    videoRef.current.currentTime = startTime;
                }
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleStartTimeChange = (value) => {
        if (!duration || duration === 0) return; // Ne rien faire si la vidéo n'est pas chargée

        const newStart = value[0];
        setStartTime(newStart);

        // S'assurer que endTime est toujours après startTime
        if (newStart >= endTime - 1) {
            setEndTime(Math.min(newStart + 1, duration));
        }

        // Mettre à jour la position du lecteur
        if (videoRef.current) {
            videoRef.current.currentTime = newStart;
            setCurrentTime(newStart);
        }
    };

    const handleEndTimeChange = (value) => {
        if (!duration || duration === 0) return; // Ne rien faire si la vidéo n'est pas chargée

        const newEnd = value[0];
        setEndTime(newEnd);

        // S'assurer que endTime est toujours après startTime
        if (newEnd <= startTime + 1) {
            setStartTime(Math.max(0, newEnd - 1));
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCreateClip = async () => {
        // Validation
        if (!title.trim()) {
            setError('Veuillez entrer un titre pour le clip');
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

        try {
            const response = await clipService.createClip(
                video.id,
                startTime,
                endTime,
                title.trim(),
                description.trim()
            );

            setSuccess(true);

            // Notifier le parent
            if (onClipCreated) {
                onClipCreated(response.clip);
            }

            // Fermer après un court délai
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setTitle('');
                setDescription('');
            }, 2000);

        } catch (err) {
            console.error('Error creating clip:', err);
            setError(err.response?.data?.error || 'Erreur lors de la création du clip');
        } finally {
            setLoading(false);
        }
    };

    if (!video) return null;

    const clipDuration = endTime - startTime;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-blue-500" />
                        Créer un Clip
                    </DialogTitle>
                    <DialogDescription>
                        Sélectionnez la partie de la vidéo que vous souhaitez transformer en clip
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Lecteur vidéo */}
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        <video
                            ref={videoCallbackRef}
                            className="w-full h-full"
                            onLoadedMetadata={handleVideoLoaded}
                            onTimeUpdate={handleTimeUpdate}
                            onError={(e) => {
                                console.error('Erreur de chargement vidéo:', e);
                                console.log('URL essayée:', getVideoUrl());
                            }}
                        />

                        {/* Overlay de contrôle */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={togglePlay}
                                    className="text-white hover:bg-white/20"
                                >
                                    {isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                    ) : (
                                        <Play className="h-5 w-5" />
                                    )}
                                </Button>

                                <div className="flex-1 text-white text-sm">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Avertissement si vidéo pas chargée */}
                    {duration === 0 && (
                        <Alert>
                            <AlertDescription>
                                ⚠️ La vidéo est en cours de chargement... Les sliders seront disponibles une fois la vidéo chargée.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Sélection de la plage */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Plage sélectionnée</span>
                                <span className="text-sm font-bold text-blue-600">
                                    {formatTime(clipDuration)} ({formatTime(startTime)} - {formatTime(endTime)})
                                </span>
                            </div>

                            {/* Slider pour le temps de début */}
                            <div className="space-y-2 mb-4">
                                <Label className="text-xs">Début du clip</Label>
                                <Slider
                                    value={[startTime]}
                                    min={0}
                                    max={duration - 1}
                                    step={0.1}
                                    onValueChange={handleStartTimeChange}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-600 text-center">
                                    {formatTime(startTime)}
                                </div>
                            </div>

                            {/* Slider pour le temps de fin */}
                            <div className="space-y-2">
                                <Label className="text-xs">Fin du clip</Label>
                                <Slider
                                    value={[endTime]}
                                    min={1}
                                    max={duration}
                                    step={0.1}
                                    onValueChange={handleEndTimeChange}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-600 text-center">
                                    {formatTime(endTime)}
                                </div>
                            </div>
                        </div>

                        {clipDuration > 60 && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    ⚠️ Le clip ne peut pas durer plus de 60 secondes (actuellement {formatTime(clipDuration)})
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Métadonnées */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Titre du clip *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Mon meilleur point"
                                disabled={loading}
                                maxLength={200}
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description (optionnel)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ajoutez une description..."
                                disabled={loading}
                                rows={3}
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {description.length}/500 caractères
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                ✅ Clip créé avec succès ! Le traitement est en cours...
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleCreateClip}
                        disabled={loading || !title.trim() || clipDuration > 60 || clipDuration < 1}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Création...
                            </>
                        ) : (
                            <>
                                <Scissors className="h-4 w-4 mr-2" />
                                Créer le Clip
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default VideoClipEditor;
