/**
 * Modal de partage sur les réseaux sociaux
 * Supporte WhatsApp, Facebook, Instagram, TikTok, Twitter, Email
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Share2,
    MessageCircle,
    Facebook,
    Instagram,
    Twitter,
    Mail,
    Download,
    Link2,
    Check,
    Loader2,
    Info
} from 'lucide-react';
import clipService from '@/services/clipService';

// Icône TikTok personnalisée (SVG)
const TikTokIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
);

const SocialShareModal = ({ isOpen, onClose, clip }) => {
    const [shareLinks, setShareLinks] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [showInstructions, setShowInstructions] = useState(null); // 'instagram' or 'tiktok'

    useEffect(() => {
        if (isOpen && clip) {
            loadShareLinks();
        }
    }, [isOpen, clip]);

    const loadShareLinks = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await clipService.getShareLinks(clip.id);
            setShareLinks(response.share_links);
        } catch (err) {
            console.error('Error loading share links:', err);
            setError('Erreur lors du chargement des liens de partage');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = (platform, url) => {
        // Tracker le partage
        clipService.getShareLinks(clip.id, platform).catch(console.error);

        // Ouvrir le lien
        window.open(url, '_blank', 'width=600,height=600');
    };

    const handleCopyLink = async () => {
        if (!shareLinks) return;

        try {
            await navigator.clipboard.writeText(shareLinks.page_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error copying link:', err);
        }
    };

    const handleDownload = async () => {
        if (!shareLinks) return;

        try {
            // Tracker le téléchargement
            await clipService.trackDownload(clip.id);

            // Ouvrir l'URL de téléchargement
            window.open(shareLinks.download, '_blank');
        } catch (err) {
            console.error('Error downloading:', err);
        }
    };

    const ShareButton = ({ icon: Icon, label, color, onClick, disabled = false }) => (
        <Button
            variant="outline"
            className={`flex flex-col items-center gap-2 h-auto py-4 ${color} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            onClick={onClick}
            disabled={disabled || loading}
        >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium">{label}</span>
        </Button>
    );

    if (!clip) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-blue-500" />
                        Partager le Clip
                    </DialogTitle>
                    <DialogDescription>
                        {clip.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!loading && shareLinks && (
                        <>
                            {/* Réseaux sociaux */}
                            <div>
                                <h3 className="text-sm font-medium mb-3">Partager sur:</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <ShareButton
                                        icon={MessageCircle}
                                        label="WhatsApp"
                                        color="hover:bg-green-50 hover:text-green-600"
                                        onClick={() => handleShare('whatsapp', shareLinks.whatsapp)}
                                    />

                                    <ShareButton
                                        icon={Facebook}
                                        label="Facebook"
                                        color="hover:bg-blue-50 hover:text-blue-600"
                                        onClick={() => handleShare('facebook', shareLinks.facebook)}
                                    />

                                    <ShareButton
                                        icon={Twitter}
                                        label="Twitter"
                                        color="hover:bg-sky-50 hover:text-sky-500"
                                        onClick={() => handleShare('twitter', shareLinks.twitter)}
                                    />

                                    <ShareButton
                                        icon={Instagram}
                                        label="Instagram"
                                        color="hover:bg-pink-50 hover:text-pink-600"
                                        onClick={() => setShowInstructions('instagram')}
                                    />

                                    <ShareButton
                                        icon={TikTokIcon}
                                        label="TikTok"
                                        color="hover:bg-gray-900 hover:text-white"
                                        onClick={() => setShowInstructions('tiktok')}
                                    />

                                    <ShareButton
                                        icon={Mail}
                                        label="Email"
                                        color="hover:bg-gray-50 hover:text-gray-700"
                                        onClick={() => window.location.href = shareLinks.email}
                                    />
                                </div>
                            </div>

                            {/* Actions rapides */}
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={handleCopyLink}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span>Lien copié !</span>
                                        </>
                                    ) : (
                                        <>
                                            <Link2 className="h-4 w-4" />
                                            <span>Copier le lien</span>
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={handleDownload}
                                >
                                    <Download className="h-4 w-4" />
                                    <span>Télécharger le clip</span>
                                </Button>
                            </div>

                            {/* Instructions Instagram/TikTok */}
                            {showInstructions && (
                                <Alert className="bg-blue-50 border-blue-200">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-sm">
                                        {showInstructions === 'instagram' ? (
                                            <>
                                                <strong>Pour partager sur Instagram:</strong>
                                                <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                                                    <li>Téléchargez la vidéo sur votre appareil</li>
                                                    <li>Ouvrez Instagram</li>
                                                    <li>Créez une nouvelle Story ou un Reel</li>
                                                    <li>Sélectionnez la vidéo téléchargée</li>
                                                    <li>Ajoutez vos filtres et partagez !</li>
                                                </ol>
                                            </>
                                        ) : (
                                            <>
                                                <strong>Pour partager sur TikTok:</strong>
                                                <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                                                    <li>Téléchargez la vidéo sur votre mobile</li>
                                                    <li>Ouvrez l'application TikTok</li>
                                                    <li>Appuyez sur "+" pour créer</li>
                                                    <li>Sélectionnez "Upload"</li>
                                                    <li>Choisissez votre vidéo</li>
                                                    <li>Ajoutez musique, effets et publiez !</li>
                                                </ol>
                                            </>
                                        )}
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => setShowInstructions(null)}
                                            className="mt-2 h-auto p-0 text-blue-600"
                                        >
                                            Fermer
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Statistiques */}
                            <div className="text-xs text-gray-500 text-center pt-2 border-t">
                                {clip.share_count > 0 && (
                                    <span>{clip.share_count} partage{clip.share_count > 1 ? 's' : ''} • </span>
                                )}
                                {clip.download_count > 0 && (
                                    <span>{clip.download_count} téléchargement{clip.download_count > 1 ? 's' : ''}</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SocialShareModal;
