import { useState, useEffect } from 'react';
import { adminService } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Building,
  MapPin,
  Phone,
  Mail,
  Loader2,
  QrCode,
  Eye,
  Edit,
  Trash2,
  Camera,
  MoreVertical,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import CourtControlPanel from './CourtControlPanel';

const ClubManagement = ({ onStatsUpdate, onDataChange }) => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [showCourtsModal, setShowCourtsModal] = useState(false);
  const [showEditCourtModal, setShowEditCourtModal] = useState(false);
  const [showControlModal, setShowControlModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [clubCourts, setClubCourts] = useState([]);
  const [clubFormData, setClubFormData] = useState({
    name: '',
    address: '',
    phone_number: '',
    email: '',
    password: '' // Added password field
  });
  const [courtFormData, setCourtFormData] = useState({
    name: "",
    camera_url: 'http://212.231.225.55:88/axis-cgi/mjpg/video.cgi'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllClubs();
      setClubs(response.data.clubs);
    } catch (error) {
      setError('Erreur lors du chargement des clubs');
      console.error('Error loading clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClubCourts = async (clubId) => {
    try {
      const response = await adminService.getClubCourts(clubId);
      console.log('Courts data received:', response.data);
      console.log('Courts array:', response.data.courts);

      // Validate courts data before setting state
      const validCourts = (response.data.courts || []).filter(court =>
        court && typeof court === 'object' && court.id
      );

      if (validCourts.length !== (response.data.courts || []).length) {
        console.warn('Some courts have invalid data:', response.data.courts);
      }

      setClubCourts(validCourts);
    } catch (error) {
      setError('Erreur lors du chargement des terrains');
      console.error('Error loading courts:', error);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await adminService.createClub(clubFormData);
      setShowCreateModal(false);
      resetClubForm();
      loadClubs();
      onStatsUpdate();
      // Notifier les autres composants du changement
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      setError('Erreur lors de la création du club');
      console.error('Error creating club:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await adminService.updateClub(selectedClub.id, clubFormData);
      setShowEditModal(false);
      resetClubForm();
      loadClubs();
      onStatsUpdate();
      // Notifier les autres composants du changement
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour du club');
      console.error('Error updating club:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce club ? Tous les terrains et joueurs associés seront également supprimés.')) {
      return;
    }

    try {
      await adminService.deleteClub(clubId);
      loadClubs();
      onStatsUpdate();
      // Notifier les autres composants du changement
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      setError('Erreur lors de la suppression du club');
      console.error('Error deleting club:', error);
    }
  };

  const handleCreateCourt = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await adminService.createCourt(selectedClub.id, courtFormData);
      setShowCourtModal(false);
      resetCourtForm();
      loadClubs();
      if (showCourtsModal) {
        loadClubCourts(selectedClub.id);
      }
    } catch (error) {
      setError('Erreur lors de la création du terrain');
      console.error('Error creating court:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCourt = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if selectedCourt exists and has an id
    if (!selectedCourt || !selectedCourt.id) {
      setError('Erreur: Terrain non sélectionné ou ID manquant');
      setIsSubmitting(false);
      return;
    }

    try {
      await adminService.updateCourt(selectedCourt.id, courtFormData);
      setShowEditCourtModal(false);
      resetCourtForm();
      loadClubCourts(selectedClub.id);
    } catch (error) {
      setError('Erreur lors de la mise à jour du terrain');
      console.error('Error updating court:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourt = async (courtId) => {
    // Check if courtId is valid
    if (!courtId) {
      setError('Erreur: ID du terrain manquant');
      console.error('Court ID is null or undefined');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce terrain ?')) {
      return;
    }

    try {
      await adminService.deleteCourt(courtId);
      loadClubCourts(selectedClub.id);
    } catch (error) {
      setError('Erreur lors de la suppression du terrain');
      console.error('Error deleting court:', error);
    }
  };

  const resetClubForm = () => {
    setClubFormData({
      name: '',
      address: '',
      phone_number: '',
      email: '',
      password: '' // Reset password field
    });
    setSelectedClub(null);
  };

  const resetCourtForm = () => {
    setCourtFormData({
      name: "",
      camera_url: 'http://212.231.225.55:88/axis-cgi/mjpg/video.cgi'
    });
    setSelectedClub(null);
    setSelectedCourt(null);
  };

  const openEditModal = (club) => {
    setSelectedClub(club);
    setClubFormData({
      name: club.name,
      address: club.address || '',
      phone_number: club.phone_number || '',
      email: club.email || '',
      password: '' // Do not pre-fill password for security
    });
    setShowEditModal(true);
  };

  const openCourtModal = (club) => {
    setSelectedClub(club);
    setShowCourtModal(true);
  };

  const openCourtsModal = async (club) => {
    setSelectedClub(club);
    await loadClubCourts(club.id);
    setShowCourtsModal(true);
  };

  const openEditCourtModal = (court) => {
    // Validate court object before proceeding
    if (!court || !court.id) {
      setError('Erreur: Données du terrain invalides');
      console.error('Invalid court object:', court);
      return;
    }

    setSelectedCourt(court);
    setCourtFormData({
      name: court.name || '',
      camera_url: court.camera_url || ''
    });
    setShowEditCourtModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Clubs</CardTitle>
              <CardDescription>
                Créez et gérez les clubs de padel
              </CardDescription>
            </div>

            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Club
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un Club</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau club de padel à la plateforme
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateClub} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="club-name">Nom du club</Label>
                    <Input
                      id="club-name"
                      value={clubFormData.name}
                      onChange={(e) => setClubFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Club de Padel Paris"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="club-address">Adresse</Label>
                    <Input
                      id="club-address"
                      value={clubFormData.address}
                      onChange={(e) => setClubFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Rue de la Paix, 75001 Paris"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="club-phone">Téléphone</Label>
                    <Input
                      id="club-phone"
                      value={clubFormData.phone_number}
                      onChange={(e) => setClubFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="club-email">Email</Label>
                    <Input
                      id="club-email"
                      type="email"
                      value={clubFormData.email}
                      onChange={(e) => setClubFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@clubpadel.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="club-password">Mot de passe</Label>
                    <Input
                      id="club-password"
                      type="password"
                      value={clubFormData.password}
                      onChange={(e) => setClubFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mot de passe du club"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Créer le Club
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun club enregistré
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par créer votre premier club
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un Club
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-blue-500" />
                        <span>{club.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {club.address ? (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{club.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {club.phone_number && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{club.phone_number}</span>
                          </div>
                        )}
                        {club.email && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{club.email}</span>
                          </div>
                        )}
                        {!club.phone_number && !club.email && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(club.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(club)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openCourtsModal(club)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir Terrains
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedClub(club); setShowControlModal(true); }}>
                            <Settings className="mr-2 h-4 w-4" />
                            Contrôler Terrains
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openCourtModal(club)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter Terrain
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const credits = prompt(`Combien de crédits offrir à ${club.name} ?\n\nSolde actuel : ${club.credits_balance || 0} crédits`, "100");
                            if (credits && parseInt(credits) > 0) {
                              adminService.addCreditsToClub(club.id, parseInt(credits))
                                .then(() => {
                                  alert(`✅ ${credits} crédits offerts à ${club.name} !`);
                                  loadClubs();
                                })
                                .catch((err) => alert(`Erreur : ${err.response?.data?.error || "Impossible d'ajouter des crédits"}`));
                            }
                          }}>
                            <Plus className="mr-2 h-4 w-4 text-blue-600" />
                            <span className="text-blue-600">Ajouter des Crédits</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClub(club.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal d'édition de club */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Club</DialogTitle>
            <DialogDescription>
              Modifiez les informations du club
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateClub} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du club</Label>
              <Input
                id="edit-name"
                value={clubFormData.name}
                onChange={(e) => setClubFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Adresse</Label>
              <Input
                id="edit-address"
                value={clubFormData.address}
                onChange={(e) => setClubFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={clubFormData.phone_number}
                onChange={(e) => setClubFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={clubFormData.email}
                onChange={(e) => setClubFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Sauvegarder
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de création de terrain */}
      <Dialog open={showCourtModal} onOpenChange={setShowCourtModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Terrain</DialogTitle>
            <DialogDescription>
              Créez un nouveau terrain pour {selectedClub?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCourt} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="court-name">Nom du terrain</Label>
              <Input
                id="court-name"
                value={courtFormData.name}
                onChange={(e) => setCourtFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Terrain 1, Court Central..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="camera-url">URL de la caméra</Label>
              <Input
                id="camera-url"
                value={courtFormData.camera_url}
                onChange={(e) => setCourtFormData(prev => ({ ...prev, camera_url: e.target.value }))}
                placeholder="http://212.231.225.55:88/axis-cgi/mjpg/video.cgi"
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">QR Code automatique</span>
              </div>
              <p className="text-sm text-blue-700">
                Un QR code unique sera automatiquement généré pour ce terrain.
                Les joueurs pourront le scanner pour démarrer un enregistrement.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCourtModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Créer le Terrain
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal d'affichage des terrains */}
      <Dialog open={showCourtsModal} onOpenChange={setShowCourtsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Terrains de {selectedClub?.name}</DialogTitle>
            <DialogDescription>
              Gérez les terrains et leurs caméras associées
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {clubCourts.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun terrain enregistré
                </h3>
                <p className="text-gray-600 mb-4">
                  Commencez par créer votre premier terrain
                </p>
                <Button onClick={() => openCourtModal(selectedClub)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Terrain
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clubCourts.map((court) => (
                  <Card key={court?.id || Math.random()} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{court?.name || 'Terrain sans nom'}</CardTitle>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditCourtModal(court)}
                            disabled={!court?.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCourt(court?.id)}
                            disabled={!court?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Camera className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Caméra:</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <img
                            src={court.camera_url}
                            alt={`Caméra ${court.name}`}
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div className="hidden text-center py-8 text-gray-500">
                            <Camera className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Aperçu caméra non disponible</p>
                            <p className="text-xs text-gray-400 mt-1">{court.camera_url}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <QrCode className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">QR Code: {court.qr_code}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de modification de terrain */}
      <Dialog open={showEditCourtModal} onOpenChange={setShowEditCourtModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Terrain</DialogTitle>
            <DialogDescription>
              Modifiez les informations du terrain {selectedCourt?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCourt} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-court-name">Nom du terrain</Label>
              <Input
                id="edit-court-name"
                value={courtFormData.name}
                onChange={(e) => setCourtFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Terrain 1, Court Central..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-camera-url">URL de la caméra</Label>
              <Input
                id="edit-camera-url"
                value={courtFormData.camera_url}
                onChange={(e) => setCourtFormData(prev => ({ ...prev, camera_url: e.target.value }))}
                placeholder="http://212.231.225.55:88/axis-cgi/mjpg/video.cgi"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditCourtModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Mettre à jour
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de contrôle des terrains */}
      <Dialog open={showControlModal} onOpenChange={setShowControlModal}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Contrôle des Terrains - {selectedClub?.name}</DialogTitle>
            <DialogDescription>
              Gérez la disponibilité des terrains et arrêtez les enregistrements en cours
            </DialogDescription>
          </DialogHeader>

          {selectedClub && (
            <CourtControlPanel
              clubId={selectedClub.id}
              clubName={selectedClub.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubManagement;
