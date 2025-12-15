/**
 * Liste des clips créés par l'utilisateur
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Play,
    Share2,
    Download,
    Trash2,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import clipService from '@/services/clipService';
import SocialShareModal from './SocialShareModal';

const ClipsList = ({ videoId = null, onRefresh = () => { } }) => {
    const [clips, setClips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedClip, setSelectedClip] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [deletingClipId, setDeletingClipId] = useState(null);

    useEffect(() => {
        loadClips();
    }, [videoId]);

    const loadClips = async () => {
        setLoading(true);
        setError('');

        try {
            const response = videoId
                ? await clipService.getVideoClips(videoId)
                : await clipService.getMyClips();

            setClips(response.clips || []);
        } catch (err) {
            console.error('Error loading clips:', err);
            setError('Erreur lors du chargement des clips');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (clipId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce clip ?')) {
            return;
        }

        setDeletingClipId(clipId);

        try {
            await clipService.deleteClip(clipId);

            // Retirer le clip de la liste
            setClips(clips.filter(c => c.id !== clipId));

            // Notifier le parent
            onRefresh();
        } catch (err) {
            console.error('Error deleting clip:', err);
            alert('Erreur lors de la suppression du clip');
        } finally {
            setDeletingClipId(null);
        }
    };

    const handleShare = (clip) => {
        setSelectedClip(clip);
        setShareModalOpen(true);
    };

    const handleDownload = async (clip) => {
        try {
            await clipService.trackDownload(clip.id);
            window.open(clip.file_url, '_blank');
        } catch (err) {
            console.error('Error downloading clip:', err);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'completed': {
                variant: 'default',
                icon: CheckCircle2,
                label: 'Prêt',
                color: 'bg-green-500'
            },
            'processing': {
                variant: 'secondary',
                icon: Loader2,
                label: 'Traitement...',
                color: 'bg-blue-500'
            },
            'pending': {
                variant: 'secondary',
                icon: Clock,
                label: 'En attente',
                color: 'bg-yellow-500'
            },
            'failed': {
                variant: 'destructive',
                icon: XCircle,
                label: 'Échec',
                color: 'bg-red-500'
            }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
                {config.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <Button
                    variant="outline"
                    onClick={loadClips}
                    className="mt-4"
                >
                    Réessayer
                </Button>
            </div>
        );
    }

    if (clips.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Aucun clip créé pour le moment</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clips.map((clip) => (
                    <Card key={clip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Miniature */}
                        <div className="relative aspect-video bg-gray-200">
                            {clip.thumbnail_url ? (
                                <img
                                    src={clip.thumbnail_url}
                                    alt={clip.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Play className="h-12 w-12 text-gray-400" />
                                </div>
                            )}

                            {/* Durée */}
                            {clip.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                                    {formatTime(clip.duration)}
                                </div>
                            )}

                            {/* Badge de statut */}
                            <div className="absolute top-2 right-2">
                                {getStatusBadge(clip.status)}
                            </div>
                        </div>

                        <CardHeader className="pb-3">
                            <CardTitle className="text-base line-clamp-2">
                                {clip.title}
                            </CardTitle>
                            {clip.description && (
                                <p className="text-sm text-gray-500 line-clamp-2">
                                    {clip.description}
                                </p>
                            )}
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {/* Informations */}
                            <div className="text-xs text-gray-500">
                                <div>Créé le {formatDate(clip.created_at)}</div>
                                {clip.share_count > 0 && (
                                    <div>{clip.share_count} partage{clip.share_count > 1 ? 's' : ''}</div>
                                )}
                            </div>

                            {/* Actions */}
                            {clip.status === 'completed' && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleShare(clip)}
                                    >
                                        <Share2 className="h-4 w-4 mr-1" />
                                        Partager
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(clip)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(clip.id)}
                                        disabled={deletingClipId === clip.id}
                                    >
                                        {deletingClipId === clip.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        )}
                                    </Button>
                                </div>
                            )}

                            {clip.status === 'failed' && clip.error_message && (
                                <div className="text-xs text-red-500">
                                    Erreur: {clip.error_message}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal de partage */}
            <SocialShareModal
                isOpen={shareModalOpen}
                onClose={() => {
                    setShareModalOpen(false);
                    setSelectedClip(null);
                }}
                clip={selectedClip}
            />
        </>
    );
};

export default ClipsList;
