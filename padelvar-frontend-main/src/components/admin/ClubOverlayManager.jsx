
import React, { useState, useEffect, useRef } from 'react';
import { adminService, getAssetUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, Edit, Plus, Upload, Save, X, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import { ScrollArea } from '@/components/ui/scroll-area';

export default function ClubOverlayManager({ club, isOpen, onClose }) {
    const [overlays, setOverlays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // États pour l'édition/création
    const [editingOverlay, setEditingOverlay] = useState(null); // null = mode liste, object = mode édition/création
    const [formData, setFormData] = useState(getInitialFormData());

    // Ref pour l'upload
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (isOpen && club) {
            loadOverlays();
            setEditingOverlay(null);
            setError('');
        }
    }, [isOpen, club]);

    function getInitialFormData() {
        return {
            name: '',
            image_url: '',
            position_x: 5,
            position_y: 5,
            width: 15,
            opacity: 1.0,
            is_active: true
        };
    }

    const loadOverlays = async () => {
        try {
            setLoading(true);
            const response = await adminService.getClubOverlays(club.id);
            setOverlays(response.data.overlays || []);
        } catch (err) {
            console.error('Erreur chargement overlays:', err);
            setError('Impossible de charger les overlays.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Upload immédiat pour obtenir l'URL
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            setIsSubmitting(true);
            // Simuler l'upload si la méthode n'existe pas encore (fallback) ou utiliser la vraie
            let url = '';
            if (adminService.uploadImage) {
                const res = await adminService.uploadImage(uploadData);
                url = res.data.url;
            } else {
                // Fallback temporaire (ne marchera pas sans backend)
                throw new Error("Service d'upload non configuré");
            }

            setFormData(prev => ({ ...prev, image_url: url }));
            setPreviewUrl(url); // Pour affichage immédiat
        } catch (err) {
            console.error('Erreur upload:', err);
            setError("Erreur lors de l'upload de l'image.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSubmitting(true);
            setError('');

            const dataToSend = {
                ...formData,
                // Conversion explicite des types si besoin
                position_x: parseFloat(formData.position_x),
                position_y: parseFloat(formData.position_y),
                width: parseFloat(formData.width),
                opacity: parseFloat(formData.opacity),
            };

            if (editingOverlay && editingOverlay.id) {
                // Mise à jour
                await adminService.updateClubOverlay(club.id, editingOverlay.id, dataToSend);
            } else {
                // Création
                await adminService.createClubOverlay(club.id, dataToSend);
            }

            await loadOverlays();
            setEditingOverlay(null); // Retour liste
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            setError("Erreur lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (overlayId) => {
        if (!confirm('Supprimer cet overlay ?')) return;
        try {
            await adminService.deleteClubOverlay(club.id, overlayId);
            loadOverlays();
        } catch (err) {
            console.error('Erreur suppression:', err);
            setError("Erreur lors de la suppression.");
        }
    };

    const startEdit = (overlay) => {
        setEditingOverlay(overlay);
        setFormData({
            name: overlay.name,
            image_url: overlay.image_url,
            position_x: overlay.position_x,
            position_y: overlay.position_y,
            width: overlay.width,
            opacity: overlay.opacity,
            is_active: overlay.is_active
        });
        setPreviewUrl(getAssetUrl(overlay.image_url));
    };

    const startCreate = () => {
        setEditingOverlay({ new: true }); // Marqueur pour dire qu'on crée
        setFormData(getInitialFormData());
        setPreviewUrl(null);
    };

    // --- RENDU ---

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="!max-w-[90vw] w-[90vw] h-[90vh] flex flex-col p-0 gap-0 sm:max-w-[90vw]">
                <DialogHeader className="p-6 border-b shrink-0 bg-white z-10">
                    <DialogTitle className="text-2xl">Gestion des Overlays Vidéo - {club?.name}</DialogTitle>
                    <DialogDescription className="text-base">
                        Gérez les logos et images flottantes qui s'affichent sur les vidéos de ce club.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-row">
                    {/* Colonne Gauche: Liste ou Formulaire */}
                    <div className="w-[500px] shrink-0 border-r bg-slate-50 flex flex-col">
                        <ScrollArea className="h-full w-full">
                            <div className="p-6 pr-6">
                                {error && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {editingOverlay ? (
                                    // --- FORMULAIRE ---
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-lg">
                                                {editingOverlay.id ? 'Modifier Overlay' : 'Nouvel Overlay'}
                                            </h3>
                                            <Button variant="ghost" size="sm" onClick={() => setEditingOverlay(null)}>
                                                <X className="h-4 w-4 mr-2" /> Annuler
                                            </Button>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-base font-medium">Image de l'overlay</Label>
                                                <div className="flex gap-6 items-start p-4 bg-white border rounded-lg shadow-sm">
                                                    <div className="border rounded bg-gray-50 w-32 h-32 flex items-center justify-center relative overflow-hidden shrink-0">
                                                        {previewUrl ? (
                                                            <img src={getAssetUrl(previewUrl)} alt="Preview" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <ImageIcon className="text-gray-300 h-12 w-12" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-4">
                                                        <div>
                                                            <Label htmlFor="image-upload" className="mb-2 block">Choisir un fichier</Label>
                                                            <Input
                                                                id="image-upload"
                                                                type="file"
                                                                accept="image/*"
                                                                ref={fileInputRef}
                                                                onChange={handleFileChange}
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                        <div className="text-sm text-gray-500 bg-blue-50 p-2 rounded text-blue-700">
                                                            ℹ️ Format PNG transparent recommandé pour un meilleur rendu vidéo.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2 col-span-2">
                                                    <Label>Nom (Optionnel)</Label>
                                                    <Input
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="Ex: Logo Sponsor principal"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label>Position X ({formData.position_x}%)</Label>
                                                    </div>
                                                    <Slider
                                                        value={[formData.position_x]}
                                                        max={100} step={1}
                                                        onValueChange={([val]) => setFormData({ ...formData, position_x: val })}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label>Position Y ({formData.position_y}%)</Label>
                                                    </div>
                                                    <Slider
                                                        value={[formData.position_y]}
                                                        max={100} step={1}
                                                        onValueChange={([val]) => setFormData({ ...formData, position_y: val })}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label>Largeur ({formData.width}%)</Label>
                                                    </div>
                                                    <Slider
                                                        value={[formData.width]}
                                                        max={50} step={1}
                                                        onValueChange={([val]) => setFormData({ ...formData, width: val })}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label>Opacité ({formData.opacity})</Label>
                                                    </div>
                                                    <Slider
                                                        value={[formData.opacity]}
                                                        max={1} step={0.1}
                                                        onValueChange={([val]) => setFormData({ ...formData, opacity: val })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={formData.is_active}
                                                        onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                                                    />
                                                    <Label>Overlay Actif</Label>
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button variant="outline" onClick={() => setEditingOverlay(null)}>Annuler</Button>
                                                    <Button onClick={handleSave} disabled={isSubmitting || !formData.image_url}>
                                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Sauvegarder
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // --- LISTE ---
                                    <div className="space-y-6">
                                        <div className="flex flex-row justify-between items-center pb-4 border-b">
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">Overlays configurés</h3>
                                                <p className="text-sm text-gray-500">{overlays.length} élément(s)</p>
                                            </div>
                                            <Button onClick={startCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap">
                                                <Plus className="mr-2 h-4 w-4" /> Ajouter
                                            </Button>
                                        </div>

                                        {loading ? (
                                            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                                        ) : overlays.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 italic border-2 border-dashed rounded-lg bg-gray-50">
                                                Aucun overlay configuré pour ce club.
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {overlays.map(overlay => (
                                                    <div key={overlay.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group">

                                                        {/* Image */}
                                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                                                            <img src={getAssetUrl(overlay.image_url)} alt={overlay.name} className="max-w-full max-h-full object-contain" />
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1 min-w-0 flex flex-col h-20 justify-center gap-1">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-semibold text-gray-900 truncate text-base" title={overlay.name}>
                                                                    {overlay.name || 'Sans nom'}
                                                                </h4>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono border">
                                                                    Pos: {overlay.position_x}% / {overlay.position_y}%
                                                                </span>
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono border">
                                                                    Taille: {overlay.width}%
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant={overlay.is_active ? "default" : "secondary"} className={overlay.is_active ? "bg-green-600 hover:bg-green-700 h-5" : "bg-gray-200 text-gray-600 hover:bg-gray-300 h-5"}>
                                                                    {overlay.is_active ? "Actif" : "Inactif"}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Actions (Vertical or Horizontal based on space, here simplified) */}
                                                        <div className="flex flex-col gap-2 h-20 justify-center border-l pl-4 ml-2">
                                                            <Button variant="ghost" size="sm" onClick={() => startEdit(overlay)} className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(overlay.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Colonne Droite: Prévisualisation */}
                    <div className="flex-1 bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                        <h3 className="mb-6 text-gray-400 font-medium z-10 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Prévisualisation Vidéo (16:9)
                        </h3>

                        {/* Conteneur Vidéo Simulé */}
                        <div className="relative w-full aspect-video bg-gray-900 rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
                            {/* Contenu fictif vidéo */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-4xl select-none">
                                VIDEO PADEL
                            </div>

                            {/* Affichage des overlays (soit celui en cours d'édition, soit tous si mode liste) */}

                            {/* Si mode édition: n'afficher QUE celui qu'on édite pour bien voir */}
                            {editingOverlay && formData.image_url && (
                                <img
                                    src={getAssetUrl(formData.image_url)}
                                    alt="Preview"
                                    style={{
                                        position: 'absolute',
                                        left: `${formData.position_x}%`,
                                        top: `${formData.position_y}%`,
                                        width: `${formData.width}%`,
                                        opacity: formData.opacity,
                                        transition: 'all 0.2s ease',
                                        border: '2px dashed yellow', // Highlight pour l'édition
                                        zIndex: 50
                                    }}
                                />
                            )}

                            {/* Si mode liste: afficher tous les overlays actifs comme ils apparaîtront réellement */}
                            {!editingOverlay && overlays.map(ov => ov.is_active && (
                                <img
                                    key={ov.id}
                                    src={getAssetUrl(ov.image_url)}
                                    alt={ov.name}
                                    style={{
                                        position: 'absolute',
                                        left: `${ov.position_x}%`,
                                        top: `${ov.position_y}%`,
                                        width: `${ov.width}%`,
                                        opacity: ov.opacity,
                                        zIndex: 10
                                    }}
                                />
                            ))}
                        </div>

                        <p className="mt-4 text-sm text-gray-500 max-w-md text-center">
                            {editingOverlay
                                ? "Ajustez les curseurs à gauche pour positionner l'overlay."
                                : "Voici comment les overlays actifs apparaîtront sur les vidéos."}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
