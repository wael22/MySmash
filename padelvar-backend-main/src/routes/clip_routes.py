"""
Routes API pour la gestion des clips vidéo manuels
"""

from flask import Blueprint, request, jsonify, session
from src.models.database import db
from src.models.user import UserClip, Video, User
from src.services.manual_clip_service import manual_clip_service
from src.services.social_share_service import social_share_service
from functools import wraps
import logging
import threading

logger = logging.getLogger(__name__)

# Décorateur login_required basé sur la session
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Non authentifié'}), 401
        
        current_user = User.query.get(session['user_id'])
        if not current_user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated_function

clip_bp = Blueprint('clips', __name__, url_prefix='/api/clips')

@clip_bp.route('/create', methods=['POST'])
@login_required
def create_clip(current_user):
    """
    Crée un nouveau clip depuis une vidéo
    
    Body JSON:
    {
        "video_id": 123,
        "start_time": 10.5,
        "end_time": 25.3,
        "title": "Mon meilleur point",
        "description": "Description optionnelle"
    }
    """
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['video_id', 'start_time', 'end_time', 'title']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        video_id = data['video_id']
        start_time = float(data['start_time'])
        end_time = float(data['end_time'])
        title = data['title']
        description = data.get('description')
        
        # Créer le clip
        clip = manual_clip_service.create_clip(
            video_id=video_id,
            user_id=current_user.id,
            start_time=start_time,
            end_time=end_time,
            title=title,
            description=description
        )
        
        
        # Lancer le traitement en arrière-plan
        # Capturer l'instance Flask avant le thread
        from flask import current_app
        app = current_app._get_current_object()
        
        def process_async():
            try:
                with app.app_context():
                    manual_clip_service.process_clip(clip.id)
            except Exception as e:
                logger.error(f"Error processing clip {clip.id}: {e}")
                import traceback
                logger.error(traceback.format_exc())
        
        thread = threading.Thread(target=process_async)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'clip': clip.to_dict(),
            'message': 'Clip creation started'
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating clip: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@clip_bp.route('/<int:clip_id>', methods=['GET'])
@login_required
def get_clip(current_user, clip_id):
    """Récupère les détails d'un clip"""
    try:
        clip = UserClip.query.get(clip_id)
        
        if not clip:
            return jsonify({'error': 'Clip not found'}), 404
        
        # Vérifier que l'utilisateur a accès (propriétaire ou vidéo partagée)
        if clip.user_id != current_user.id:
            # TODO: vérifier si la vidéo est partagée avec l'utilisateur
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(clip.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error getting clip: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@clip_bp.route('/video/<int:video_id>', methods=['GET'])
@login_required
def get_video_clips(current_user, video_id):
    """Liste tous les clips d'une vidéo"""
    try:
        # Vérifier que l'utilisateur a accès à cette vidéo
        video = Video.query.get(video_id)
        if not video:
            return jsonify({'error': 'Video not found'}), 404
        
        if video.user_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        clips = manual_clip_service.get_user_clips(
            user_id=current_user.id,
            video_id=video_id
        )
        
        return jsonify({
            'clips': [clip.to_dict() for clip in clips]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting video clips: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@clip_bp.route('/my-clips', methods=['GET'])
@login_required
def get_my_clips(current_user):
    """Liste tous les clips de l'utilisateur"""
    try:
        clips = manual_clip_service.get_user_clips(user_id=current_user.id)
        
        return jsonify({
            'clips': [clip.to_dict() for clip in clips]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user clips: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@clip_bp.route('/<int:clip_id>', methods=['DELETE'])
@login_required
def delete_clip(current_user, clip_id):
    """Supprime un clip"""
    try:
        manual_clip_service.delete_clip(clip_id, current_user.id)
        
        return jsonify({
            'success': True,
            'message': 'Clip deleted successfully'
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error deleting clip: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@clip_bp.route('/<int:clip_id>/share', methods=['POST'])
@login_required
def get_share_links(current_user, clip_id):
    """
    Génère les liens de partage pour un clip
    
    Body JSON (optionnel):
    {
        "platform": "whatsapp"  // Pour tracker le partage sur une plateforme spécifique
    }
    """
    try:
        clip = UserClip.query.get(clip_id)
        
        if not clip:
            return jsonify({'error': 'Clip not found'}), 404
        
        # Vérifier que l'utilisateur a accès
        if clip.user_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Générer les liens
        links = social_share_service.generate_share_links(clip_id)
        
        # Tracker le partage si une plateforme est spécifiée
        data = request.get_json() or {}
        if 'platform' in data:
            social_share_service.track_share(clip_id, data['platform'])
        
        return jsonify({
            'success': True,
            'share_links': links,
            'instagram_instructions': social_share_service.generate_instagram_instructions(),
            'tiktok_instructions': social_share_service.generate_tiktok_instructions()
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error generating share links: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@clip_bp.route('/<int:clip_id>/download', methods=['POST'])
@login_required
def track_download(current_user, clip_id):
    """Enregistre un téléchargement"""
    try:
        clip = UserClip.query.get(clip_id)
        
        if not clip:
            return jsonify({'error': 'Clip not found'}), 404
        
        if clip.user_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        social_share_service.track_download(clip_id)
        
        return jsonify({
            'success': True,
            'download_url': clip.file_url
        }), 200
        
    except Exception as e:
        logger.error(f"Error tracking download: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@clip_bp.route('/<int:clip_id>/meta', methods=['GET'])
def get_clip_meta(clip_id):
    """Récupère les meta tags Open Graph pour un clip (public)"""
    try:
        meta = social_share_service.generate_open_graph_meta(clip_id)
        
        return jsonify({
            'success': True,
            'meta': meta
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error getting clip meta: {e}")
        return jsonify({'error': 'Internal server error'}), 500
