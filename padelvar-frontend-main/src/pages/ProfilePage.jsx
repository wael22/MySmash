import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // IMPORT NÉCESSAIRE
import { useAuth } from '../hooks/useAuth';
import { authService, clubService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Lock } from 'lucide-react';
import Navbar from '../components/common/Navbar';

const ProfilePage = () => {
  const { user, loading: authLoading, fetchUser, setUser } = useAuth();
  const navigate = useNavigate(); // Initialisation du hook de navigation
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'CLUB') {
        setFormData({
          name: user.club?.name || '',
          address: user.club?.address || '',
          phone_number: user.club?.phone_number || '',
        });
      } else {
        setFormData({
          name: user.name || '',
          phone_number: user.phone_number || '',
        });
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // ====================================================================
  // LOGIQUE DE CHANGEMENT DE MOT DE PASSE
  // ====================================================================
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Validation côté client
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas.');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      setPasswordLoading(false);
      return;
    }

    try {
      await authService.changePassword({
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword
      });

      setPasswordSuccess('Mot de passe changé avec succès !');
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Une erreur est survenue lors du changement de mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ====================================================================
  // LOGIQUE DE SOUMISSION CORRIGÉE
  // ====================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Étape 1: Mettre à jour le profil
      let updateResponse;
      if (user.role === 'CLUB') {
        updateResponse = await clubService.updateClubProfile(formData);
      } else {
        updateResponse = await authService.updateProfile(formData);
      }
      
      // Si la mise à jour réussit et retourne des données utilisateur mises à jour
      if (updateResponse.data && updateResponse.data.user) {
        // Mettre à jour le contexte d'authentification avec les nouvelles données
        setUser(updateResponse.data.user);
      }
      
      // Afficher le succès
      setSuccess('Profil mis à jour avec succès !');

      // Étape 2: Rafraîchir les données de l'utilisateur pour s'assurer de la synchronisation
      try {
        await fetchUser();
      } catch (fetchError) {
        console.warn("La mise à jour du profil a réussi, mais le rafraîchissement des données a échoué.", fetchError);
        // Ne pas afficher d'erreur à l'utilisateur car la mise à jour principale a réussi
      }

    } catch (err) {
      // Cette erreur ne concerne que la mise à jour du profil.
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Mon Profil</CardTitle>
            <CardDescription>Gérez vos informations personnelles et paramètres de sécurité.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations personnelles
                </TabsTrigger>
                <TabsTrigger value="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Changer le mot de passe
                </TabsTrigger>
              </TabsList>

              {/* ====================================================================== */}
              {/* ONGLET PROFIL */}
              {/* ====================================================================== */}
              <TabsContent value="profile" className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  {success && <Alert variant="default" className="bg-green-100 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom {user.role === 'CLUB' ? 'du Club' : 'Complet'}</Label>
                    <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled />
                    <p className="text-xs text-gray-500">L'email ne peut pas être modifié.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Numéro de téléphone</Label>
                    <Input id="phone_number" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} />
                  </div>
                  
                  {user.role === 'CLUB' && (
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse du Club</Label>
                      <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} />
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sauvegarder les modifications
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                      Retour
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* ====================================================================== */}
              {/* ONGLET MOT DE PASSE */}
              {/* ====================================================================== */}
              <TabsContent value="password" className="space-y-6">
                <div className="max-w-md">
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}
                    {passwordSuccess && (
                      <Alert variant="default" className="bg-green-100 text-green-800">
                        <AlertDescription>{passwordSuccess}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Mot de passe actuel</Label>
                      <Input 
                        id="oldPassword" 
                        name="oldPassword" 
                        type="password" 
                        value={passwordData.oldPassword} 
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input 
                        id="newPassword" 
                        name="newPassword" 
                        type="password" 
                        value={passwordData.newPassword} 
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500">Au moins 6 caractères</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <Input 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        type="password" 
                        value={passwordData.confirmPassword} 
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                    </div>

                    <Button type="submit" disabled={passwordLoading} className="w-full">
                      {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Changer le mot de passe
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
