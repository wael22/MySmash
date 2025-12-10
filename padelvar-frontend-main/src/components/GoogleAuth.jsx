import React, { useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';

const GoogleAuth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Gestionnaire pour le clic sur le bouton Google
  const handleGoogleSignIn = async () => {
    try {
      // Demander l'URL d'authentification au backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/auth/google-auth-url`);
      // Rediriger vers l'URL d'authentification Google
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL d\'authentification Google', error);
    }
  };

  // Fonction pour gérer le callback de Google
  const handleGoogleCallback = async (token) => {
    try {
      // Échanger le token avec le backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/auth/google/authenticate`, { token });
      
      // Authentifier l'utilisateur dans l'application
      if (response.data.user) {
        login(response.data.user);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification Google', error);
    }
  };

  // Vérifier si nous sommes sur la page de callback Google
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname === '/google-auth-callback') {
      const token = url.searchParams.get('token');
      if (token) {
        handleGoogleCallback(token);
      }
    }
  }, []);

  return (
    <div className="mt-4">
      <Button 
        onClick={handleGoogleSignIn} 
        className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
        Connexion avec Google
      </Button>
    </div>
  );
};

export default GoogleAuth;
