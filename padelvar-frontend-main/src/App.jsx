import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import PlayerDashboard from './components/player/PlayerDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import ClubDashboard from './components/club/ClubDashboard';
import ProfilePage from './pages/ProfilePage';
import GoogleAuthCallback from './components/GoogleAuthCallback';
// Importation dynamique des pages pour éviter les erreurs de chargement
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/ErrorFallback';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// Chargement paresseux des composants qui causent des erreurs
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/google-auth-callback" element={<GoogleAuthCallback />} />
            <Route path="/forgot-password" element={
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={<LoadingSpinner />}>
                  <ForgotPassword />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/reset-password" element={
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={<LoadingSpinner />}>
                  <ResetPassword />
                </Suspense>
              </ErrorBoundary>
            } />
            
            {/* Routes protégées */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="player">
                  <PlayerDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/club" 
              element={
                <ProtectedRoute requiredRole="club">
                  <ClubDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Page profil protégée */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Redirection par défaut */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            {/* Route 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

