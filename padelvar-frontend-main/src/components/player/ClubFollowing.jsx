import { useState, useEffect } from 'react';
import { playerService } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Heart, MapPin, Phone, Mail, Calendar } from 'lucide-react';

const ClubFollowing = ({ onFollowChange }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // MODIFIÉ : Un seul état pour tous les clubs
  const [allClubs, setAllClubs] = useState([]);
  // MODIFIÉ : Un état pour savoir quels clubs sont suivis
  const [followedIds, setFollowedIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followError, setFollowError] = useState('');

  useEffect(() => {
    // Seulement charger les clubs si l'utilisateur est authentifié et l'authentification est finie
    if (!authLoading && isAuthenticated()) {
      loadClubs();
    } else if (!authLoading && !isAuthenticated()) {
      setLoading(false);
      setError('Vous devez être connecté pour voir les clubs.');
    }
  }, [authLoading, isAuthenticated]);

  // MODIFIÉ : Fonction de chargement simplifiée
  const loadClubs = async () => {
    try {
      setLoading(true);
      setFollowError('');
      // On récupère les deux listes en parallèle
      const [availableRes, followedRes] = await Promise.all([
        playerService.getAvailableClubs(),
        playerService.getFollowedClubs(),
      ]);

      const followed = followedRes.data.clubs || [];
      const available = availableRes.data.clubs || [];

      // On crée un Set (ensemble) des IDs des clubs suivis pour une recherche rapide
      const newFollowedIds = new Set(followed.map(c => c.id));
      setFollowedIds(newFollowedIds);

      // On fusionne les deux listes sans doublons et on les stocke
      const combinedClubs = [...followed, ...available.filter(c => !newFollowedIds.has(c.id))];
      setAllClubs(combinedClubs);

    } catch (err) {
      setError('Erreur lors du chargement des clubs.');
      console.error('Error loading clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (clubId, isCurrentlyFollowing) => {
    try {
      setFollowError('');
      if (isCurrentlyFollowing) {
        await playerService.unfollowClub(clubId);
      } else {
        await playerService.followClub(clubId);
      }
      
      // On recharge les données pour mettre à jour l'état
      await loadClubs();
      
      if (onFollowChange) {
        onFollowChange();
      }

    } catch (err) {
      console.error('Error toggling follow:', err);
      setFollowError('Une erreur est survenue.');
      // On recharge même en cas d'erreur pour resynchroniser l'interface
      await loadClubs();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Le composant ClubCard reste presque identique
  const ClubCard = ({ club }) => {
    // On vérifie si le club est suivi en regardant dans notre Set d'IDs
    const isFollowing = followedIds.has(club.id);

    return (
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex justify-between items-start">
            <span>{club.name}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isFollowing 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {isFollowing ? 'Suivi' : 'Non suivi'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm text-gray-600">
          {club.address && <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> {club.address}</div>}
          {club.phone_number && <div className="flex items-center"><Phone className="h-4 w-4 mr-2" /> {club.phone_number}</div>}
          {club.email && <div className="flex items-center"><Mail className="h-4 w-4 mr-2" /> {club.email}</div>}
          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Créé le {formatDate(club.created_at)}</div>
        </CardContent>
        <div className="p-4 pt-0">
          {isFollowing ? (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleFollowToggle(club.id, true)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Ne plus suivre
            </Button>
          ) : (
            <Button 
              className="w-full" 
              variant="default"
              onClick={() => handleFollowToggle(club.id, false)}
            >
              <Heart className="h-4 w-4 mr-2 fill-current" />
              Suivre
            </Button>
          )}
        </div>
      </Card>
    );
  };

  // Vérifier d'abord l'état de l'authentification
  if (authLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Vérification de l'authentification...</span></div>;
  }

  // Si non authentifié, afficher un message
  if (!isAuthenticated()) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Vous devez être connecté pour voir les clubs. 
          <a href="/login" className="underline ml-1">Se connecter</a>
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  }

  // MODIFIÉ : Affichage simplifié sans les onglets
  return (
    <div>
      {followError && <Alert variant="destructive" className="mb-4"><AlertDescription>{followError}</AlertDescription></Alert>}
      
      <h3 className="text-lg font-semibold mb-4">Tous les Clubs</h3>
      
      {allClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allClubs.map(club => <ClubCard key={club.id} club={club} />)}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">Aucun club n'est disponible sur la plateforme.</p>
      )}
    </div>
  );
};

export default ClubFollowing;
