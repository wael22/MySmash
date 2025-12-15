/**
 * Exemple d'intégration du système de clips dans VideoPlayerModal
 * 
 * Ce fichier montre comment ajouter les fonctionnalités de clips
 * dans le lecteur vidéo existant
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Scissors, Film } from 'lucide-react';
import VideoClipEditor from '@/components/player/VideoClipEditor';
import ClipsList from '@/components/player/ClipsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Exemple 1: Ajouter simplement le bouton "Créer un Clip"
 * 
 * À ajouter dans la barre d'outils de votre lecteur vidéo
 */
export function SimpleClipButton({ video }) {
    const [clipEditorOpen, setClipEditorOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setClipEditorOpen(true)}
                disabled={!video?.is_unlocked}
                title={!video?.is_unlocked ? "Déverrouillez la vidéo pour créer des clips" : "Créer un clip"}
            >
                <Scissors className="h-4 w-4 mr-2" />
                Créer un Clip
            </Button>

            <VideoClipEditor
                isOpen={clipEditorOpen}
                onClose={() => setClipEditorOpen(false)}
                video={video}
                onClipCreated={(clip) => {
                    console.log('Nouveau clip créé:', clip);
                    // Optionnel: afficher une notification
                    // toast.success('Clip créé avec succès !');
                }}
            />
        </>
    );
}

/**
 * Exemple 2: Lecteur vidéo avec onglets (Vidéo + Clips)
 * 
 * Intégration complète avec liste des clips
 */
export function VideoPlayerWithClips({ video, onClose }) {
    const [activeTab, setActiveTab] = useState('video');
    const [clipEditorOpen, setClipEditorOpen] = useState(false);
    const [refreshClips, setRefreshClips] = useState(0);

    const handleClipCreated = (clip) => {
        console.log('Nouveau clip créé:', clip);
        // Rafraîchir la liste des clips
        setRefreshClips(prev => prev + 1);
        // Passer à l'onglet clips
        setActiveTab('clips');
    };

    return (
        <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="video">
                            <Film className="h-4 w-4 mr-2" />
                            Vidéo
                        </TabsTrigger>
                        <TabsTrigger value="clips">
                            <Scissors className="h-4 w-4 mr-2" />
                            Mes Clips
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'video' && video?.is_unlocked && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClipEditorOpen(true)}
                        >
                            <Scissors className="h-4 w-4 mr-2" />
                            Créer un Clip
                        </Button>
                    )}
                </div>

                <TabsContent value="video">
                    {/* Votre lecteur vidéo existant ici */}
                    <div className="aspect-video bg-black rounded-lg">
                        <video src={video?.file_url} controls className="w-full h-full" />
                    </div>
                </TabsContent>

                <TabsContent value="clips">
                    <ClipsList
                        videoId={video?.id}
                        key={refreshClips}
                        onRefresh={() => setRefreshClips(prev => prev + 1)}
                    />
                </TabsContent>
            </Tabs>

            <VideoClipEditor
                isOpen={clipEditorOpen}
                onClose={() => setClipEditorOpen(false)}
                video={video}
                onClipCreated={handleClipCreated}
            />
        </div>
    );
}

/**
 * Exemple 3: Modification du VideoPlayerModal existant
 * 
 * Patch à appliquer sur votre fichier VideoPlayerModal.jsx
 */

// AVANT (exemple de votre code actuel)
/*
export default function VideoPlayerModal({ video, isOpen, onClose }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <video src={video.file_url} controls />
                
                <div className="flex gap-2 mt-4">
                    <Button onClick={handleDownload}>Télécharger</Button>
                    <Button onClick={handleShare}>Partager</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
*/

// APRÈS (avec le système de clips intégré)
/*
import { useState } from 'react';
import { Scissors } from 'lucide-react';
import VideoClipEditor from '@/components/player/VideoClipEditor';

export default function VideoPlayerModal({ video, isOpen, onClose }) {
    // ✅ AJOUTER CET ÉTAT
    const [clipEditorOpen, setClipEditorOpen] = useState(false);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <video src={video.file_url} controls />
                    
                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleDownload}>Télécharger</Button>
                        <Button onClick={handleShare}>Partager</Button>
                        
                        {/* ✅ AJOUTER CE BOUTON *\/}
                        {video.is_unlocked && (
                            <Button 
                                variant="outline"
                                onClick={() => setClipEditorOpen(true)}
                            >
                                <Scissors className="h-4 w-4 mr-2" />
                                Créer un Clip
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ✅ AJOUTER CE MODAL *\/}
            <VideoClipEditor
                isOpen={clipEditorOpen}
                onClose={() => setClipEditorOpen(false)}
                video={video}
                onClipCreated={(clip) => {
                    console.log('Clip créé:', clip);
                }}
            />
        </>
    );
}
*/

/**
 * Exemple 4: Page "Mes Clips" autonome
 */
export function MyClipsPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Mes Clips</h1>
                <p className="text-gray-600 mt-2">
                    Gérez vos clips et partagez-les sur les réseaux sociaux
                </p>
            </div>

            <ClipsList />
        </div>
    );
}

/**
 * Exemple 5: Widget "Mes derniers clips" pour le dashboard
 */
export function RecentClipsWidget() {
    const [clips, setClips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        clipService.getMyClips()
            .then(response => {
                // Prendre les 3 derniers clips
                setClips(response.clips.slice(0, 3));
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Chargement...</div>;

    if (clips.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Scissors className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun clip créé</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {clips.map(clip => (
                <div key={clip.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <img
                        src={clip.thumbnail_url}
                        alt={clip.title}
                        className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{clip.title}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(clip.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
                <a href="/my-clips">Voir tous mes clips</a>
            </Button>
        </div>
    );
}

/**
 * Instructions d'intégration:
 * 
 * 1. Choisissez l'exemple qui correspond à votre besoin
 * 2. Copiez le code dans votre fichier
 * 3. Ajustez les imports selon votre structure
 * 4. Testez dans votre environnement de développement
 * 
 * Notes:
 * - SimpleClipButton: Solution minimale, facile à intégrer
 * - VideoPlayerWithClips: Solution complète avec onglets
 * - MyClipsPage: Page dédiée pour la navigation
 * - RecentClipsWidget: Pour afficher sur le dashboard
 */
