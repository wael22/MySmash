import { useState, useEffect } from 'react';
import { analyticsService } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Activity,
    Database,
    Server,
    AlertTriangle,
    Users,
    Building,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Video,
    Play,
    Eye,
    Loader2
} from 'lucide-react';

const OverviewTab = () => {
    const [systemHealth, setSystemHealth] = useState(null);
    const [platformOverview, setPlatformOverview] = useState(null);
    const [userEngagement, setUserEngagement] = useState(null);
    const [topClubs, setTopClubs] = useState([]);
    const [financialOverview, setFinancialOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAnalytics();

        // Auto-refresh system health every 30 seconds
        const interval = setInterval(() => {
            loadSystemHealth();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadSystemHealth(),
                loadPlatformOverview(),
                loadUserEngagement(),
                loadTopClubs(),
                loadFinancialOverview()
            ]);
        } catch (err) {
            setError('Erreur lors du chargement des analytics');
            console.error('Analytics error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSystemHealth = async () => {
        try {
            const response = await analyticsService.getSystemHealth();
            setSystemHealth(response.data);
        } catch (err) {
            console.error('System health error:', err);
        }
    };

    const loadPlatformOverview = async () => {
        try {
            const response = await analyticsService.getPlatformOverview();
            setPlatformOverview(response.data);
        } catch (err) {
            console.error('Platform overview error:', err);
        }
    };

    const loadUserEngagement = async () => {
        try {
            const response = await analyticsService.getUserEngagement();
            setUserEngagement(response.data);
        } catch (err) {
            console.error('User engagement error:', err);
        }
    };

    const loadTopClubs = async () => {
        try {
            const response = await analyticsService.getTopClubs(10);
            setTopClubs(response.data.clubs || []);
        } catch (err) {
            console.error('Top clubs error:', err);
        }
    };

    const loadFinancialOverview = async () => {
        try {
            const response = await analyticsService.getFinancialOverview();
            setFinancialOverview(response.data);
        } catch (err) {
            console.error('Financial overview error:', err);
        }
    };

    const getHealthColor = (value, thresholds) => {
        if (value < thresholds.good) return 'text-green-600';
        if (value < thresholds.warning) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getGrowthBadge = (percentage) => {
        if (percentage > 0) {
            return (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    +{percentage.toFixed(1)}%
                </span>
            );
        } else if (percentage < 0) {
            return (
                <span className="inline-flex items-center gap-1 text-sm text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    {percentage.toFixed(1)}%
                </span>
            );
        }
        return <span className="text-sm text-gray-500">0%</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-8">
            {/* System Health Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4">État du Système</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Temps de Réponse API</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${systemHealth ? getHealthColor(systemHealth.api_response_time_ms, { good: 100, warning: 500 }) : ''}`}>
                                {systemHealth?.api_response_time_ms?.toFixed(0) || '0'}ms
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {systemHealth?.api_response_time_ms < 100 ? 'Excellent' : systemHealth?.api_response_time_ms < 500 ? 'Bon' : 'Lent'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Performance BDD</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${systemHealth ? getHealthColor(systemHealth.db_performance_ms, { good: 50, warning: 200 }) : ''}`}>
                                {systemHealth?.db_performance_ms?.toFixed(0) || '0'}ms
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Requêtes database
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disponibilité Serveur</CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {systemHealth?.server_uptime_percentage?.toFixed(1) || '99.9'}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Uptime
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taux d'Erreurs</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${systemHealth ? getHealthColor(systemHealth.error_rate_percentage, { good: 1, warning: 5 }) : ''}`}>
                                {systemHealth?.error_rate_percentage?.toFixed(1) || '0'}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Erreurs système
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Platform Analytics Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Vue d'Ensemble de la Plateforme</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{platformOverview?.total_users || 0}</div>
                            <div className="mt-1">
                                {getGrowthBadge(platformOverview?.user_growth_percentage || 0)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clubs</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{platformOverview?.total_clubs || 0}</div>
                            <div className="mt-1">
                                {getGrowthBadge(platformOverview?.club_growth_percentage || 0)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{platformOverview?.monthly_revenue_euros?.toFixed(2) || '0.00'} DTN</div>
                            <div className="mt-1">
                                {getGrowthBadge(platformOverview?.revenue_growth_percentage || 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* User Engagement Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Engagement des Utilisateurs</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Utilisateurs Actifs (Aujourd'hui)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userEngagement?.daily_active_users || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">DAU</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sessions d'Enregistrement</CardTitle>
                            <Play className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userEngagement?.recording_sessions_today || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {userEngagement?.recording_sessions_this_week || 0} cette semaine
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Réservations Terrains</CardTitle>
                            <Video className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userEngagement?.court_bookings_today || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Aujourd'hui</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vues Vidéos</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userEngagement?.total_video_views || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Top Performing Clubs */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Top 10 Clubs Performants</h2>
                <Card>
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium">Club</th>
                                        <th className="text-right py-3 px-4 font-medium">Vidéos</th>
                                        <th className="text-right py-3 px-4 font-medium">Revenus</th>
                                        <th className="text-right py-3 px-4 font-medium">Utilisateurs Actifs</th>
                                        <th className="text-right py-3 px-4 font-medium">Score d'Engagement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topClubs.length > 0 ? (
                                        topClubs.map((club, index) => (
                                            <tr key={club.club_id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-500 w-6">#{index + 1}</span>
                                                        <span>{club.club_name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-right py-3 px-4">{club.total_videos}</td>
                                                <td className="text-right py-3 px-4 font-medium text-green-600">
                                                    {club.total_revenue_euros.toFixed(2)} DTN
                                                </td>
                                                <td className="text-right py-3 px-4">{club.active_users}</td>
                                                <td className="text-right py-3 px-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {club.engagement_score.toFixed(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-500">
                                                Aucun club trouvé
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Overview */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Vue Financière</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenus (Ce Mois)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {financialOverview?.total_revenue_euros?.toFixed(2) || '0.00'} DTN
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {financialOverview?.month || 'Ce mois'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Commission Gagnée</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {financialOverview?.commission_earned_euros?.toFixed(2) || '0.00'} DTN
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {financialOverview?.commission_rate_percentage || 20}% de commission
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {financialOverview?.active_subscriptions || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Utilisateurs avec crédits
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Paiements en Attente</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {financialOverview?.pending_payouts_euros?.toFixed(2) || '0.00'} DTN
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                À traiter
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
