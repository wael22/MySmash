import { useState, useEffect } from 'react';
import { clubService } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Edit, 
  Plus, 
  Loader2,
  Mail,
  Phone,
  Calendar,
  Coins,
  User
} from 'lucide-react';

const FollowersManagement = () => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [creditsForm, setCreditsForm] = useState({ credits: '' });
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadFollowers();
  }, []);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const response = await clubService.getFollowers();
      setFollowers(response.data.followers ?? []);
    } catch (error) {
      setError('Erreur lors du chargement des followers');
      console.error('Error loading followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name,
      phone_number: player.phone_number || '',
      credits_balance: player.credits_balance
    });
  };

  const handleUpdatePlayer = async () => {
    try {
      setActionLoading(prev => ({ ...prev, [`edit_${editingPlayer.id}`]: true }));
      
      await clubService.updateFollower(editingPlayer.id, editForm);
      
      // Mettre à jour l'état local
      setFollowers(followers.map(follower => 
        follower.id === editingPlayer.id 
          ? { ...follower, ...editForm }
          : follower
      ));
      
      setEditingPlayer(null);
      setEditForm({});
      
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la mise à jour');
      console.error('Error updating player:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [`edit_${editingPlayer.id}`]: false }));
    }
  };

  const handleAddCredits = async (playerId) => {
    try {
      const credits = parseInt(creditsForm.credits);
      if (!credits || credits <= 0) {
        setError('Veuillez entrer un nombre de crédits valide');
        return;
      }

      setActionLoading(prev => ({ ...prev, [`credits_${playerId}`]: true }));
      
      await clubService.addCreditsToFollower(playerId, credits);
      
      // Mettre à jour l'état local
      setFollowers(followers.map(follower => 
        follower.id === playerId 
          ? { ...follower, credits_balance: follower.credits_balance + credits }
          : follower
      ));
      
      setCreditsForm({ credits: '' });
      
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de l\'ajout de crédits');
      console.error('Error adding credits:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [`credits_${playerId}`]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Followers</h2>
          <p className="text-gray-600 mt-2">
            Gérez les joueurs qui suivent votre club ({(followers ?? []).length} followers)
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {followers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun follower
            </h3>
            <p className="text-gray-600 text-center">
              Aucun joueur ne suit actuellement votre club
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {followers.map((follower) => (
            <Card key={follower.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {follower.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {follower.credits_balance} crédits
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informations du follower */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{follower.email}</span>
                  </div>
                  {follower.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{follower.phone_number}</span>
                    </div>
                  )}
                  {follower.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Inscrit le {formatDate(follower.created_at)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {/* Modifier le joueur */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPlayer(follower)}
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier {follower.name}</DialogTitle>
                        <DialogDescription>
                          Modifiez les informations du joueur qui suit votre club
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nom</Label>
                          <Input
                            id="name"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={editForm.phone_number || ''}
                            onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="credits">Solde de crédits</Label>
                          <Input
                            id="credits"
                            type="number"
                            value={editForm.credits_balance || 0}
                            onChange={(e) => setEditForm({...editForm, credits_balance: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleUpdatePlayer}
                          disabled={actionLoading[`edit_${editingPlayer?.id}`]}
                        >
                          {actionLoading[`edit_${editingPlayer?.id}`] && (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          )}
                          Sauvegarder
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Ajouter des crédits */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter des crédits
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter des crédits à {follower.name}</DialogTitle>
                        <DialogDescription>
                          Solde actuel: {follower.credits_balance} crédits
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="credits-amount">Nombre de crédits à ajouter</Label>
                          <Input
                            id="credits-amount"
                            type="number"
                            min="1"
                            value={creditsForm.credits}
                            onChange={(e) => setCreditsForm({credits: e.target.value})}
                            placeholder="Ex: 10"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={() => handleAddCredits(follower.id)}
                          disabled={actionLoading[`credits_${follower.id}`]}
                        >
                          {actionLoading[`credits_${follower.id}`] && (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          )}
                          <Coins className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowersManagement;

