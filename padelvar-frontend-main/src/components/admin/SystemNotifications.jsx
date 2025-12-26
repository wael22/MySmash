import { useState, useEffect } from 'react';
import { adminService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    AlertCircle,
    CheckCircle,
    Info,
    X,
    Loader2
} from 'lucide-react';

/**
 * Composant pour afficher les notifications système du super admin
 */
const SystemNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadNotifications();

        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await adminService.getNotifications();

            // Filtrer seulement les notifications système
            const systemNotifs = (response.data.notifications || []).filter(
                n => n.type === 'system'
            );

            setNotifications(systemNotifs);
            setError('');
        } catch (err) {
            console.error('Erreur chargement notifications:', err);
            setError('Erreur lors du chargement des notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await adminService.markNotificationAsRead(notificationId);
            await loadNotifications();
        } catch (err) {
            console.error('Erreur marquer comme lu:', err);
        }
    };

    const getNotificationIcon = (type) => {
        if (type.includes('Erreur') || type.includes('🚨')) {
            return <AlertCircle className="h-5 w-5 text-red-600" />;
        }
        return <Info className="h-5 w-5 text-blue-600" />;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications Système
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                            {unreadCount}
                        </Badge>
                    )}
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadNotifications}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "🔄 Actualiser"
                    )}
                </Button>
            </CardHeader>

            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">
                            Aucune notification système
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Toutes les opérations se déroulent normalement
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`
                  p-4 rounded-lg border-l-4 transition-all
                  ${notification.is_read
                                        ? 'bg-gray-50 border-gray-300'
                                        : 'bg-red-50 border-red-500 shadow-sm'
                                    }
                `}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        {getNotificationIcon(notification.title)}

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'
                                                    }`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.is_read && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Nouveau
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className={`text-sm mt-1 whitespace-pre-wrap ${notification.is_read ? 'text-gray-600' : 'text-gray-800'
                                                }`}>
                                                {notification.message}
                                            </p>

                                            <p className="text-xs text-gray-500 mt-2">
                                                {formatDate(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {!notification.is_read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => markAsRead(notification.id)}
                                            className="ml-2 hover:bg-gray-200"
                                            title="Marquer comme lu"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SystemNotifications;
