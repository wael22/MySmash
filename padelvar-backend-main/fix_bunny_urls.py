"""
Script de migration pour corriger les anciennes URLs Bunny CDN
"""
import sys
import os

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.models.database import db
from src.models.user import Video
from src.main import create_app

# Anciennes et nouvelles valeurs
OLD_HOSTNAME = "vz-82bd892c-344.b-cdn.net"
NEW_HOSTNAME = "vz-f2c97d0e-5d4.b-cdn.net"

def fix_bunny_urls():
    """Corrige toutes les URLs Bunny CDN dans la base de données"""
    app = create_app()
    
    with app.app_context():
        try:
            # Trouver toutes les vidéos avec l'ancien hostname
            videos_to_fix = Video.query.filter(
                Video.file_url.like(f"%{OLD_HOSTNAME}%")
            ).all()
            
            if not videos_to_fix:
                print("✅ Aucune URL à corriger")
                return 0
            
            print(f"🔍 {len(videos_to_fix)} vidéo(s) trouvée(s) avec l'ancien hostname")
            
            # Corriger les URLs
            fixed_count = 0
            for video in videos_to_fix:
                if video.file_url:
                    old_url = video.file_url
                    video.file_url = video.file_url.replace(OLD_HOSTNAME, NEW_HOSTNAME)
                    fixed_count += 1
                    print(f"  ✅ Vidéo #{video.id}: {video.title}")
                    print(f"     Ancien: {old_url}")
                    print(f"     Nouveau: {video.file_url}")
            
            db.session.commit()
            print(f"\n🎉 {fixed_count} URL(s) corrigée(s) avec succès!")
            return fixed_count
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur: {e}")
            import traceback
            traceback.print_exc()
            return -1

if __name__ == "__main__":
    fix_bunny_urls()
