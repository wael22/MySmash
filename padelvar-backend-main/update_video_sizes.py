# Script pour mettre à jour les file_size manquants
import os
from app import app
from src.models.database import db
from src.models.user import Video

def update_file_sizes():
    """Met à jour les file_size manquants pour toutes les vidéos"""
    with app.app_context():
        videos = Video.query.filter((Video.file_size == None) | (Video.file_size == 0)).all()
        
        print(f"Found {len(videos)} videos without file_size")
        updated = 0
        
        for video in videos:
            if video.file_url and os.path.exists(video.file_url):
                try:
                    file_size = os.path.getsize(video.file_url)
                    video.file_size = file_size
                    updated += 1
                    print(f"Updated video {video.id}: {file_size} bytes")
                except Exception as e:
                    print(f"Error for video {video.id}: {e}")
        
        db.session.commit()
        print(f"\nUpdated {updated} videos out of {len(videos)}")

if __name__ == "__main__":
    update_file_sizes()
