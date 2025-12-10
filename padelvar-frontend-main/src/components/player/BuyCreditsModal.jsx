import { useState, useEffect } from 'react';
import { videoService } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Coins, CreditCard, Loader2, Check, ShoppingCart, Smartphone, Wallet, Phone } from 'lucide-react';

const BuyCreditsModal = ({ isOpen, onClose, onCreditsUpdated }) => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState('pack_10'); // Pack populaire par défaut
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
      const [packagesResponse, paymentResponse] = await Promise.all([
        videoService.getCreditPackages(),
        videoService.getPaymentMethods()
      ]);
      setCreditPackages(packagesResponse.data.packages || []);
      setPaymentMethods(paymentResponse.data.payment_methods || []);
      setSelectedPaymentMethod(paymentResponse.data.default_method || 'konnect');
    } catch (error) {
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
      const response = await videoService.buyCredits({
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Coins className="h-5 w-5 mr-2 text-yellow-500" />
            Acheter des Crédits
          </DialogTitle>
          <DialogDescription>
            Rechargez votre solde pour enregistrer vos matchs. Paiement sécurisé en Dinars Tunisiens (DT).
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 text-green-800">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {/* Solde actuel */}
          <Card>
            <CardContent className="pt-6 flex justify-between items-center">
              <span className="text-sm">Solde actuel:</span>
              <span className="font-bold flex items-center">
                <Coins className="h-4 w-4 mr-1.5 text-yellow-500" />
                {user?.credits_balance || 0} crédits
              </span>
            </CardContent>
          </Card>
          
          {/* Sélection des packages */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Choisissez votre package</Label>
            <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {creditPackages.map((pkg) => (
                <Card key={pkg.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedPackage === pkg.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={pkg.id} id={pkg.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {pkg.credits} crédits
                              {pkg.popular && <Badge className="bg-blue-500">Populaire</Badge>}
                              {pkg.badge && <Badge variant="outline" className="text-green-600">{pkg.badge}</Badge>}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{pkg.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{pkg.price_dt} DT</div>
                            {pkg.original_price_dt && (
                              <div className="text-sm text-gray-500 line-through">{pkg.original_price_dt} DT</div>
                            )}
                            {pkg.savings_dt > 0 && (
                              <div className="text-sm text-green-600 font-medium">
                                Économie: {pkg.savings_dt} DT
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handlePurchase} disabled={isLoading || !getSelectedPackage()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Acheter {getSelectedPackage()?.price_dt} DT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyCreditsModal;
