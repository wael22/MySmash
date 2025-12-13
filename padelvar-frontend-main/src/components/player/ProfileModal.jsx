import { useState, useEffect } from 'react';
import { authService } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Loader2,
  Check,
  Edit
} from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone_number: '',
    profile_photo_url: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Initialiser les données du profil quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        profile_photo_url: user.profile_photo_url || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.updateProfile(profileData);

      setSuccess('Profil mis à jour avec succès !');

      // Notifier le parent de la mise à jour
      if (onUserUpdated) {
        onUserUpdated(response.data.user);
      }

    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la mise à jour du profil');
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.updateProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setSuccess('Mot de passe mis à jour avec succès !');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la mise à jour du mot de passe');
      console.error('Error updating password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setActiveTab('profile');
    onClose();
  };

  const handlePhotoUpload = () => {
    // Simulation de l'upload de photo
    const simulatedUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`;
    setProfileData(prev => ({ ...prev, profile_photo_url: simulatedUrl }));
    alert('Photo de profil mise à jour (simulation)');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold">
            <User className="h-5 w-5" />
            <span>Mon Profil</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Gérez vos informations personnelles et paramètres de sécurité.
          </DialogDescription>
        </DialogHeader>

        {/* Navigation personnalisée au lieu de Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${activeTab === 'profile'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <User className="h-4 w-4" />
            <span className="hidden md:inline text-sm font-medium">Profil</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${activeTab === 'security'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <Lock className="h-4 w-4" />
            <span className="hidden md:inline text-sm font-medium">Sécurité</span>
          </button>
        </div>

        <div className="space-y-4">

          {error && (
            <Alert variant="destructive" className="mt-4 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 mt-4 rounded-xl">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Onglet Profil */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Photo de profil */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profileData.profile_photo_url ? (
                      <img
                        src={profileData.profile_photo_url}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={handlePhotoUpload}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Informations personnelles */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-900">Nom Complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Votre nom"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-900">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={profileData.email}
                      disabled
                      className="pl-10 rounded-lg bg-gray-50"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">L'email ne peut pas être modifié.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-900">Numéro de téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={profileData.phone_number}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="pl-10 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      <span>Sauvegarder les modifications</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Onglet Sécurité */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium text-gray-900">Mot de passe actuel</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Mot de passe actuel"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                      className="pl-10 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-gray-900">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Nouveau mot de passe"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      className="pl-10 rounded-lg"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500">Au moins 6 caractères</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-900">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirmer le mot de passe"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="pl-10 rounded-lg"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Conseils de sécurité:</strong>
                </p>
                <ul className="text-sm text-blue-600 mt-1 space-y-1">
                  <li>• Utilisez au moins 6 caractères</li>
                  <li>• Mélangez lettres, chiffres et symboles</li>
                  <li>• Évitez les mots de passe trop simples</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Changer le mot de passe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

