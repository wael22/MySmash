import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Play, Share2, Download, Edit2, Trash2, MoreVertical, Share, Scissors } from 'lucide-react';

/**
 * VideoCardModern - Carte vidéo moderne avec image pleine largeur
 * Affichage optimisé pour mobile avec menu contextuel
 */
const VideoCardModern = ({
    video,
    onPlay,
    onShare,
    onDownload,
    onEdit,
    onDelete,
    onCreateClip,  // 🆕 Nouveau handler
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Fermer le menu en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    // Formater la durée
    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    // Formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Date non disponible';

        const date = new Date(dateString);

        // Si la date est invalide, retourner un fallback
        if (isNaN(date.getTime())) {
            return 'Date non disponible';
        }

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="card-modern-compact overflow-visible animate-fade-in">
            {/* Image avec overlays */}
            <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
                {video.thumbnail_url ? (
                    <img
                        src={video.thumbnail_url}
                        alt={video.title || 'Vidéo'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
                        <Play className="h-16 w-16 text-white opacity-50" />
                    </div>
                )}

                {/* Badge "Partagée" */}
                {video.is_shared && (
                    <div className="image-overlay-badge">
                        <Share className="h-4 w-4" />
                        Partagée
                    </div>
                )}

                {/* Durée */}
                {video.duration && (
                    <div className="image-overlay-duration">
                        {formatDuration(video.duration)}
                    </div>
                )}
            </div>

            {/* Contenu */}
            <div className="px-2">
                {/* Titre et menu */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
                        {video.title || 'Sans titre'}
                    </h3>

                    {/* Bouton menu 3 points */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Options"
                        >
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>

                        {/* Dropdown menu */}
                        {menuOpen && (
                            <div className="dropdown-menu-modern absolute right-0 top-full mt-1 z-50">
                                <button
                                    onClick={() => {
                                        onPlay(video);
                                        setMenuOpen(false);
                                    }}
                                    className="dropdown-item-modern w-full"
                                >
                                    <Play className="h-4 w-4" />
                                    <span>Regarder</span>
                                </button>

                                {!video.is_shared && onShare && (
                                    <button
                                        onClick={() => {
                                            onShare(video);
                                            setMenuOpen(false);
                                        }}
                                        className="dropdown-item-modern w-full"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        <span>Partager</span>
                                    </button>
                                )}

                                {onDownload && (
                                    <button
                                        onClick={() => {
                                            onDownload(video);
                                            setMenuOpen(false);
                                        }}
                                        className="dropdown-item-modern w-full"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span>Télécharger</span>
                                    </button>
                                )}

                                {/* 🆕 AJOUTER OPTION CRÉER UN CLIP */}
                                {!video.is_shared && onCreateClip && (
                                    <button
                                        onClick={() => {
                                            onCreateClip(video);
                                            setMenuOpen(false);
                                        }}
                                        className="dropdown-item-modern w-full"
                                    >
                                        <Scissors className="h-4 w-4" />
                                        <span>Créer un Clip</span>
                                    </button>
                                )}

                                {onEdit && (
                                    <button
                                        onClick={() => {
                                            onEdit(video);
                                            setMenuOpen(false);
                                        }}
                                        className="dropdown-item-modern w-full"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        <span>Modifier le titre</span>
                                    </button>
                                )}

                                {onDelete && (
                                    <>
                                        <div className="dropdown-divider" />
                                        <button
                                            onClick={() => {
                                                onDelete(video);
                                                setMenuOpen(false);
                                            }}
                                            className="dropdown-item-modern danger w-full"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span>Supprimer</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Date */}
                <p className="text-sm text-gray-500 mb-2">
                    {formatDate(video.created_at || video.recorded_at)}
                </p>

                {/* Informations terrain/club */}
                {(video.court_name || video.club_name) && (
                    <p className="text-sm text-gray-600 mb-3">
                        {video.court_name && <span>{video.court_name}</span>}
                        {video.court_name && video.club_name && <span className="mx-1">•</span>}
                        {video.club_name && <span>{video.club_name}</span>}
                    </p>
                )}

                {/* Boutons d'action principaux */}
                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={() => onPlay(video)}
                        className="btn-primary-modern flex-1"
                    >
                        <Play className="h-4 w-4" />
                        <span>Regarder</span>
                    </button>

                    {!video.is_shared && onShare && (
                        <button
                            onClick={() => onShare(video)}
                            className="btn-secondary-modern flex-1"
                        >
                            <Share2 className="h-4 w-4" />
                            <span>Partager</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

VideoCardModern.propTypes = {
    video: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string,
        thumbnail_url: PropTypes.string,
        duration: PropTypes.number,
        created_at: PropTypes.string.isRequired,
        is_shared: PropTypes.bool,
        court_name: PropTypes.string,
        club_name: PropTypes.string,
    }).isRequired,
    onPlay: PropTypes.func.isRequired,
    onShare: PropTypes.func,
    onDownload: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onCreateClip: PropTypes.func,  // 🆕 Nouveau prop
};

export default VideoCardModern;
