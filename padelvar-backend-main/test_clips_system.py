"""
Script de test pour le système de clips
Permet de vérifier que tout fonctionne correctement
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5000"
API_URL = f"{BASE_URL}/api"

# Remplacer par vos credentials de test
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

def print_section(title):
    """Affiche un titre de section"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_authentication():
    """Test de l'authentification"""
    print_section("TEST: Authentification")
    
    response = requests.post(
        f"{API_URL}/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print(f"✅ Authentification réussie")
        print(f"   Token: {token[:50]}...")
        return token
    else:
        print(f"❌ Échec authentification: {response.status_code}")
        print(f"   {response.text}")
        return None

def test_create_clip(token, video_id=1):
    """Test de création d'un clip"""
    print_section("TEST: Création d'un clip")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    clip_data = {
        "video_id": video_id,
        "start_time": 10.5,
        "end_time": 25.8,
        "title": "Test Clip - Mon meilleur point",
        "description": "Ceci est un clip de test créé automatiquement"
    }
    
    print(f"📤 Envoi de la requête...")
    print(f"   Données: {json.dumps(clip_data, indent=2)}")
    
    response = requests.post(
        f"{API_URL}/clips/create",
        json=clip_data,
        headers=headers
    )
    
    if response.status_code == 201:
        data = response.json()
        clip = data.get('clip')
        print(f"✅ Clip créé avec succès!")
        print(f"   ID: {clip['id']}")
        print(f"   Titre: {clip['title']}")
        print(f"   Statut: {clip['status']}")
        print(f"   Durée: {clip['duration']}s")
        return clip['id']
    else:
        print(f"❌ Échec création: {response.status_code}")
        print(f"   {response.text}")
        return None

def test_get_clip_status(token, clip_id):
    """Test de récupération du statut d'un clip"""
    print_section(f"TEST: Statut du clip #{clip_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{API_URL}/clips/{clip_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        clip = response.json()
        print(f"✅ Clip récupéré")
        print(f"   ID: {clip['id']}")
        print(f"   Titre: {clip['title']}")
        print(f"   Statut: {clip['status']}")
        if clip['status'] == 'completed':
            print(f"   URL: {clip['file_url']}")
        elif clip['status'] == 'failed':
            print(f"   Erreur: {clip['error_message']}")
        return clip
    else:
        print(f"❌ Échec: {response.status_code}")
        print(f"   {response.text}")
        return None

def test_list_clips(token):
    """Test de listage des clips"""
    print_section("TEST: Liste de mes clips")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{API_URL}/clips/my-clips",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        clips = data.get('clips', [])
        print(f"✅ {len(clips)} clip(s) trouvé(s)")
        
        for clip in clips[:5]:  # Afficher max 5
            print(f"\n   Clip #{clip['id']}")
            print(f"   └─ {clip['title']}")
            print(f"   └─ Statut: {clip['status']}")
            print(f"   └─ Créé: {clip['created_at']}")
        
        return clips
    else:
        print(f"❌ Échec: {response.status_code}")
        print(f"   {response.text}")
        return []

def test_share_links(token, clip_id):
    """Test de génération des liens de partage"""
    print_section(f"TEST: Liens de partage du clip #{clip_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{API_URL}/clips/{clip_id}/share",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        links = data.get('share_links', {})
        print(f"✅ Liens générés:")
        
        for platform, url in links.items():
            print(f"\n   {platform.upper()}")
            print(f"   └─ {url[:80]}...")
        
        return links
    else:
        print(f"❌ Échec: {response.status_code}")
        print(f"   {response.text}")
        return None

def test_delete_clip(token, clip_id):
    """Test de suppression d'un clip"""
    print_section(f"TEST: Suppression du clip #{clip_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.delete(
        f"{API_URL}/clips/{clip_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        print(f"✅ Clip supprimé avec succès")
        return True
    else:
        print(f"❌ Échec: {response.status_code}")
        print(f"   {response.text}")
        return False

def wait_for_processing(token, clip_id, max_wait=300, interval=10):
    """Attendre que le clip soit traité"""
    print_section(f"ATTENTE: Traitement du clip #{clip_id}")
    print(f"   Vérification toutes les {interval}s (max {max_wait}s)")
    
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        clip = test_get_clip_status(token, clip_id)
        
        if not clip:
            return False
        
        status = clip['status']
        
        if status == 'completed':
            print(f"\n✅ Traitement terminé!")
            return True
        elif status == 'failed':
            print(f"\n❌ Le traitement a échoué")
            print(f"   Erreur: {clip.get('error_message')}")
            return False
        else:
            elapsed = int(time.time() - start_time)
            print(f"\n⏳ Statut: {status} (Temps écoulé: {elapsed}s)")
            time.sleep(interval)
    
    print(f"\n⏱️  Timeout: Le traitement prend trop de temps")
    return False

def run_all_tests():
    """Exécute tous les tests"""
    print("\n" + "🧪" * 30)
    print("  TESTS DU SYSTÈME DE CLIPS")
    print("🧪" * 30)
    
    # 1. Authentification
    token = test_authentication()
    if not token:
        print("\n❌ Impossible de continuer sans authentification")
        return
    
    # 2. Lister les clips actuels
    existing_clips = test_list_clips(token)
    
    # 3. Créer un nouveau clip
    clip_id = test_create_clip(token)
    if not clip_id:
        print("\n❌ Impossible de continuer sans clip créé")
        return
    
    # 4. Vérifier le statut immédiatement
    test_get_clip_status(token, clip_id)
    
    # 5. Attendre le traitement (optionnel, peut être long)
    print("\n" + "="*60)
    choice = input("Voulez-vous attendre le traitement du clip? (o/n): ")
    
    if choice.lower() == 'o':
        success = wait_for_processing(token, clip_id)
        
        if success:
            # 6. Générer les liens de partage
            test_share_links(token, clip_id)
    
    # 7. Lister à nouveau les clips
    test_list_clips(token)
    
    # 8. Nettoyage (optionnel)
    print("\n" + "="*60)
    choice = input(f"Voulez-vous supprimer le clip de test #{clip_id}? (o/n): ")
    
    if choice.lower() == 'o':
        test_delete_clip(token, clip_id)
    
    # Résumé
    print_section("RÉSUMÉ DES TESTS")
    print("✅ Tests terminés")
    print("\nPour voir le clip dans l'interface:")
    print(f"   1. Ouvrez {BASE_URL}")
    print("   2. Connectez-vous")
    print("   3. Allez sur 'Mes Clips'")
    print(f"   4. Le clip #{clip_id} devrait apparaître")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrompus par l'utilisateur")
    except Exception as e:
        print(f"\n\n❌ Erreur inattendue: {e}")
        import traceback
        traceback.print_exc()
