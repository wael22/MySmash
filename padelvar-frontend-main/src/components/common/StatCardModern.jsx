import React from 'react';
import PropTypes from 'prop-types';

/**
 * StatCardModern - Carte de statistique moderne avec icône dans cercle
 * Utilisé pour afficher les métriques clés dans les dashboards
 */
const StatCardModern = ({
    icon: Icon,
    title,
    value,
    subtitle,
    iconBgColor = 'var(--color-primary-light)',
    iconColor = 'var(--color-primary)'
}) => {
    return (
        <div className="card-modern">
            <div className="flex items-start justify-between gap-4">
                {/* Contenu textuel */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {value}
                    </p>
                    <p className="text-sm text-gray-500">
                        {subtitle}
                    </p>
                </div>

                {/* Icône dans cercle */}
                <div
                    className="icon-circle flex-shrink-0"
                    style={{
                        backgroundColor: iconBgColor,
                        color: iconColor
                    }}
                >
                    {Icon && <Icon className="h-6 w-6" />}
                </div>
            </div>
        </div>
    );
};

StatCardModern.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string.isRequired,
    iconBgColor: PropTypes.string,
    iconColor: PropTypes.string,
};

export default StatCardModern;
