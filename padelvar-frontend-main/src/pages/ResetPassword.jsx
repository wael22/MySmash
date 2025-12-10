import React, { useState, useEffect  } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [isTokenVerifying, setIsTokenVerifying] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer le token de l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
    } else {
      setIsTokenVerifying(false);
      setMessage('Token manquant. Veuillez utiliser le lien complet envoyé par email.');
      setMessageType('error');
    }
  }, [location]);

  // Vérifier la validité du token
  const verifyToken = async (tokenToVerify) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/auth/verify-reset-token`, { token: tokenToVerify });
      
      if (response.data.success) {
        setIsTokenVerified(true);
        setEmail(response.data.email);
      } else {
        setMessage('Ce lien de réinitialisation est invalide ou a expiré.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      setMessage('Ce lien de réinitialisation est invalide ou a expiré.');
      setMessageType('error');
    } finally {
      setIsTokenVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation basique
    if (password.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères');
      setMessageType('error');
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      setMessageType('error');
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, { 
        token,
        password
      });
      
      if (response.data.success) {
        setMessage('Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
        setMessageType('success');
        
        // Rediriger vers la page de connexion après quelques secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(response.data.message || 'Une erreur est survenue.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      setMessage('Une erreur est survenue lors de la réinitialisation du mot de passe.');
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
            {messageType === 'success' ? 'Succès' : 
             messageType === 'error' ? 'Erreur' : 'Information'}
          </AlertTitle>
        </div>
        <AlertDescription className="mt-2">{message}</AlertDescription>
      </Alert>
    );
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Affichage pendant la vérification du token
  if (isTokenVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Réinitialisation du mot de passe</CardTitle>
            <CardDescription className="text-center">
              Vérification du lien de réinitialisation...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Réinitialisation du mot de passe</CardTitle>
          {isTokenVerified && (
            <CardDescription className="text-center">
              Créez un nouveau mot de passe pour votre compte<br/>
              <span className="font-medium">{email}</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <MessageAlert />
          
          {isTokenVerified ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          ) : (
            <div className="text-center p-4">
              <Link to="/forgot-password">
                <Button variant="outline">Demander un nouveau lien</Button>
              </Link>
            </div>
          )}
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

export default ResetPassword;
