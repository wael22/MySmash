import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../player/NotificationBell';
import UserDropdown from './UserDropdown';
import BuyCreditsModal from '../player/BuyCreditsModal';
import { Coins } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleBuyCredits = () => {
    setIsBuyCreditsModalOpen(true);
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">MySmash</h1>
            </div>
            {title && (
              <div className="ml-6 hidden sm:block">
                <h2 className="text-lg font-medium text-gray-900">{title}</h2>
              </div>
            )}
          </div>

          {/* Menu utilisateur */}
          <div className="flex items-center space-x-4">
            {/* Notifications pour les joueurs */}
            {user?.role === 'player' && <NotificationBell />}

            {/* Affichage des crédits pour les joueurs */}
            {user?.role === 'player' && (
              <div id="credits-balance" className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
                <Coins className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {user.credits_balance} crédits
                </span>
              </div>
            )}

            {/* Dropdown utilisateur moderne */}
            <UserDropdown
              user={user}
              credits={user?.role === 'player' ? user?.credits_balance : undefined}
              onBuyCredits={user?.role === 'player' ? handleBuyCredits : undefined}
              onProfile={handleProfile}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* Modal d'achat de crédits */}
      {user?.role === 'player' && (
        <BuyCreditsModal
          isOpen={isBuyCreditsModalOpen}
          onClose={() => setIsBuyCreditsModalOpen(false)}
          onCreditsUpdated={() => window.location.reload()}
        />
      )}
    </nav>
  );
};

export default Navbar;
