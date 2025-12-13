// ShareVideoModal.jsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { videoService } from '@/lib/api';
import { Loader2, Mail, MessageSquare } from 'lucide-react';

const ShareVideoModal = ({ isOpen, onClose, video }) => {
    const [recipientEmails, setRecipientEmails] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [successCount, setSuccessCount] = useState(0);

    const handleShare = async (e) => {
        e.preventDefault();

        // Validation
        if (!recipientEmails.trim()) {
            setError('Veuillez entrer au moins un email');
            return;
        }

        // Séparer les emails par virgule ou point-virgule
        const emailList = recipientEmails.split(/[,;]/).map(e => e.trim()).filter(e => e);

        if (emailList.length === 0) {
            setError('Veuillez entrer au moins un email valide');
            return;
        }

        // Valider tous les emails
        const invalidEmails = emailList.filter(email => !isValidEmail(email));
        if (invalidEmails.length > 0) {
            setError(`Email(s) invalide(s): ${invalidEmails.join(', ')}`);
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);
        setSuccessCount(0);

        try {
            let successfulShares = 0;
            const errors = [];

            // Partager avec chaque email
            for (const email of emailList) {
                try {
                    await videoService.shareVideoWithUser(video.id, email, message.trim() || null);
                    successfulShares++;
                } catch (err) {
                    console.error(`Erreur partage avec ${email}:`, err);
                    errors.push(`${email}: ${err.response?.data?.error || 'Erreur'}`);
                }
            }

            setSuccessCount(successfulShares);

            if (successfulShares > 0) {
                setSuccess(true);

                // Afficher les erreurs s'il y en a
                if (errors.length > 0) {
                    setError(`Partagé avec ${successfulShares}/${emailList.length} utilisateur(s). Erreurs: ${errors.join(', ')}`);
                }

                // Reset form and close after short delay
                setTimeout(() => {
                    setRecipientEmails('');
                    setMessage('');
                    setSuccess(false);
                    setSuccessCount(0);
                    if (errors.length === 0) {
                        onClose();
                    }
                }, 3000);
            } else {
                setError(`Échec du partage: ${errors.join(', ')}`);
            }
        } catch (err) {
            console.error('Erreur lors du partage:', err);
            setError('Erreur lors du partage de la vidéo');
        } finally {
            setLoading(false);
        }
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleClose = () => {
        if (!loading) {
            setRecipientEmails('');
            setMessage('');
            setError('');
            setSuccess(false);
            setSuccessCount(0);
            onClose();
        }
    };

    if (!video) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Partager la vidéo</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Partagez "{video.title || 'cette vidéo'}" avec d'autres joueurs. Vous pouvez entrer plusieurs emails séparés par des virgules.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleShare}>
                    <div className="space-y-4 py-4">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <Label htmlFor="emails" className="text-sm font-medium text-gray-900">
                                <Mail className="inline h-4 w-4 mr-2" />
                                Email(s) des destinataires *
                            </Label>
                            <Input
                                id="emails"
                                type="text"
                                placeholder="email1@exemple.com, email2@exemple.com"
                                value={recipientEmails}
                                onChange={(e) => setRecipientEmails(e.target.value)}
                                disabled={loading}
                                required
                                className="rounded-lg"
                            />
                            <p className="text-xs text-gray-500">Séparez plusieurs emails par des virgules (,) ou points-virgules (;)</p>
                        </div>

                        {/* Message Input */}
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-sm font-medium text-gray-900">
                                <MessageSquare className="inline h-4 w-4 mr-2" />
                                Message (optionnel)
                            </Label>
                            <Textarea
                                id="message"
                                placeholder="Ajouter un message personnel..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={loading}
                                rows={3}
                                maxLength={500}
                                className="rounded-lg resize-none"
                            />
                            <p className="text-xs text-gray-500">{message.length}/500 caractères</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Success Alert */}
                        {success && (
                            <Alert className="bg-green-50 border-green-200">
                                <AlertDescription className="text-green-800">
                                    ✅ Vidéo partagée avec succès avec {successCount} utilisateur(s) !
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter className="gap-3 sm:gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="btn-secondary-modern flex-1 sm:flex-initial"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary-modern flex-1 sm:flex-initial"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Partage en cours...</span>
                                </>
                            ) : (
                                'Partager'
                            )}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ShareVideoModal;
