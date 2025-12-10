import requests
r = requests.post('http://127.0.0.1:8000/record/start', json={'session_id':'2d4efdfe-0fe8-40cc-8991-da3a1aa55603','duration_seconds':10})
print(r.status_code)
print(r.text)
