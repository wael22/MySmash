import React from 'react';
import PropTypes from 'prop-types';
import { Play } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * CourtCardModern - Carte terrain modernisée
 * Affiche l'état du terrain avec indicateur visuel
 */
const CourtCardModern = ({
    court,
    onViewLive,
    onConfigure
}) => {
    const isOccupied = court.is_occupied;

    return (
        <div className="card-modern">
            {/* Header avec statut */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {court.name || `Terrain ${court.court_number}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {court.camera_name || 'Caméra non assignée'}
                    </p>
                </div>

                {/* Indicateur de statut */}
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOccupied ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className={`text-sm font-medium ${isOccupied ? 'text-red-700' : 'text-green-700'}`}>
                        {isOccupied ? 'Occupé' : 'Libre'}
                    </span>
                </div>
            </div>

            {/* Informations d'enregistrement (si occupé) */}
            {isOccupied && court.current_recording && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Joueur :</span> {court.current_recording.player_name}
                    </p>
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Durée :</span> {court.current_recording.duration || '0m'}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {isOccupied && onViewLive && (
                    <Button
                        onClick={() => onViewLive(court)}
                        className="btn-primary-modern flex-1"
                    >
                        <Play className="h-4 w-4" />
                        <span className="hidden sm:inline">Voir en direct</span>
                        <span className="sm:hidden">Live</span>
                    </Button>
                )}

                {onConfigure && (
                    <Button
                        onClick={() => onConfigure(court)}
                        variant="outline"
                        className={isOccupied ? '' : 'flex-1'}
                    >
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Configurer</span>
                    </Button>
                )}
            </div>

            {/* État vide (terrain libre) */}
            {!isOccupied && (
                <p className="text-sm text-gray-500 text-center mt-2">
                    Aucun enregistrement en cours
                </p>
            )}
        </div>
    );
};

CourtCardModern.propTypes = {
    court: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string,
        court_number: PropTypes.number,
        camera_name: PropTypes.string,
        is_occupied: PropTypes.bool,
        current_recording: PropTypes.shape({
            player_name: PropTypes.string,
            duration: PropTypes.string,
        }),
    }).isRequired,
    onViewLive: PropTypes.func,
    onConfigure: PropTypes.func,
};

export default CourtCardModern;
