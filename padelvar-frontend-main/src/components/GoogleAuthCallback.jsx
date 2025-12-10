import React, { useEffect, useState  } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const GoogleAuthCallback = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        console.log("Traitement du callback Google...");
        // Récupérer le token de l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const errorCode = urlParams.get('error');
        
        if (errorCode) {
          console.error(`Erreur reçue de Google: ${errorCode}`);
          setError(`Erreur d'authentification Google: ${errorCode}`);
          setDebugInfo(`Erreur: ${errorCode}. Vérifiez que vos identifiants OAuth sont correctement configurés.`);
          setIsLoading(false);
          return;
        }
        
        if (!token) {
          console.error("Token manquant dans l'URL");
          setError('Token manquant dans l\'URL');
          setDebugInfo("Aucun token n'a été retourné par Google. Vérifiez la configuration OAuth dans Google Cloud Console.");
          setIsLoading(false);
          return;
        }
        
        // Authentifier avec le backend
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        console.log(`Authentification avec le backend: ${API_URL}/api/auth/google/authenticate`);
        
        try {
          const response = await axios.post(
            `${API_URL}/api/auth/google/authenticate`, 
            { token },
            { withCredentials: true }
          );
          
          if (response.data.user) {
            console.log("Utilisateur authentifié avec succès:", response.data.user);
            // Authentifier l'utilisateur dans l'application
            login(response.data.user);
            
            // Rediriger vers le tableau de bord approprié
            const role = response.data.user.role;
            let redirectPath = '/dashboard';
            
            switch (role) {
              case 'super_admin':
                redirectPath = '/admin';
                break;
              case 'club':
                redirectPath = '/club';
                break;
              case 'player':
              default:
                redirectPath = '/dashboard';
                break;
            }
            
            console.log(`Redirection vers: ${redirectPath}`);
            navigate(redirectPath);
          } else {
            console.error("Aucune information utilisateur reçue");
            setError('Aucune information utilisateur reçue');
            setDebugInfo("Le backend a répondu, mais aucune information utilisateur n'a été renvoyée.");
            setIsLoading(false);
          }
        } catch (apiError) {
          console.error('Erreur d\'API:', apiError);
          const errorMessage = apiError.response?.data?.message || apiError.message;
          setError(`Erreur lors de l'authentification: ${errorMessage}`);
          setDebugInfo(`Détails: ${JSON.stringify(apiError.response?.data || {})}`);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Erreur d\'authentification Google:', err);
        setError('Erreur lors de l\'authentification avec Google');
        setDebugInfo(`Message d'erreur: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    handleGoogleCallback();
  }, [login, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center p-6">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Authentification en cours...</p>
              <p className="text-sm text-gray-500 mt-2">Connexion avec votre compte Google</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              <p className="text-lg font-medium">Erreur d'authentification</p>
              <p className="text-sm mt-2">{error}</p>
              {debugInfo && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left text-gray-700 overflow-auto max-h-48">
                  <p className="font-medium mb-1">Informations de débogage:</p>
                  <pre>{debugInfo}</pre>
                </div>
              )}
              <button 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => navigate('/login')}
              >
                Retour à la connexion
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
