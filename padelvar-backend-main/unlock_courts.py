"""
Script pour débloquer les terrains bloqués
"""
import sys
import os

# Ajouter le chemin du projet
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.models.database import db
from src.models.user import Court, RecordingSession
from src.main import create_app

app = create_app('development')

with app.app_context():
    # Récupérer tous les terrains
    courts = Court.query.all()
    
    print("=== ÉTAT DES TERRAINS ===")
    for court in courts:
        print(f"\nTerrain {court.id}: {court.name}")
        print(f"  is_recording: {court.is_recording}")
        
        # Vérifier s'il y a une session active
        active_session = RecordingSession.query.filter_by(
            court_id=court.id,
            status='active'
        ).first()
        
        if active_session:
            print(f"  ✅ Session active trouvée: {active_session.recording_id}")
        else:
            print(f"  ❌ PAS de session active")
            
            if court.is_recording:
                print(f"  🔧 CORRECTION: Débloquage du terrain...")
                court.is_recording = False
    
    # Sauvegarder les changements
    db.session.commit()
    print("\n✅ Tous les terrains ont été vérifiés et corrigés!")
