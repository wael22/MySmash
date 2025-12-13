import React from 'react';
import PropTypes from 'prop-types';

/**
 * NavigationBadges - Composant de navigation par badges scrollables
 * Remplace les tabs traditionnels pour un design plus moderne et mobile-friendly
 */
const NavigationBadges = ({ items, activeValue, onChange }) => {
    return (
        <div className="nav-badges-container">
            {items.map((item) => {
                const isActive = item.value === activeValue;
                const Icon = item.icon;

                return (
                    <button
                        key={item.value}
                        onClick={() => onChange(item.value)}
                        className={`nav-badge ${isActive ? 'active' : 'inactive'}`}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {Icon && <Icon className="nav-badge-icon" />}
                        <span>{item.label}</span>

                        {/* Badge compteur (notifications, etc.) */}
                        {item.badge !== undefined && item.badge > 0 && (
                            <span className="nav-badge-counter">
                                {item.badge > 99 ? '99+' : item.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

NavigationBadges.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            icon: PropTypes.elementType,
            badge: PropTypes.number,
        })
    ).isRequired,
    activeValue: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default NavigationBadges;
