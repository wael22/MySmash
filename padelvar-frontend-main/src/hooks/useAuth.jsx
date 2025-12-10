import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      // Éviter les appels multiples
      if (isInitialized) return;
      
      try {
        const response = await authService.getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        // Si l'utilisateur n'est pas authentifié (401), c'est normal, ne pas boucler
        if (error.response?.status === 401) {
          setUser(null);
        } else {
          // Gérer d'autres erreurs de manière appropriée
          console.error("Erreur lors de la vérification du statut d'authentification:", error);
          setUser(null);
        }
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    initializeAuth();
  }, [isInitialized]);

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(credentials);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.register(userData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur d\'inscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      return { success: true };
    } catch (error) {
      // Même si le logout échoue côté serveur, on déconnecte côté client
      setUser(null);
      return { success: true };
    }
  };

  // Fonction pour rafraîchir les données utilisateur
  const fetchUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      if (error.response?.status === 401) {
        setUser(null);
      }
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.updateProfile(profileData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur de mise à jour du profil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => !!user;
  const isAdmin = () => user?.role === 'super_admin';
  const isPlayer = () => user?.role === 'player';
  const isClub = () => user?.role === 'club';

  const value = {
    user,
    setUser,  // ← Ajouter setUser pour permettre la mise à jour manuelle
    loading,
    error,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    isAuthenticated,
    isAdmin,
    isPlayer,
    isClub,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
