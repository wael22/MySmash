import os
from datetime import datetime
from flask import jsonify
from src.models.user import RecordingSession, Court, Video
from src.extensions import db, logger

def admin_stop_recording_FIXED(recording_id, require_super_admin_func, session_obj):
    """Arrêter un enregistrement en cours (admin uniquement) - VERSION CORRIGÉE"""
    if not require_super_admin_func():
        return jsonify({"error": "Accès non autorisé"}), 403
    
    try:
        # Récupérer la session d'enregistrement
        active_recording = RecordingSession.query.filter_by(
            recording_id=recording_id,
            status='active'
        ).first()
        
        if not active_recording:
            return jsonify({"error": "Session d'enregistrement non trouvée ou déjà terminée"}), 404
        
        # Récupérer le terrain
        court = Court.query.get(active_recording.court_id)
        if not court:
            return jsonify({"error": "Terrain non trouvé"}), 404
        
        # Marquer la session comme terminée
        active_recording.status = 'stopped'
        active_recording.end_time = datetime.utcnow()
        active_recording.stopped_by = 'admin'
        
        # Libérer le terrain
        court.is_recording = False
        court.recording_session_id = None
        court.current_recording_id = None
        logger.info(f"🔓 Terrain {court.name} libéré (enregistrement admin)")
        
        # Calculer la durée
        start_time = active_recording.start_time
        end_time = active_recording.end_time
        
        if start_time and end_time:
            duration_delta = end_time - start_time
            duration_seconds = duration_delta.total_seconds()
            duration_minutes = max(1, int(duration_seconds / 60))
        else:
            duration_minutes = 1
        
        # 🆕 Arrêter FFmpeg et fermer le proxy
        from src.video_system.session_manager import session_manager
        from src.video_system.recording import video_recorder
        
        video_file_path = None
        try:
            # Arrêter FFmpeg
            video_file_path = video_recorder.stop_recording(recording_id)
            logger.info(f"✅ FFmpeg arrêté: {video_file_path}")
            
            # Fermer session proxy
            session_mgr_obj = session_manager.get_session(recording_id)
            if session_mgr_obj:
                session_mgr_obj.recording_active = False
            session_manager.close_session(recording_id)
            logger.info(f"✅ Proxy fermé pour {recording_id}")
            
        except Exception as e:
            logger.warning(f"⚠️ Erreur arrêt service vidéo: {e}")
        
        # Chercher le fichier vidéo
        video_file_url = None
        if video_file_path:
            video_file_url = f"videos/{court.club_id}/{recording_id}.mp4"
        
        possible_paths = [
            f"static/videos/{court.club_id}/{recording_id}.mp4",
            f"static/videos/{recording_id}.mp4"
        ]
        
        actual_file_path = None
        for path in possible_paths:
            if os.path.exists(path):
                actual_file_path = path
                video_file_url = path
                logger.info(f"📹 Fichier vidéo trouvé: {path}")
                break
        
        # Créer la vidéo dans la BD
        video_title = active_recording.title or f"Enregistrement {court.name}"
        
        new_video = Video(
            title=video_title,
            description=active_recording.description or f"Enregistrement arrêté par admin",
            duration=duration_minutes,
            user_id=active_recording.user_id,
            court_id=court.id,
            recorded_at=start_time,
            file_url=video_file_url,
            is_unlocked=True,
            credits_cost=0
        )
        
        # Vérifier durée réelle du fichier
        if actual_file_path:
            from src.services.ffmpeg_runner import ffmpeg_runner
            try:
                real_duration_sec = ffmpeg_runner.get_video_duration(actual_file_path)
                if real_duration_sec:
                    logger.info(f"🎥 Durée fichier réelle: {real_duration_sec}s")
                    new_video.duration = max(1, int(real_duration_sec / 60))
            except Exception as e:
                logger.warning(f"⚠️ Impossible de lire durée: {e}")
        
        db.session.add(new_video)
        
        # Upload vers Bunny CDN
        if actual_file_path:
            from src.services.bunny_storage_service import bunny_storage_service
            try:
                upload_id = bunny_storage_service.upload_video_async(
                    local_file_path=actual_file_path,
                    video_id=new_video.id,
                    video_title=video_title
                )
                logger.info(f"📤 Upload Bunny programmé: {upload_id}")
            except Exception as e:
                logger.warning(f"⚠️ Erreur upload Bunny: {e}")
        
        db.session.commit()
        
        logger.info(f"✅ Enregistrement {recording_id} arrêté par admin - Vidéo ID: {new_video.id}")
        
        return jsonify({
            "message": "Enregistrement arrêté avec succès",
            "recording_id": recording_id,
            "video_id": new_video.id,
            "duration_minutes": new_video.duration
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Erreur arrêt admin: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur lors de l'arrêt: {str(e)}"}), 500
