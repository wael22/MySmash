"""
Cleanup script to remove duplicate Video 31 from database
"""

from src.main import create_app
from src.models.database import db
from src.models.user import Video

app = create_app()

with app.app_context():
    # Remove Video 31 (duplicate)
    video_31 = Video.query.get(31)
    if video_31:
        print(f"Removing duplicate Video 31: {video_31.title}")
        db.session.delete(video_31)
        db.session.commit()
        print("✅ Duplicate removed")
    else:
        print("Video 31 not found")
    
    # Verify Video 30 has bunny_video_id
    video_30 = Video.query.get(30)
    if video_30:
        print(f"\nVideo 30 status:")
        print(f"  bunny_video_id: {video_30.bunny_video_id}")
        print(f"  file_url: {video_30.file_url}")
