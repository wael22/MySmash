import { useState, useEffect } from 'react';
import { videoService } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, TrendingUp, Package, CreditCard, Smartphone, Wallet, Clock, Info } from 'lucide-react';

const CreditSystemDisplay = ({ onBuyCreditsClick }) => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [creditsHistory, setCreditsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCreditSystem();
  }, []);

  const loadCreditSystem = async () => {
    try {
      setLoading(true);
      const [packagesRes, paymentRes, historyRes] = await Promise.all([
        videoService.getCreditPackages(),
        videoService.getPaymentMethods(),
        videoService.getCreditsHistory()
      ]);
      
      setPackages(packagesRes.data.packages || []);
      setPaymentMethods(paymentRes.data.payment_methods || []);
      setCreditsHistory(historyRes.data.history || []);
    } catch (err) {
      setError('Erreur lors du chargement du système de crédits');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (methodId) => {
    switch (methodId) {
      case 'konnect': return <Smartphone className="h-4 w-4" />;
      case 'flouci': return <Wallet className="h-4 w-4" />;
      case 'carte_bancaire': return <CreditCard className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div>Chargement du système de crédits...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-6">
      {/* En-tête du système de crédits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coins className="h-5 w-5 mr-2 text-yellow-500" />
            Système de Crédits PadelVar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {user?.credits_balance || 0}
              </div>
              <div className="text-sm text-gray-600">Crédits disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">10 DT</div>
              <div className="text-sm text-gray-600">Prix par crédit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {packages.filter(p => p.type === 'pack').length}
              </div>
              <div className="text-sm text-gray-600">Packs économiques</div>
            </div>
          </div>
          <Button onClick={onBuyCreditsClick} className="w-full mt-4">
            <Package className="h-4 w-4 mr-2" />
            Recharger mes crédits
          </Button>
        </CardContent>
      </Card>

      {/* Packages disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Packages Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {packages.slice(0, 6).map((pkg) => (
              <Card key={pkg.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold">{pkg.credits} crédits</div>
                      <div className="text-sm text-gray-600">{pkg.price_dt} DT</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {pkg.popular && <Badge className="bg-blue-500 text-xs">Populaire</Badge>}
                      {pkg.discount_percent > 0 && (
                        <Badge variant="outline" className="text-green-600 text-xs">
                          -{pkg.discount_percent}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  {pkg.savings_dt > 0 && (
                    <div className="text-xs text-green-600">
                      Économie: {pkg.savings_dt} DT
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">{pkg.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Méthodes de paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Méthodes de Paiement Sécurisées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center p-3 border rounded-lg">
                <div className="mr-3">{getPaymentIcon(method.id)}</div>
                <div className="flex-1">
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm text-gray-600">{method.description}</div>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {method.processing_time}
                  </div>
                </div>
                {method.enabled && (
                  <Badge variant="outline" className="text-green-600">Disponible</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historique récent */}
      {creditsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Historique Récent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {creditsHistory.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="font-medium">
                      {transaction.action_type === 'buy_credits' ? 'Achat de crédits' : 'Utilisation crédit'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(transaction.performed_at)}
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.action_type === 'buy_credits' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.action_type === 'buy_credits' ? '+' : '-'}
                    {transaction.credits_involved || 1} crédit(s)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations importantes */}
      <Card className="bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-900">Informations importantes</div>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Les crédits n'expirent jamais</li>
                <li>• Paiement sécurisé en Dinars Tunisiens (DT)</li>
                <li>• Support disponible 24h/7j pour toute question</li>
                <li>• Remboursement possible sous 7 jours</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditSystemDisplay;
