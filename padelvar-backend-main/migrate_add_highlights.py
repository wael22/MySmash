"""
Migration: Add highlights tables
Run this to add highlight_video and highlight_job tables
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.main import create_app
from src.models.database import db
from src.models.user import HighlightVideo, HighlightJob

def migrate_add_highlights_tables():
    """Add highlights tables to database"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("MIGRATION: Add Highlights Tables")
        print("=" * 60)
        
        # Create tables
        print("\n📊 Creating tables...")
        db.create_all()
        
        print("✅ Tables created successfully:")
        print("  - highlight_video")
        print("  - highlight_job")
        
        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETED!")
        print("=" * 60)

if __name__ == "__main__":
    migrate_add_highlights_tables()
