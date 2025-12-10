import requests
url = 'http://212.231.225.55:88/axis-cgi/mjpg/video.cgi'
print('Requesting', url)
try:
    r = requests.get(url, stream=True, timeout=10)
    print('status', r.status_code)
    print('content-type', r.headers.get('Content-Type'))
    # read a small chunk
    chunk = r.raw.read(2048)
    print('read bytes', len(chunk))
    print(chunk[:200])
    r.close()
except Exception as e:
    print('error', e)
