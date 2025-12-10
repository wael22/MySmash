/**
 * Bouton de génération de Highlights
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import highlightsService from '@/services/highlightsService';

export default function HighlightsButton({ video, onHighlightGenerated }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [error, setError] = useState('');

    // Polling du statut du job
    useEffect(() => {
        if (!jobId || !isGenerating) return;

        const pollInterval = setInterval(async () => {
            try {
                const status = await highlightsService.getJobStatus(jobId);
                setJobStatus(status);

                // Vérifier si terminé
                if (status.status === 'completed') {
                    setIsGenerating(false);
                    clearInterval(pollInterval);

                    // Notifier le parent
                    if (onHighlightGenerated && status.highlight_video) {
                        onHighlightGenerated(status.highlight_video);
                    }

                    // Fermer après 2 secondes
                    setTimeout(() => {
                        setModalOpen(false);
                        setJobId(null);
                        setJobStatus(null);
                    }, 2000);
                } else if (status.status === 'failed') {
                    setIsGenerating(false);
                    setError(status.error_message || 'Erreur lors de la génération');
                    clearInterval(pollInterval);
                }
            } catch (err) {
                console.error('Error polling job status:', err);
                setError('Erreur lors de la récupération du statut');
                setIsGenerating(false);
                clearInterval(pollInterval);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [jobId, isGenerating, onHighlightGenerated]);

    const handleGenerate = async () => {
        try {
            setError('');
            setModalOpen(true);
            setIsGenerating(true);

            const response = await highlightsService.generateHighlights(video.id, 90);

            if (response.success && response.job) {
                setJobId(response.job.id);
                setJobStatus(response.job);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Error generating highlights:', err);
            setError(err.response?.data?.error || 'Erreur lors du démarrage de la génération');
            setIsGenerating(false);
        }
    };

    const getStatusIcon = () => {
        if (!jobStatus) return <Loader2 className="h-5 w-5 animate-spin" />;

        switch (jobStatus.status) {
            case 'completed':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'queued':
                return <Clock className="h-5 w-5 text-blue-500" />;
            default:
                return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
        }
    };

    const getStatusText = () => {
        if (!jobStatus) return 'Initialisation...';

        const statusMap = {
            'queued': 'En attente...',
            'downloading': 'Téléchargement de la vidéo...',
            'processing': 'Génération des highlights...',
            'uploading': 'Upload vers Bunny CDN...',
            'completed': 'Highlights générés avec succès !',
            'failed': 'Erreur lors de la génération'
        };

        return statusMap[jobStatus.status] || jobStatus.status;
    };

    return (
        <>
            <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération...
                    </>
                ) : (
                    <>
                        <Sparkles className="h-4 w-4" />
                        Highlights
                    </>
                )}
            </Button>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Génération de Highlights
                        </DialogTitle>
                        <DialogDescription>
                            Création automatique d'une vidéo de 90 secondes avec les meilleurs moments
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Status */}
                        <div className="flex items-center gap-3">
                            {getStatusIcon()}
                            <div className="flex-1">
                                <p className="text-sm font-medium">{getStatusText()}</p>
                                {jobStatus && jobStatus.status !== 'completed' && jobStatus.status !== 'failed' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Cela peut prendre quelques minutes...
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        {jobStatus && jobStatus.progress !== undefined && (
                            <div className="space-y-2">
                                <Progress value={jobStatus.progress} className="h-2" />
                                <p className="text-xs text-center text-gray-500">
                                    {jobStatus.progress}%
                                </p>
                            </div>
                        )}

                        {/* Status badge */}
                        {jobStatus && (
                            <div className="flex justify-center">
                                <Badge variant={
                                    jobStatus.status === 'completed' ? 'success' :
                                        jobStatus.status === 'failed' ? 'destructive' :
                                            'secondary'
                                }>
                                    {jobStatus.status}
                                </Badge>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Success message */}
                        {jobStatus && jobStatus.status === 'completed' && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <p className="text-sm text-green-600 font-medium">
                                    ✨ Highlights générés avec succès !
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    Vous pouvez maintenant les visionner dans vos vidéos.
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
