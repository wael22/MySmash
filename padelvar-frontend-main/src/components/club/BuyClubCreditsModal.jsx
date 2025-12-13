import { useState, useEffect } from 'react';
import { clubService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Coins, Loader2, Check, ShoppingCart, Smartphone, Wallet, CreditCard, Phone } from 'lucide-react';

const BuyClubCreditsModal = ({ isOpen, onClose, onCreditsUpdated, club }) => {
    const [selectedPackage, setSelectedPackage] = useState('pack_500');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('konnect');
    const [creditPackages, setCreditPackages] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadPackagesAndPaymentMethods();
        }
    }, [isOpen]);

    const loadPackagesAndPaymentMethods = async () => {
        try {
            // Utiliser les routes spécifiques aux clubs
            const [packagesResponse, paymentResponse] = await Promise.all([
                clubService.getCreditPackages(),
                clubService.getPaymentMethods()
            ]);
            setCreditPackages(packagesResponse.data.packages || []);
            setPaymentMethods(paymentResponse.data.payment_methods || []);
            setSelectedPaymentMethod(paymentResponse.data.default_method || 'konnect');
        } catch (error) {
            console.error('Erreur chargement packages/paiements:', error);
            setError('Erreur lors du chargement des données');
        }
    };

    const getSelectedPackage = () => {
        return creditPackages.find(pkg => pkg.id === selectedPackage);
    };

    const getPaymentIcon = (method) => {
        switch (method.id) {
            case 'konnect': return <Smartphone className="h-4 w-4" />;
            case 'flouci': return <Wallet className="h-4 w-4" />;
            case 'carte_bancaire': return <CreditCard className="h-4 w-4" />;
            default: return <Phone className="h-4 w-4" />;
        }
    };

    const handlePurchase = async () => {
        const selectedPkg = getSelectedPackage();
        if (!selectedPkg) {
            setError('Veuillez sélectionner un package');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await clubService.buyCredits({
                credits_amount: selectedPkg.credits,
                payment_method: selectedPaymentMethod,
                package_type: selectedPkg.type,
                package_id: selectedPkg.id
            });

            setSuccess(`${selectedPkg.credits} crédits achetés avec succès pour ${selectedPkg.price_dt} DT !`);
            if (onCreditsUpdated) onCreditsUpdated();
            setTimeout(onClose, 2000);
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors de l\'achat');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-xl font-semibold">
                        <Coins className="h-5 w-5 mr-2 text-yellow-500" />
                        Acheter des Crédits pour le Club
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Rechargez le solde de votre club pour offrir des crédits à vos joueurs. Paiement sécurisé en Dinars Tunisiens (DT).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {error && (
                        <Alert variant="destructive" className="rounded-xl">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="bg-green-50 text-green-800 border-green-200 rounded-xl">
                            <Check className="h-4 w-4" />
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {/* Solde actuel */}
                    <div className="card-modern bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Solde actuel du club:</span>
                            <span className="font-bold text-xl flex items-center text-yellow-900">
                                <Coins className="h-5 w-5 mr-1.5 text-yellow-500" />
                                {club?.credits_balance || 0} crédits
                            </span>
                        </div>
                    </div>

                    {/* Sélection des packages */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block text-gray-900">Choisissez votre package</Label>
                        <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {creditPackages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    className={`card-modern cursor-pointer transition-all hover:shadow-lg ${selectedPackage === pkg.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    onClick={() => setSelectedPackage(pkg.id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <RadioGroupItem value={pkg.id} id={pkg.id} className="mt-1 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-base mb-1 flex items-center gap-2 flex-wrap">
                                                        {pkg.credits} crédits
                                                        {pkg.popular && <Badge className="bg-blue-500 rounded-full px-2 text-xs">Populaire</Badge>}
                                                        {pkg.badge && <Badge variant="outline" className="text-green-600 rounded-full text-xs">{pkg.badge}</Badge>}
                                                    </div>
                                                    <div className="text-sm text-gray-600">{pkg.description}</div>
                                                </div>
                                                <div className="text-right flex-shrink-0 min-w-[100px]">
                                                    <div className="font-bold text-xl text-gray-900 whitespace-nowrap">{pkg.price_dt} DT</div>
                                                    {pkg.original_price_dt && (
                                                        <div className="text-xs text-gray-400 line-through whitespace-nowrap">{pkg.original_price_dt} DT</div>
                                                    )}
                                                    {pkg.savings_dt > 0 && (
                                                        <div className="text-xs text-green-600 font-medium mt-1 whitespace-nowrap">
                                                            Économie: {pkg.savings_dt} DT
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Méthodes de paiement */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">Méthode de paiement</Label>
                        <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {paymentMethods.map((method) => (
                                <Card key={method.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedPaymentMethod === method.id ? 'ring-2 ring-blue-500' : ''} ${!method.enabled ? 'opacity-50' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value={method.id} id={method.id} disabled={!method.enabled} />
                                            <div className="flex items-center space-x-3 flex-1">
                                                {getPaymentIcon(method)}
                                                <div>
                                                    <div className="font-medium">{method.name}</div>
                                                    <div className="text-sm text-gray-600">{method.description}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Traitement: {method.processing_time}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Récapitulatif */}
                    {getSelectedPackage() && (
                        <Card className="bg-blue-50">
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Package sélectionné:</span>
                                        <span className="font-medium">{getSelectedPackage().credits} crédits</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Prix:</span>
                                        <span className="font-medium">{getSelectedPackage().price_dt} DT</span>
                                    </div>
                                    {getSelectedPackage().savings_dt > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Économie:</span>
                                            <span className="font-medium">{getSelectedPackage().savings_dt} DT</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Méthode de paiement:</span>
                                        <span className="font-medium">
                                            {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="btn-secondary-modern px-6"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handlePurchase}
                            disabled={isLoading || !getSelectedPackage()}
                            className="btn-primary-modern px-6"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Traitement...</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="h-4 w-4" />
                                    <span>Acheter {getSelectedPackage()?.price_dt} DT</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BuyClubCreditsModal;
