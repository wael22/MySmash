"""
Database Migration: Add bunny_video_id column to video table

This script adds the bunny_video_id column to existing databases and
attempts to extract GUIDs from existing file_url values.
"""

import sys
import os
import re

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.main import create_app
from src.models.database import db
from src.models.user import Video

def extract_guid_from_url(file_url):
    """
    Extract Bunny Stream GUID from URL
    Expected format: https://vz-82bd892c-344.b-cdn.net/{GUID}/play.mp4
    """
    if not file_url:
        return None
    
    # Pattern to match GUID in Bunny CDN URL
    pattern = r'https?://[^/]+/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
    match = re.search(pattern, file_url, re.IGNORECASE)
    
    if match:
        return match.group(1)
    return None

def run_migration():
    """Run the migration to add bunny_video_id column"""
    
    app = create_app('development')
    
    with app.app_context():
        print("🔄 Starting migration: Add bunny_video_id to video table")
        
        try:
            # Check if column already exists
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('video')]
            
            if 'bunny_video_id' in columns:
                print("✅ Column bunny_video_id already exists")
            else:
                print("📝 Adding bunny_video_id column...")
                # Add column using raw SQL with SQLAlchemy 2.0 syntax
                with db.engine.connect() as conn:
                    conn.execute(text('ALTER TABLE video ADD COLUMN bunny_video_id VARCHAR(100)'))
                    conn.commit()
                print("✅ Column bunny_video_id added successfully")
            
            # Update existing records by extracting GUIDs from file_url
            print("\n📊 Updating existing video records...")
            videos = Video.query.all()
            updated_count = 0
            
            for video in videos:
                if not video.bunny_video_id and video.file_url:
                    guid = extract_guid_from_url(video.file_url)
                    if guid:
                        video.bunny_video_id = guid
                        updated_count += 1
                        print(f"  ✓ Video {video.id}: {guid}")
            
            if updated_count > 0:
                db.session.commit()
                print(f"\n✅ Updated {updated_count} existing videos with Bunny GUIDs")
            else:
                print("\nℹ️  No existing videos needed GUID extraction")
            
            print("\n✅ Migration completed successfully!")
            return True
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
