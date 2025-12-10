"""
Script pour créer des notifications de test et vérifier le système
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.main import create_app
from src.models.database import db
from src.models.notification import Notification, NotificationType
from src.models.user import User

app = create_app('development')

def create_test_notifications():
    """Créer des notifications de test pour tous les utilisateurs"""
    with app.app_context():
        # Récupérer tous les utilisateurs
        users = User.query.all()
        print(f"📊 Trouvé {len(users)} utilisateurs dans la base de données")
        
        if not users:
            print("⚠️ Aucun utilisateur trouvé!")
            return
        
        # Créer une notification pour chaque utilisateur
        created_count = 0
        for user in users:
            try:
                # Créer une notification de bienvenue
                notification = Notification.create_notification(
                    user_id=user.id,
                    notification_type=NotificationType.SYSTEM,
                    title="🎉 Bienvenue sur MySmash!",
                    message=f"Bonjour {user.name}, votre système de notifications est maintenant opérationnel!"
                )
                created_count += 1
                print(f"✅ Notification créée pour {user.name} (ID: {notification.id})")
            except Exception as e:
                print(f"❌ Erreur pour {user.name}: {str(e)}")
        
        print(f"\n✨ {created_count} notifications créées avec succès!")
        
        # Afficher le nombre de notifications par utilisateur
        print("\n📈 Statistiques:")
        for user in users:
            count = Notification.query.filter_by(user_id=user.id).count()
            print(f"  - {user.name} (ID:{user.id}): {count} notification(s)")

if __name__ == "__main__":
    print("🚀 Création de notifications de test...\n")
    create_test_notifications()
    print("\n✅ Script terminé!")
