import { useState, useEffect } from 'react';
import { adminService } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  History, 
  Loader2,
  Heart,
  HeartOff,
  Edit,
  Plus,
  UserPlus,
  UserMinus,
  Calendar,
  User,
  Building,
  Filter,
  Search,
  ShoppingCart,
  CreditCard,
  Coins,
  Smartphone,
  Wallet,
  Video,
  Eye,
  Trash2,
  Settings,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';

const ClubHistoryAdmin = () => {
  const [allHistory, setAllHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    clubId: 'all',
    actionType: 'all',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allHistory, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyResponse, clubsResponse] = await Promise.all([
        adminService.getAllClubsHistory(),
        adminService.getAllClubs()
      ]);
      
      console.log('History data:', historyResponse.data); // Debug
      console.log('Clubs data:', clubsResponse.data); // Debug
      
      setAllHistory(historyResponse.data.history || []);
      setClubs(clubsResponse.data.clubs || []);
    } catch (error) {
      setError('Erreur lors du chargement des données');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allHistory];
    
    console.log('Applying filters:', filters); // Debug
    console.log('Total history entries:', filtered.length); // Debug

    // Filtre par club - CORRECTION: utiliser club_id au lieu de club_id
    if (filters.clubId && filters.clubId !== 'all') {
      const clubIdToFilter = parseInt(filters.clubId, 10);
      console.log('Filtering by club ID:', clubIdToFilter); // Debug
      
      filtered = filtered.filter(entry => {
        console.log('Entry club_id:', entry.club_id, 'Type:', typeof entry.club_id); // Debug
        return entry.club_id === clubIdToFilter;
      });
      
      console.log('After club filter:', filtered.length); // Debug
    }

    // Filtre par type d'action
    if (filters.actionType && filters.actionType !== 'all') {
      console.log('Filtering by action type:', filters.actionType); // Debug
      
      filtered = filtered.filter(entry => {
        console.log('Entry action_type:', entry.action_type); // Debug
        return entry.action_type === filters.actionType;
      });
      
      console.log('After action filter:', filtered.length); // Debug
    }

    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      console.log('Filtering by search:', searchLower); // Debug
      
      filtered = filtered.filter(entry => 
        (entry.player_name && entry.player_name.toLowerCase().includes(searchLower)) ||
        (entry.club_name && entry.club_name.toLowerCase().includes(searchLower)) ||
        (entry.performed_by_name && entry.performed_by_name.toLowerCase().includes(searchLower))
      );
      
      console.log('After search filter:', filtered.length); // Debug
    }

    console.log('Final filtered results:', filtered.length); // Debug
    setFilteredHistory(filtered);
  };

  const getActionIcon = (actionType) => {
    // Normaliser le type d'action (en minuscules et sans espaces)
    const normalizedType = actionType?.toLowerCase().replace(/\s+/g, '_');
    
    switch (normalizedType) {
      // Actions de suivi
      case 'follow_club':
      case 'suivi_de_club':
        return <Heart className="h-4 w-4 text-green-600" />;
      case 'unfollow_club':
      case 'arrêt_suivi_club':
        return <HeartOff className="h-4 w-4 text-red-600" />;
      
      // Actions de crédits
      case 'add_credits':
      case 'ajout_de_crédits':
        return <Plus className="h-4 w-4 text-yellow-600" />;
      case 'buy_credits':
      case 'achat_de_crédits':
      case 'purchase_credits':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      
      // Actions de paiement
      case 'payment_konnect':
      case 'paiement_konnect':
        return <Smartphone className="h-4 w-4 text-orange-600" />;
      case 'payment_flouci':
      case 'paiement_flouci':
        return <Wallet className="h-4 w-4 text-purple-600" />;
      case 'payment_card':
      case 'payment_carte_bancaire':
      case 'paiement_carte_bancaire':
        return <CreditCard className="h-4 w-4 text-indigo-600" />;
      case 'payment_simulation':
      case 'simulation_de_paiement':
        return <Coins className="h-4 w-4 text-gray-600" />;
      
      // Actions utilisateur
      case 'update_player':
      case 'update_user':
      case 'modification_utilisateur':
      case 'mise_à_jour_profil':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'create_player':
      case 'create_user':
      case 'création_utilisateur':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'delete_player':
      case 'delete_user':
      case 'suppression_utilisateur':
        return <UserMinus className="h-4 w-4 text-red-600" />;
      
      // Actions vidéo
      case 'unlock_video':
      case 'déblocage_vidéo':
        return <Eye className="h-4 w-4 text-cyan-600" />;
      case 'video_upload':
      case 'upload_vidéo':
        return <Video className="h-4 w-4 text-green-600" />;
      case 'video_delete':
      case 'suppression_vidéo':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      
      // Actions club
      case 'create_club':
      case 'création_club':
        return <Building className="h-4 w-4 text-green-600" />;
      case 'update_club':
      case 'modification_club':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'delete_club':
      case 'suppression_club':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      
      // Actions de connexion
      case 'login':
      case 'connexion':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
      case 'déconnexion':
        return <LogOut className="h-4 w-4 text-gray-600" />;
      case 'registration':
      case 'inscription':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      
      // Actions terrain
      case 'create_court':
      case 'création_terrain':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update_court':
      case 'modification_terrain':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete_court':
      case 'suppression_terrain':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      
      // Actions inconnues
      case 'unknown_action':
      case 'action_inconnue':
      case 'action_non_spécifiée':
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (actionType) => {
    // Gestion des actions déjà normalisées venant du backend
    const labels = {
      // Actions de suivi
      'follow_club': 'Suivi du club',
      'unfollow_club': 'Arrêt du suivi',
      'suivi_de_club': 'Suivi du club',
      'arrêt_suivi_club': 'Arrêt du suivi',
      
      // Actions de crédits
      'add_credits': 'Ajout de crédits',
      'buy_credits': 'Achat de crédits',
      'purchase_credits': 'Achat de crédits',
      'ajout_de_crédits': 'Ajout de crédits',
      'achat_de_crédits': 'Achat de crédits',
      
      // Actions de paiement
      'payment_konnect': 'Paiement Konnect',
      'payment_flouci': 'Paiement Flouci',
      'payment_card': 'Paiement carte bancaire',
      'payment_simulation': 'Simulation paiement',
      'paiement_konnect': 'Paiement Konnect',
      'paiement_flouci': 'Paiement Flouci',
      'paiement_carte_bancaire': 'Paiement carte bancaire',
      'simulation_de_paiement': 'Simulation paiement',
      
      // Actions utilisateur
      'update_player': 'Modification joueur',
      'update_user': 'Modification utilisateur',
      'create_player': 'Création joueur',
      'create_user': 'Création utilisateur',
      'delete_player': 'Suppression joueur',
      'delete_user': 'Suppression utilisateur',
      'modification_utilisateur': 'Modification utilisateur',
      'création_utilisateur': 'Création utilisateur',
      'suppression_utilisateur': 'Suppression utilisateur',
      'mise_à_jour_profil': 'Mise à jour profil',
      
      // Actions vidéo
      'unlock_video': 'Déblocage vidéo',
      'video_upload': 'Upload vidéo',
      'video_delete': 'Suppression vidéo',
      'déblocage_vidéo': 'Déblocage vidéo',
      'upload_vidéo': 'Upload vidéo',
      'suppression_vidéo': 'Suppression vidéo',
      
      // Actions club
      'create_club': 'Création club',
      'update_club': 'Modification club',
      'delete_club': 'Suppression club',
      'création_club': 'Création club',
      'modification_club': 'Modification club',
      'suppression_club': 'Suppression club',
      
      // Actions de connexion
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'registration': 'Inscription',
      'connexion': 'Connexion',
      'déconnexion': 'Déconnexion',
      'inscription': 'Inscription',
      'password_change': 'Changement mot de passe',
      'changement_mot_de_passe': 'Changement mot de passe',
      
      // Actions terrain
      'create_court': 'Création terrain',
      'update_court': 'Modification terrain',
      'delete_court': 'Suppression terrain',
      'création_terrain': 'Création terrain',
      'modification_terrain': 'Modification terrain',
      'suppression_terrain': 'Suppression terrain',
      
      // Actions inconnues
      'unknown_action': 'Action inconnue',
      'action_inconnue': 'Action inconnue',
      'action_non_spécifiée': 'Action non spécifiée'
    };
    
    // Normaliser la clé pour la recherche
    const normalizedKey = actionType?.toLowerCase().replace(/\s+/g, '_');
    return labels[normalizedKey] || labels[actionType] || actionType || 'Action inconnue';
  };

  const getActionVariant = (actionType) => {
    // Normaliser le type d'action
    const normalizedType = actionType?.toLowerCase().replace(/\s+/g, '_');
    
    switch (normalizedType) {
      // Actions positives (vert)
      case 'follow_club':
      case 'create_player':
      case 'create_user':
      case 'create_club':
      case 'create_court':
      case 'buy_credits':
      case 'registration':
      case 'login':
      case 'video_upload':
      case 'suivi_de_club':
      case 'création_utilisateur':
      case 'création_club':
      case 'création_terrain':
      case 'achat_de_crédits':
      case 'inscription':
      case 'connexion':
      case 'upload_vidéo':
        return 'default';
      
      // Actions négatives (rouge)
      case 'unfollow_club':
      case 'delete_player':
      case 'delete_user':
      case 'delete_club':
      case 'delete_court':
      case 'video_delete':
      case 'arrêt_suivi_club':
      case 'suppression_utilisateur':
      case 'suppression_club':
      case 'suppression_terrain':
      case 'suppression_vidéo':
        return 'destructive';
      
      // Actions de modification (gris)
      case 'update_player':
      case 'update_user':
      case 'update_club':
      case 'update_court':
      case 'password_change':
      case 'modification_utilisateur':
      case 'modification_club':
      case 'modification_terrain':
      case 'mise_à_jour_profil':
      case 'changement_mot_de_passe':
        return 'secondary';
      
      // Actions de crédits et paiements (outline avec couleur)
      case 'add_credits':
      case 'payment_konnect':
      case 'payment_flouci':
      case 'payment_card':
      case 'payment_simulation':
      case 'unlock_video':
      case 'ajout_de_crédits':
      case 'paiement_konnect':
      case 'paiement_flouci':
      case 'paiement_carte_bancaire':
      case 'simulation_de_paiement':
      case 'déblocage_vidéo':
        return 'outline';
      
      // Actions neutres
      case 'logout':
      case 'unknown_action':
      case 'déconnexion':
      case 'action_inconnue':
      case 'action_non_spécifiée':
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatActionDetails = (actionDetails, entry) => {
    if (!actionDetails) return null;
    
    try {
      const details = JSON.parse(actionDetails);
      
      // Utiliser action_summary si disponible (venant du backend)
      if (entry?.action_summary) {
        return entry.action_summary;
      }
      
      // Formatage spécifique selon le type d'action
      if (details.changes) {
        return `Modifications: ${Object.entries(details.changes).map(([field, change]) => 
          `${field}: "${change.old}" → "${change.new}"`).join(', ')}`;
      }
      
      // Gestion des achats de crédits
      if (details.credits_purchased || details.credits_amount) {
        const credits = details.credits_purchased || details.credits_amount;
        const price = details.price_dt || details.price_paid_dt;
        const method = details.payment_method;
        const savings = details.savings_dt;
        
        let result = `${credits} crédit(s) acheté(s)`;
        if (price) result += ` pour ${price} DT`;
        if (method) result += ` via ${method}`;
        if (savings && savings > 0) result += ` (économie: ${savings} DT)`;
        
        return result;
      }
      
      // Gestion des ajouts de crédits
      if (details.credits_added) {
        return `${details.credits_added} crédits ajoutés (${details.old_balance} → ${details.new_balance})`;
      }
      
      // Gestion des déblocages de vidéo
      if (details.video_title || details.video_id) {
        const title = details.video_title || `Vidéo #${details.video_id}`;
        const cost = details.credits_spent || details.credits_cost;
        return cost ? `${title} - ${cost} crédit(s) utilisé(s)` : title;
      }
      
      // Gestion des clubs
      if (details.club_name) {
        return `Club: ${details.club_name}`;
      }
      
      // Gestion des paiements
      if (details.payment_method) {
        const amount = details.amount || details.price_dt || details.total;
        return amount ? `${amount} DT via ${details.payment_method}` : `Paiement via ${details.payment_method}`;
      }
      
      // Gestion des informations utilisateur
      if (details.player_name || details.user_name || details.name) {
        const name = details.player_name || details.user_name || details.name;
        return `Utilisateur: ${name}`;
      }
      
      // Gestion des transactions
      if (details.transaction_id) {
        return `Transaction: ${details.transaction_id}`;
      }
      
      // Formatage générique des détails importants
      const importantKeys = ['name', 'email', 'amount', 'status', 'reason', 'description'];
      const importantDetails = importantKeys
        .filter(key => details[key])
        .map(key => `${key}: ${details[key]}`)
        .slice(0, 2)
        .join(', ');
      
      if (importantDetails) {
        return importantDetails;
      }
      
      // Fallback: afficher le JSON brut
      return JSON.stringify(details);
      
    } catch (e) {
      return actionDetails;
    }
  };

  const clearFilters = () => {
    setFilters({ clubId: 'all', actionType: 'all', search: '' });
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Historique Global des Clubs</h2>
        <p className="text-gray-600 mt-2">
          Suivi de toutes les actions effectuées sur la plateforme ({filteredHistory.length} résultats).
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Club</label>
              <Select 
                value={filters.clubId} 
                onValueChange={(value) => {
                  console.log('Club filter changed to:', value); // Debug
                  setFilters({...filters, clubId: value});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les clubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clubs</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Type d'action</label>
              <Select 
                value={filters.actionType} 
                onValueChange={(value) => {
                  console.log('Action type filter changed to:', value); // Debug
                  setFilters({...filters, actionType: value});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="follow_club">Suivi du club</SelectItem>
                  <SelectItem value="unfollow_club">Arrêt du suivi</SelectItem>
                  <SelectItem value="update_player">Modification du joueur</SelectItem>
                  <SelectItem value="add_credits">Ajout de crédits</SelectItem>
                  <SelectItem value="create_player">Création du joueur</SelectItem>
                  <SelectItem value="delete_player">Suppression du joueur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Nom du joueur, club..." 
                  value={filters.search} 
                  onChange={(e) => setFilters({...filters, search: e.target.value})} 
                  className="pl-10" 
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Effacer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun historique trouvé</h3>
            <p className="text-gray-600">Aucune action ne correspond à vos filtres.</p>
            {allHistory.length > 0 && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Voir tout l'historique
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(entry.action_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={getActionVariant(entry.action_type)}>
                        {getActionLabel(entry.action_type)}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Building className="h-3 w-3 mr-1" />
                        {entry.club_name}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{entry.player_name}</span>
                        <span className="text-gray-500">par {entry.performed_by_name}</span>
                      </div>
                      
                      {entry.action_details && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {formatActionDetails(entry.action_details)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(entry.performed_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubHistoryAdmin;
