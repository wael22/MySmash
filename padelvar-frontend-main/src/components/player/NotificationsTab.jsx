import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, Coins, MessageSquare, Video, Info, Loader2 } from 'lucide-react';

const NotificationsTab = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await notificationService.getMyNotifications();
            setNotifications(response.data.notifications || []);
        } catch (err) {
            setError('Erreur lors du chargement des notifications');
            console.error('Error loading notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            await loadNotifications();
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            await loadNotifications();
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'support':
                return <MessageSquare className="h-5 w-5 text-blue-500" />;
            case 'credit':
                return <Coins className="h-5 w-5 text-green-500" />;
            case 'video':
                return <Video className="h-5 w-5 text-purple-500" />;
            case 'info':
            case 'system':
                return <Info className="h-5 w-5 text-gray-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-400" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // différence en secondes

        if (diff < 60) return 'À l\'instant';
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
        if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Notifications</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Aucune notification non lue'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Tout marquer comme lu
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">Aucune notification</h3>
                        <p className="text-gray-500 mt-2">Vous recevrez ici vos notifications importantes</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`transition-all hover:shadow-md cursor-pointer ${!notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                                }`}
                            onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(notification.created_at)}
                                                </span>
                                                {!notification.is_read && (
                                                    <Badge variant="default" className="bg-blue-500">Nouveau</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                        {notification.link && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 h-auto mt-2 text-blue-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = notification.link;
                                                }}
                                            >
                                                Voir plus →
                                            </Button>
                                        )}
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

export default NotificationsTab;
