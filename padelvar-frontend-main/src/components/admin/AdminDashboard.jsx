import { useState, useEffect } from 'react';
import { adminService } from '../../lib/api';
import Navbar from '../common/Navbar';
import UserManagement from './UserManagement';
import ClubManagement from './ClubManagement';
import VideoManagement from './VideoManagement';
import ClubHistoryAdmin from './ClubHistoryAdmin';
import SystemConfiguration from './SystemConfiguration';
import SystemLogs from './SystemLogs';
import SupportManagement from './SupportManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Building,
  Video,
  TrendingUp,
  Loader2,
  History,
  Settings,
  FileText,
  MessageSquare
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    // CORRIGÉ : Ajout d'une nouvelle statistique pour les utilisateurs réels
    totalRealUsers: 0,
    totalClubs: 0,
    totalVideos: 0,
    totalCredits: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [usersResponse, clubsResponse, videosResponse] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllClubs(),
        adminService.getAllVideos()
      ]);

      const allUsers = usersResponse.data.users || [];
      const clubs = clubsResponse.data.clubs || [];
      const videos = videosResponse.data.videos || [];

      // CORRIGÉ : On calcule le nombre d'utilisateurs qui ne sont PAS des clubs.
      const realUsers = allUsers.filter(user => user.role !== 'club');

      // Le calcul des crédits ne change pas, car les clubs n'en ont pas.
      const totalCredits = allUsers.reduce((sum, user) => sum + (user.credits_balance || 0), 0);

      setStats({
        totalRealUsers: realUsers.length, // On utilise le nouveau compte
        totalClubs: clubs.length,
        totalVideos: videos.length,
        totalCredits
      });
    } catch (error) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Administration" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord administrateur
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les utilisateurs, clubs et vidéos de la plateforme
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* CORRIGÉ : La carte des utilisateurs affiche maintenant les bonnes données */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRealUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Joueurs et admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClubs}</div>
                <p className="text-xs text-muted-foreground">
                  Clubs enregistrés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vidéos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVideos}</div>
                <p className="text-xs text-muted-foreground">
                  Matchs enregistrés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crédits Distribués</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCredits}</div>
                <p className="text-xs text-muted-foreground">
                  Crédits en circulation
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="clubs">Clubs</TabsTrigger>
            <TabsTrigger value="videos">Vidéos</TabsTrigger>
            <TabsTrigger value="history"><span className="inline-flex items-center gap-1"><History className="h-4 w-4" />Historique</span></TabsTrigger>
            <TabsTrigger value="config"><span className="inline-flex items-center gap-1"><Settings className="h-4 w-4" />Configuration</span></TabsTrigger>
            <TabsTrigger value="logs"><span className="inline-flex items-center gap-1"><FileText className="h-4 w-4" />Logs</span></TabsTrigger>
            <TabsTrigger value="support"><span className="inline-flex items-center gap-1"><MessageSquare className="h-4 w-4" />Support</span></TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserManagement onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="clubs" className="mt-6">
            <ClubManagement onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <VideoManagement />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <ClubHistoryAdmin />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <SystemConfiguration />
          </TabsContent>
          <TabsContent value="logs" className="mt-6">
            <SystemLogs />
          </TabsContent>
          <TabsContent value="support" className="mt-6">
            <SupportManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

