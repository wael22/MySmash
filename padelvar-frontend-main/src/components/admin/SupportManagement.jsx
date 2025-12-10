import { useState, useEffect } from 'react';
import { supportService } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    MessageSquare,
    Loader2,
    Clock,
    CheckCircle,
    AlertCircle,
    X
} from 'lucide-react';

const SupportManagement = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [response, setResponse] = useState('');
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMessages();
    }, [filter]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const params = filter === 'all' ? {} : { status: filter };
            const result = await supportService.getAllMessages(params);
            setMessages(result.data.messages || []);
        } catch (err) {
            console.error('Error loading messages:', err);
            setError('Erreur lors du chargement des messages');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (messageId, newStatus) => {
        if (!response.trim()) {
            setError('Veuillez entrer une réponse');
            return;
        }

        try {
            setUpdating(true);
            setError('');

            await supportService.updateMessage(messageId, {
                admin_response: response,
                status: newStatus || 'in_progress'
            });

            setResponse('');
            setSelectedMessage(null);
            loadMessages();

        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setUpdating(false);
        }
    };

    const updateStatus = async (messageId, newStatus) => {
        try {
            await supportService.updateMessage(messageId, { status: newStatus });
            loadMessages();
        } catch (err) {
            setError('Erreur lors de la mise à jour du statut');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
            in_progress: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'En cours' },
            resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Résolu' },
            closed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, label: 'Fermé' }
        };

        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            low: 'bg-gray-100 text-gray-700',
            medium: 'bg-blue-100 text-blue-700',
            high: 'bg-red-100 text-red-700'
        };

        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${badges[priority] || badges.medium}`}>
                {priority === 'low' ? 'Basse' : priority === 'medium' ? 'Moyenne' : 'Haute'}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestion du Support</h2>
                <p className="text-gray-600 mt-1">Gérez les messages des utilisateurs</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Messages Support</CardTitle>
                            <CardDescription>{messages.length} message{messages.length > 1 ? 's' : ''}</CardDescription>
                        </div>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="in_progress">En cours</SelectItem>
                                <SelectItem value="resolved">Résolus</SelectItem>
                                <SelectItem value="closed">Fermés</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>Aucun message</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">{msg.subject}</h3>
                                                {getPriorityBadge(msg.priority)}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                De: {msg.user_name} ({msg.user_email})
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                                                    year: 'numeric', month: 'long', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(msg.status)}
                                        </div>
                                    </div>

                                    <p className="text-gray-700 mb-3 whitespace-pre-wrap bg-gray-50 p-3 rounded">{msg.message}</p>

                                    {msg.admin_response ? (
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3">
                                            <p className="text-sm font-medium text-blue-900 mb-1">Votre réponse :</p>
                                            <p className="text-sm text-blue-800 whitespace-pre-wrap">{msg.admin_response}</p>
                                        </div>
                                    ) : selectedMessage === msg.id ? (
                                        <div className="space-y-3 mt-3 bg-blue-50 p-4 rounded">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium">Répondre</h4>
                                                <button onClick={() => setSelectedMessage(null)}>
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <Textarea
                                                value={response}
                                                onChange={(e) => setResponse(e.target.value)}
                                                placeholder="Votre réponse..."
                                                rows={4}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleRespond(msg.id, 'resolved')}
                                                    disabled={updating}
                                                    size="sm"
                                                >
                                                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Répondre et résoudre'}
                                                </Button>
                                                <Button
                                                    onClick={() => handleRespond(msg.id, 'in_progress')}
                                                    disabled={updating}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Répondre (en cours)
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                onClick={() => setSelectedMessage(msg.id)}
                                                size="sm"
                                                variant="outline"
                                            >
                                                Répondre
                                            </Button>
                                            {msg.status !== 'resolved' && (
                                                <Button
                                                    onClick={() => updateStatus(msg.id, 'resolved')}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    Marquer résolu
                                                </Button>
                                            )}
                                            {msg.status !== 'closed' && (
                                                <Button
                                                    onClick={() => updateStatus(msg.id, 'closed')}
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    Fermer
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SupportManagement;
