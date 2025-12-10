import { useState, useEffect } from 'react';
import { supportService } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    MessageSquare,
    Send,
    Loader2,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

const ContactSupport = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        priority: 'medium'
    });

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await supportService.getMyMessages();
            setMessages(response.data.messages || []);
        } catch (err) {
            console.error('Error loading messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject || !formData.message) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        try {
            setSending(true);
            setError('');
            setSuccess('');

            await supportService.createMessage(formData);

            setSuccess('Message envoyé au support avec succès !');
            setFormData({ subject: '', message: '', priority: 'medium' });

            // Reload messages
            setTimeout(() => {
                loadMessages();
                setSuccess('');
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de l\'envoi du message');
        } finally {
            setSending(false);
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Contacter le Support</h2>
                <p className="text-gray-600 mt-1">Envoyez un message à notre équipe support</p>
            </div>

            {/* Formulaire */}
            <Card>
                <CardHeader>
                    <CardTitle>Nouveau message</CardTitle>
                    <CardDescription>Décrivez votre problème ou votre question</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert>
                                <AlertDescription className="text-green-600">{success}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="subject">Sujet *</Label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Résumez votre problème en quelques mots"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Basse</SelectItem>
                                    <SelectItem value="medium">Moyenne</SelectItem>
                                    <SelectItem value="high">Haute</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                                id="message"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Décrivez votre problème en détail..."
                                rows={6}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={sending}>
                            {sending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Envoi...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Envoyer
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Liste des messages envoyés */}
            <Card>
                <CardHeader>
                    <CardTitle>Mes messages</CardTitle>
                    <CardDescription>Historique de vos demandes au support</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>Aucun message envoyé</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{msg.subject}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {getStatusBadge(msg.status)}
                                    </div>

                                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{msg.message}</p>

                                    {msg.admin_response && (
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-3">
                                            <p className="text-sm font-medium text-blue-900 mb-1">Réponse du support :</p>
                                            <p className="text-sm text-blue-800 whitespace-pre-wrap">{msg.admin_response}</p>
                                            {msg.admin_name && (
                                                <p className="text-xs text-blue-600 mt-2">- {msg.admin_name}</p>
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

export default ContactSupport;
