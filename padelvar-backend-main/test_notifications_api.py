"""
Script pour tester directement l'API notifications et afficher la réponse
"""
import requests
import json

# URL de l'API
API_URL = "http://localhost:5000/api/notifications"

print("🧪 Test de l'API Notifications\n")
print(f"📡 Calling: GET {API_URL}\n")

try:
    response = requests.get(API_URL, timeout=10)
    print(f"📊 Status Code: {response.status_code}")
    print(f"📋 Response Headers: {dict(response.headers)}\n")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Response JSON:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        notifications = data.get('notifications', [])
        print(f"\n📈 Summary:")
        print(f"   - Total notifications: {len(notifications)}")
        print(f"   - Unread: {data.get('stats', {}).get('unread_count', 'N/A')}")
        
        if notifications:
            print(f"\n📝 First 3 notifications:")
            for i, notif in enumerate(notifications[:3], 1):
                print(f"   {i}. {notif.get('title')} - {notif.get('message')[:50]}...")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Connection Error: Cannot connect to API. Is the backend running?")
except Exception as e:
    print(f"❌ Error: {str(e)}")
