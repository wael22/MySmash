import time
import psutil
pid = 11436
print('waiting for pid', pid)
try:
    p = psutil.Process(pid)
except Exception:
    print('process not found')
    p = None
start = time.time()
while p and p.is_running() and time.time() - start < 120:
    print('still running')
    time.sleep(1)
    try:
        p = psutil.Process(pid)
    except Exception:
        p = None
if p and p.is_running():
    print('still running after timeout')
else:
    print('process exited')

# list videos
import os
from pathlib import Path
videos = Path('videos')
if videos.exists():
    for f in sorted(videos.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)[:10]:
        print(f.name, f.stat().st_size, f.stat().st_mtime)
else:
    print('no videos dir')
