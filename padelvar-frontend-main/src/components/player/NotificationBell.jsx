import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // ✅ Add navigation
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationService } from '@/lib/api';

const NotificationBell = () => {
    const navigate = useNavigate();  // ✅ Add hook
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadNotifications();
        // Polling toutes les 30 secondes pour les nouvelles notifications
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await notificationService.getMyNotifications();
            console.log('[NotificationBell] API Response:', response.data);
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.stats?.unread_count || 0);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            await loadNotifications(); // Reload to update count
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
        // ✅ Validation du lien avant navigation
        if (notification.link) {
            try {
                const validPaths = ['/dashboard', '/my-clips', '/profile'];
                if (validPaths.some(path => notification.link.startsWith(path))) {
                    navigate(notification.link);
                } else {
                    console.warn('Invalid notification link:', notification.link);
                }
            } catch (error) {
                console.error('Navigation error:', error);
            }
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'SUPPORT':
                return '💬';
            case 'VIDEO':
                return '🎥';
            case 'CREDIT':
                return '💰';
            case 'SYSTEM':
                return '⚙️';
            default:
                return '📢';
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // en secondes

        if (diff < 60) return 'À l\'instant';
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative p-2 hover:bg-gray-100 rounded-full">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <DropdownMenuLabel className="font-semibold">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        Aucune notification
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`cursor-pointer p-3 ${!notification.is_read ? 'bg-blue-50' : ''
                                }`}
                        >
                            <div className="flex gap-3 w-full">
                                <div className="text-2xl flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium text-sm">{notification.title}</p>
                                        {!notification.is_read && (
                                            <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatTime(notification.created_at)}
                                    </p>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;
