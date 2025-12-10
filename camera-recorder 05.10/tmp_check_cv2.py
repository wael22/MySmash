import cv2
import time
url = 'http://212.231.225.55:88/axis-cgi/mjpg/video.cgi'
cap = cv2.VideoCapture(url)
print('opened', cap.isOpened())
if cap.isOpened():
    for i in range(5):
        ret, frame = cap.read()
        print('read', i, ret, None if frame is None else getattr(frame, 'shape', None))
        time.sleep(0.1)
    cap.release()
else:
    print('could not open')
