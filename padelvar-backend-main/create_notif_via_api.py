"""
Script pour créer des notifications via l'API /test plutôt que directement en DB
Cela garantit que les notifications sont créées dans la même instance que le serveur en cours d'exécution
"""
import requests
import json

API_BASE = "http://localhost:5000/api"

# On doit d'abord se connecter pour obtenir une session
def login():
    """Se connecter pour obtenir un cookie de session"""
    login_data = {
        "email": "jouer2@test.com",  # Essayons différents emails
        "password": "test123"
    }
    
    # Essayer plusieurs combinaisons possibles
    users_to_try = [
        {"email": "jouer2@test.com", "password": "test123"},
        {"email": "test2@test.com", "password": "test123"},
        {"email": "player@test.com", "password": "test123"},
    ]
    
    session = requests.Session()
    
    for user_data in users_to_try:
        print(f"🔐 Tentative de connexion avec {user_data['email']}...")
        try:
            response = session.post(f"{API_BASE}/auth/login", json=user_data, timeout=5)
            if response.status_code == 200:
                print(f"✅ Connecté avec succès comme {user_data['email']}")
                return session
            else:
                print(f"   ❌ Échec: {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Erreur: {str(e)}")
    
    print("\n⚠️ Impossible de se connecter. Créons une notification de test sans authentification...")
    return None

def create_test_notification_via_api(session):
    """Créer une notification de test via l'API /notifications/test"""
    notification_data = {
        "title": "🎉 Test Notification via API",
        "message": "Cette notification a été créée via l'API pendant que le serveur tournait!",
        "type": "system"
    }
    
    print(f"\n📤 Envoi de notification de test...")
    
    try:
        headers = {'Content-Type': 'application/json'}
        if session:
            response = session.post(f"{API_BASE}/notifications/test", json=notification_data, timeout=5)
        else:
            response = requests.post(f"{API_BASE}/notifications/test", json=notification_data, headers=headers, timeout=5)
        
        print(f"📊 Status Code: {response.status_code}")
        if response.status_code in [200, 201]:
            print(f"✅ Notification créée!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Erreur: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")

if __name__ == "__main__":
    print("🚀 Création de notifications via l'API...\n")
    session = login()
    create_test_notification_via_api(session)
    
    # Vérifier les notifications
    if session:
        print(f"\n📋 Vérification des notifications...")
        try:
            response = session.get(f"{API_BASE}/notifications", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {len(data.get('notifications', []))} notification(s) trouvée(s)")
                for notif in data.get('notifications', []):
                    print(f"   - {notif.get('title')}")
        except Exception as e:
            print(f"❌ Erreur: {str(e)}")
