import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Coins, User, Settings, LogOut, ChevronDown } from 'lucide-react';

/**
 * UserDropdown - Menu déroulant utilisateur moderne
 * Affiche le profil, crédits et options de compte
 */
const UserDropdown = ({ user, credits, onBuyCredits, onProfile, onSettings, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fermer en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Fermer au clic sur une option
    const handleOptionClick = (callback) => {
        if (callback) callback();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bouton du profil */}
            <button
                id="profile-button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Menu utilisateur"
                aria-expanded={isOpen}
            >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="dropdown-menu-modern absolute right-0 top-full mt-2 z-10 min-w-[240px]">
                    {/* Header - Nom et rôle */}
                    <div className="px-3 py-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user?.name || 'Utilisateur'}</p>
                        <p className="text-sm text-gray-500 capitalize">{user?.role || 'Joueur'}</p>
                    </div>

                    {/* Crédits (si applicable) */}
                    {credits !== undefined && (
                        <div className="px-3 py-2 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                                <Coins className="h-4 w-4 text-yellow-500" />
                                <span className="font-semibold">{credits} crédits</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="py-1">
                        {onBuyCredits && (
                            <button
                                id="buy-credits-button"
                                onClick={() => handleOptionClick(onBuyCredits)}
                                className="dropdown-item-modern w-full"
                            >
                                <Coins className="h-4 w-4" />
                                <span>Acheter des crédits</span>
                            </button>
                        )}

                        {onProfile && (
                            <button
                                onClick={() => handleOptionClick(onProfile)}
                                className="dropdown-item-modern w-full"
                            >
                                <User className="h-4 w-4" />
                                <span>Mon Profil</span>
                            </button>
                        )}

                        {onSettings && (
                            <button
                                onClick={() => handleOptionClick(onSettings)}
                                className="dropdown-item-modern w-full"
                            >
                                <Settings className="h-4 w-4" />
                                <span>Paramètres</span>
                            </button>
                        )}
                    </div>

                    {/* Déconnexion */}
                    {onLogout && (
                        <>
                            <div className="dropdown-divider" />
                            <div className="py-1">
                                <button
                                    onClick={() => handleOptionClick(onLogout)}
                                    className="dropdown-item-modern danger w-full"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Déconnexion</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

UserDropdown.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        role: PropTypes.string,
    }),
    credits: PropTypes.number,
    onBuyCredits: PropTypes.func,
    onProfile: PropTypes.func,
    onSettings: PropTypes.func,
    onLogout: PropTypes.func.isRequired,
};

export default UserDropdown;
