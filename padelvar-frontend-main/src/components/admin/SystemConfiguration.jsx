import { useState, useEffect } from 'react';
import { adminService } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CreditPackagesManager from './CreditPackagesManager';
import {
    Settings,
    Cloud,
    Server,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    Loader2,
    Coins
} from 'lucide-react';

const SystemConfiguration = () => {
    const [loading, setLoading] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Bunny CDN State
    const [bunnyConfig, setBunnyConfig] = useState({
        api_key: '',
        library_id: '',
        cdn_hostname: '',
        storage_zone: ''
    });

    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        loadBunnyConfig();
    }, []);

    const loadBunnyConfig = async () => {
        try {
            setLoading(true);
            const response = await adminService.getBunnyCDNConfig();

            setBunnyConfig({
                api_key: '', // Ne jamais afficher l'API key existante
                library_id: response.data.library_id || '',
                cdn_hostname: response.data.cdn_hostname || '',
                storage_zone: response.data.storage_zone || 'padel-videos'
            });
        } catch (error) {
            console.error('Error loading Bunny CDN config:', error);
            setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleBunnyConfigChange = (field, value) => {
        setBunnyConfig(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear message when user starts typing
        if (message.text) {
            setMessage({ type: '', text: '' });
        }
    };

    const testBunnyConnection = async () => {
        if (!bunnyConfig.api_key || !bunnyConfig.library_id) {
            setMessage({ type: 'error', text: 'API Key et Library ID requis pour tester la connexion' });
            return;
        }

        try {
            setTestingConnection(true);
            setMessage({ type: '', text: '' });

            const response = await adminService.testBunnyCDN({
                api_key: bunnyConfig.api_key,
                library_id: bunnyConfig.library_id
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: '✅ Connexion Bunny CDN réussie !' });
            } else {
                setMessage({ type: 'error', text: response.data.message || 'Échec de la connexion' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erreur lors du test de connexion'
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const saveBunnyConfig = async () => {
        if (!bunnyConfig.api_key || !bunnyConfig.library_id || !bunnyConfig.cdn_hostname) {
            setMessage({ type: 'error', text: 'Tous les champs obligatoires doivent être remplis' });
            return;
        }

        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            await adminService.updateBunnyCDNConfig(bunnyConfig);

            setMessage({ type: 'success', text: 'Configuration Bunny CDN enregistrée avec succès !' });

            // Reload config after  save
            setTimeout(() => {
                loadBunnyConfig();
            }, 1500);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Erreur lors de l\'enregistrement'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Configuration Système</h2>
                <p className="text-gray-600 mt-1">Gérez les paramètres de configuration de la plateforme</p>
            </div>

            <Tabs defaultValue="bunny-cdn" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bunny-cdn">
                        <Cloud className="h-4 w-4 mr-2" />
                        Bunny CDN
                    </TabsTrigger>
                    <TabsTrigger value="credit-packages">
                        <Coins className="h-4 w-4 mr-2" />
                        Prix des Crédits
                    </TabsTrigger>
                    <TabsTrigger value="general">
                        <Server className="h-4 w-4 mr-2" />
                        Général
                    </TabsTrigger>
                </TabsList>

                {/* Bunny CDN Configuration */}
                <TabsContent value="bunny-cdn">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Bunny CDN</CardTitle>
                            <CardDescription>
                                Gérez les paramètres de connexion à Bunny Stream pour le stockage vidéo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <>
                                    {message.text && (
                                        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                                            <AlertDescription className="flex items-center gap-2">
                                                {message.type === 'success' ? (
                                                    <CheckCircle className="h-4 w-4" />
                                                ) : (
                                                    <XCircle className="h-4 w-4" />
                                                )}
                                                {message.text}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="api_key">API Key *</Label>
                                        <div className="relative">
                                            <Input
                                                id="api_key"
                                                type={showApiKey ? 'text' : 'password'}
                                                placeholder="Entrez votre API Key Bunny CDN"
                                                value={bunnyConfig.api_key}
                                                onChange={(e) => handleBunnyConfigChange('api_key', e.target.value)}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">Clé d'API pour l'authentification Bunny Stream</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="library_id">Library ID *</Label>
                                        <Input
                                            id="library_id"
                                            type="text"
                                            placeholder="555438"
                                            value={bunnyConfig.library_id}
                                            onChange={(e) => handleBunnyConfigChange('library_id', e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">Identifiant de votre bibliothèque vidéo Bunny</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cdn_hostname">CDN Hostname *</Label>
                                        <Input
                                            id="cdn_hostname"
                                            type="text"
                                            placeholder="vz-82bd892c-344.b-cdn.net"
                                            value={bunnyConfig.cdn_hostname}
                                            onChange={(e) => handleBunnyConfigChange('cdn_hostname', e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">Nom d'hôte CDN pour la diffusion vidéo</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="storage_zone">Storage Zone</Label>
                                        <Input
                                            id="storage_zone"
                                            type="text"
                                            placeholder="padel-videos"
                                            value={bunnyConfig.storage_zone}
                                            onChange={(e) => handleBunnyConfigChange('storage_zone', e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">Zone de stockage (optionnel)</p>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            onClick={testBunnyConnection}
                                            disabled={testingConnection || !bunnyConfig.api_key || !bunnyConfig.library_id}
                                            variant="outline"
                                        >
                                            {testingConnection ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Test en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Tester la connexion
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            onClick={saveBunnyConfig}
                                            disabled={saving || !bunnyConfig.api_key || !bunnyConfig.library_id || !bunnyConfig.cdn_hostname}
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Enregistrement...
                                                </>
                                            ) : (
                                                'Enregistrer'
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Credit Packages Management */}
                <TabsContent value="credit-packages">
                    <CreditPackagesManager />
                </TabsContent>

                {/* General Configuration */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Générale</CardTitle>
                            <CardDescription>
                                Paramètres généraux de l'application
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm">
                                D'autres configurations seront ajoutées ici (SMTP, notifications, etc.)
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SystemConfiguration;
