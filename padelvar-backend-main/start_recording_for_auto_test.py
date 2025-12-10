import requests
import json
import time
import os

BASE_URL = "http://localhost:5000"

def start_recording(court_id):
    print(f"Starting recording on court {court_id}...")
    
    # Login as player
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "player_test_admin_stop@test.com", 
        "password": "password123"
    })
    
    player_cookies = None
    if resp.status_code == 200:
        player_cookies = resp.cookies
    else:
        print("Login failed")
        return None

    # Start recording
    resp = requests.post(f"{BASE_URL}/api/recording/start", json={
        "court_id": court_id,
        "duration": 60
    }, cookies=player_cookies)
    
    rec_id = None
    if resp.status_code == 201:
        data = resp.json()
        rec_id = data.get('recording_session', {}).get('recording_id')
        print(f"Recording started: {rec_id}")
    elif resp.status_code == 409:
        data = resp.json()
        rec_id = data.get('existing_recording', {}).get('recording_id')
        print(f"Using existing recording: {rec_id}")
    else:
        print(f"Failed to start recording: {resp.text}")
        return None
        
    return rec_id

def main():
    court_id = 1
    rec_id = start_recording(court_id)
    
    if rec_id:
        # Create dummy file
        dummy_path = f"static/videos/{rec_id}.mp4"
        os.makedirs(os.path.dirname(dummy_path), exist_ok=True)
        with open(dummy_path, "wb") as f:
            f.write(b"dummy video content for auto stop")
        print(f"Created dummy file at {dummy_path}")
        print("Now stop the server, expire the recording in DB, and restart server.")

if __name__ == "__main__":
    main()
