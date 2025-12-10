import requests
r = requests.post('http://127.0.0.1:8000/session/open', json={'url':'http://212.231.225.55:88/axis-cgi/mjpg/video.cgi'}, timeout=10)
print(r.status_code)
print(r.text)
