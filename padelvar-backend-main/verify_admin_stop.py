import requests
import json
import time
import os

BASE_URL = "http://localhost:5000"
ADMIN_EMAIL = "admin@mysmash.com"
ADMIN_PASSWORD = "password123"

def login():
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return None
    return resp.cookies

def get_courts(cookies):
    resp = requests.get(f"{BASE_URL}/api/admin/clubs/1/courts", cookies=cookies) # Assuming club 1 exists
    if resp.status_code == 200:
        return resp.json().get('courts', [])
    return []

def start_recording(cookies, court_id):
    print(f"Starting recording on court {court_id}...")
    
    # Login as player
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "player@test.com", 
        "password": "password123"
    })
    
    player_cookies = None
    if resp.status_code == 200:
        player_cookies = resp.cookies
    else:
        # Register player
        print("Registering new player...")
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "player_test_admin_stop@test.com",
            "password": "password123",
            "name": "Test Player Admin Stop",
            "role": "player"
        })
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "player_test_admin_stop@test.com",
            "password": "password123"
        })
        player_cookies = resp.cookies

    # Start recording
    resp = requests.post(f"{BASE_URL}/api/recording/start", json={
        "court_id": court_id,
        "duration": 60
    }, cookies=player_cookies)
    
    if resp.status_code == 201:
        data = resp.json()
        print(f"Start response: {json.dumps(data, indent=2)}")
        rec_id = data.get('recording_session', {}).get('recording_id')
        print(f"Recording started: {rec_id}")
        return rec_id
    elif resp.status_code == 409:
        data = resp.json()
        print("Recording already active.")
        rec_id = data.get('existing_recording', {}).get('recording_id')
        print(f"Using existing recording: {rec_id}")
        return rec_id
    else:
        print(f"Failed to start recording: {resp.text}")
        return None

def stop_recording_admin(cookies, recording_id):
    print(f"Stopping recording {recording_id} as admin...")
    resp = requests.post(f"{BASE_URL}/api/admin/recordings/{recording_id}/stop", cookies=cookies)
    print(f"Stop response: {resp.status_code}")
    print(f"Body: {resp.text}")

def main():
    cookies = login()
    if not cookies:
        return

    courts = get_courts(cookies)
    if not courts:
        print("No courts found.")
        return

    court_id = courts[0]['id']
    print(f"Using court {court_id}")

    rec_id = start_recording(cookies, court_id)
    if rec_id:
        print("Waiting 2 seconds...")
        time.sleep(2)
        
        # Create dummy file
        dummy_path = f"static/videos/{rec_id}.mp4"
        os.makedirs(os.path.dirname(dummy_path), exist_ok=True)
        with open(dummy_path, "wb") as f:
            f.write(b"dummy video content")
        print(f"Created dummy file at {dummy_path}")
        
        stop_recording_admin(cookies, rec_id)

if __name__ == "__main__":
    main()
