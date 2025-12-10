import { useState, useEffect } from 'react';
import { adminService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Coins, AlertCircle, Check } from 'lucide-react';

export default function CreditPackagesManager() {
    const [packages, setPackages] = useState({ player: [], club: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [activeTab, setActiveTab] = useState('player');

    const [formData, setFormData] = useState({
        credits: '',
        price_dt: '',
        description: '',
        is_popular: false,
        package_type: 'player'
    });

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            setLoading(true);
            const [playerRes, clubRes] = await Promise.all([
                adminService.getCreditPackages('player'),
                adminService.getCreditPackages('club')
            ]);

            setPackages({
                player: playerRes.data.packages || [],
                club: clubRes.data.packages || []
            });
            setError('');
        } catch (err) {
            setError('Erreur lors du chargement des packages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (pkg = null, type = 'player') => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({
                credits: pkg.credits,
                price_dt: pkg.price_dt,
                description: pkg.description || '',
                is_popular: pkg.popular || false,
                package_type: pkg.type
            });
        } else {
            setEditingPackage(null);
            setFormData({
                credits: '',
                price_dt: '',
                description: '',
                is_popular: false,
                package_type: type
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPackage(null);
        setFormData({
            credits: '',
            price_dt: '',
            description: '',
            is_popular: false,
            package_type: 'player'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.credits || !formData.price_dt) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            const data = {
                credits: parseInt(formData.credits),
                price_dt: parseInt(formData.price_dt),
                description: formData.description,
                is_popular: formData.is_popular,
                package_type: formData.package_type
            };

            if (editingPackage) {
                await adminService.updateCreditPackage(editingPackage.id, data);
                setSuccess('Package modifié avec succès');
            } else {
                await adminService.createCreditPackage(data);
                setSuccess('Package créé avec succès');
            }

            handleCloseModal();
            loadPackages();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
            console.error(err);
        }
    };

    const handleDelete = async (packageId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce package ?')) {
            return;
        }

        try {
            await adminService.deleteCreditPackage(packageId);
            setSuccess('Package supprimé avec succès');
            loadPackages();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la suppression');
            console.error(err);
        }
    };

    const PackageCard = ({ pkg }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Coins className="h-5 w-5 text-yellow-500" />
                            <span className="font-bold text-lg">{pkg.credits} crédits</span>
                            {pkg.popular && <Badge className="bg-blue-500">Populaire</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{pkg.description}</p>
                    </div>
                    <div className="text-right ml-4">
                        <div className="font-bold text-xl text-green-600">{pkg.price_dt} DT</div>
                        {pkg.savings_dt > 0 && (
                            <div className="text-sm text-green-500">
                                Économie: {pkg.savings_dt} DT
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(pkg)}
                        className="flex-1"
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(pkg.id)}
                        className="flex-1"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="text-gray-500">Chargement des packages...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                    <Check className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Coins className="h-6 w-6 text-yellow-500" />
                            Gestion des Packages de Crédits
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="player">Packages Joueurs ({packages.player.length})</TabsTrigger>
                            <TabsTrigger value="club">Packages Clubs ({packages.club.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="player" className="space-y-4">
                            <div className="flex justify-end mb-4">
                                <Button onClick={() => handleOpenModal(null, 'player')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nouveau Package Joueur
                                </Button>
                            </div>

                            {packages.player.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Aucun package joueur. Cliquez sur "Nouveau Package Joueur" pour en créer un.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {packages.player.map(pkg => (
                                        <PackageCard key={pkg.id} pkg={pkg} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="club" className="space-y-4">
                            <div className="flex justify-end mb-4">
                                <Button onClick={() => handleOpenModal(null, 'club')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nouveau Package Club
                                </Button>
                            </div>

                            {packages.club.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Aucun package club. Cliquez sur "Nouveau Package Club" pour en créer un.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {packages.club.map(pkg => (
                                        <PackageCard key={pkg.id} pkg={pkg} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Modal de création/édition */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPackage ? 'Modifier le Package' : 'Nouveau Package'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="credits">Nombre de Crédits *</Label>
                            <Input
                                id="credits"
                                type="number"
                                value={formData.credits}
                                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                placeholder="Ex: 100"
                                required
                                min="1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="price_dt">Prix en DT *</Label>
                            <Input
                                id="price_dt"
                                type="number"
                                value={formData.price_dt}
                                onChange={(e) => setFormData({ ...formData, price_dt: e.target.value })}
                                placeholder="Ex: 700"
                                required
                                min="1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ex: Pack populaire"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_popular"
                                checked={formData.is_popular}
                                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="is_popular" className="cursor-pointer">
                                Marquer comme populaire
                            </Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseModal}>
                                Annuler
                            </Button>
                            <Button type="submit">
                                {editingPackage ? 'Modifier' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
