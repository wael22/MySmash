import requests
import time
import json
import sys

SID = '2d4efdfe-0fe8-40cc-8991-da3a1aa55603'
BASE = 'http://127.0.0.1:8000'

print('Starting 30s recording for session', SID)
try:
    r = requests.post(f'{BASE}/record/start', json={'session_id': SID, 'duration_seconds': 30}, timeout=10)
except Exception as e:
    print('ERROR starting recording:', e)
    sys.exit(2)

print('Start response:', r.status_code)
print(r.text)
if r.status_code != 200:
    sys.exit(1)

# Poll status until not recording
while True:
    try:
        s = requests.get(f'{BASE}/record/status/{SID}', timeout=5).json()
    except Exception as e:
        print('ERROR polling status:', e)
        time.sleep(1)
        continue
    print('Status:', s)
    if not s.get('recording', False):
        print('Recording finished')
        break
    time.sleep(1)

# List videos
try:
    v = requests.get(f'{BASE}/videos', timeout=5).json()
    print('\nVideos list (top 10):')
    print(json.dumps(v.get('videos', [])[:10], indent=2))
except Exception as e:
    print('ERROR listing videos:', e)

print('Done')
