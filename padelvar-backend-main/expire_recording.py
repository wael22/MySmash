from src.main import create_app
from src.models.database import db
from src.models.user import RecordingSession
from datetime import datetime, timedelta

app = create_app('development')

with app.app_context():
    # Find the active recording
    session = RecordingSession.query.filter_by(status='active').first()
    if session:
        print(f"Found active session: {session.recording_id}")
        # Set start time to 2 hours ago
        session.start_time = datetime.utcnow() - timedelta(hours=2)
        db.session.commit()
        print("Session expired successfully.")
    else:
        print("No active session found.")
