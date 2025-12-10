#!/usr/bin/env python3
"""Close all sessions on the local Camera Recorder server, then open a new session.

Usage: run with the project's .venv311 Python so cv2/imports work for the server.
"""
import requests
import sys
import time

BASE = 'http://127.0.0.1:8000'
NEW_CAM = 'http://212.67.236.61/mjpg/video.mjpg'


def list_sessions():
    r = requests.get(f"{BASE}/session/list", timeout=5)
    r.raise_for_status()
    return r.json()


def close_session(session_id):
    r = requests.post(f"{BASE}/session/close", json={"session_id": session_id}, timeout=5)
    r.raise_for_status()
    return r.json()


def open_session(url):
    r = requests.post(f"{BASE}/session/open", json={"url": url}, timeout=10)
    r.raise_for_status()
    return r.json()


if __name__ == '__main__':
    try:
        s = list_sessions()
    except Exception as e:
        print(f"Failed to list sessions: {e}")
        sys.exit(2)

    sessions = s.get('sessions', [])
    if not sessions:
        print("No active sessions.")
    else:
        print(f"Found {len(sessions)} session(s):")
        for sess in sessions:
            sid = sess.get('session_id')
            print(f" - {sid} (source: {sess.get('source_url')}) -> closing...", end=' ')
            try:
                resp = close_session(sid)
                print('closed')
            except Exception as e:
                print(f'failed: {e}')

    # open new session
    print(f"Opening new session for: {NEW_CAM}")
    try:
        new = open_session(NEW_CAM)
        print('Opened session:')
        print(new)
    except Exception as e:
        print(f"Failed to open new session: {e}")
        sys.exit(3)
