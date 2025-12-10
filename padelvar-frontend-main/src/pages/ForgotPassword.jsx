import React, { useState  } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage('Veuillez entrer une adresse email valide');
      setMessageType('error');
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      
      if (response.data.success) {
        setMessage('Si votre email est enregistré, vous recevrez un lien de réinitialisation.');
        setMessageType('success');
        // Garder le formulaire visible au cas où l'utilisateur souhaite réessayer
      } else {
        setMessage(response.data.message || 'Une erreur est survenue.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      setMessage('Une erreur est survenue lors de la demande de réinitialisation.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const MessageAlert = () => {
    if (!message) return null;
    
    const icons = {
      info: <Info className="h-5 w-5" />,
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      error: <AlertTriangle className="h-5 w-5 text-red-500" />
    };
    
    const colors = {
      info: 'bg-blue-50 text-blue-800',
      success: 'bg-green-50 text-green-800',
      error: 'bg-red-50 text-red-800'
    };
    
    return (
      <Alert className={`mb-4 ${colors[messageType]}`}>
        <div className="flex items-center gap-2">
          {icons[messageType]}
          <AlertTitle className="font-medium">
            {messageType === 'success' ? 'Email envoyé' : 
             messageType === 'error' ? 'Erreur' : 'Information'}
          </AlertTitle>
        </div>
        <AlertDescription className="mt-2">{message}</AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Mot de passe oublié</CardTitle>
          <CardDescription className="text-center">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MessageAlert />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
            Retour à la connexion
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
