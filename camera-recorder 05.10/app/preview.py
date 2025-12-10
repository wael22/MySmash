import logging
import base64
import asyncio
import json
import time
from fastapi import WebSocket
from typing import Optional

from app.config import config
from app.session_manager import session_manager

logger = logging.getLogger(__name__)

# Defer cv2 import to runtime so the app can start even if OpenCV/numpy are
# not installed or are incompatible. We attempt to import when starting a
# preview and raise a helpful error if it's unavailable.
try:
    import cv2  # type: ignore
except Exception:
    cv2 = None  # type: ignore


class PreviewStreamer:
    def __init__(self, session_id: str, websocket: WebSocket):
        self.session_id = session_id
        self.websocket = websocket
        self.running = False
        self.cap: Optional[cv2.VideoCapture] = None
        self.jpeg_quality = config["preview_jpeg_quality"]

    async def start(self):
        session = session_manager.get_session(self.session_id)
        if not session:
            logger.error(f"Session {self.session_id} not found")
            await self.websocket.send_json({"error": "Session not found"})
            return

        logger.info(f"Starting preview for session {self.session_id}")
        
        # Ensure cv2 is available now
        global cv2
        if cv2 is None:
            try:
                import importlib
                cv2 = importlib.import_module("cv2")
            except Exception as e:
                logger.error(f"OpenCV is required for preview but not available: {e}")
                await self.websocket.send_json({"error": "OpenCV (cv2) not available"})
                return

        try:
            self.cap = cv2.VideoCapture(session.local_rtsp_url)
            
            if not self.cap.isOpened():
                logger.error(f"Failed to open stream {session.local_rtsp_url}")
                await self.websocket.send_json({"error": "Failed to open stream"})
                return

            self.running = True
            session.preview_active = True
            
            await self.stream_loop()
            
        except Exception as e:
            logger.error(f"Preview error for session {self.session_id}: {e}")
            await self.websocket.send_json({"error": str(e)})
        finally:
            self.cleanup()

    async def stream_loop(self):
        frame_count = 0
        error_count = 0
        max_consecutive_errors = 10
        
        while self.running:
            try:
                ret, frame = self.cap.read()
                
                if not ret:
                    error_count += 1
                    if error_count >= max_consecutive_errors:
                        logger.error(f"Too many consecutive read errors ({error_count}), stopping preview")
                        break
                    await asyncio.sleep(0.05)
                    continue
                
                error_count = 0
                frame_count += 1
                
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), self.jpeg_quality]
                _, buffer = cv2.imencode('.jpg', frame, encode_param)
                jpeg_base64 = base64.b64encode(buffer).decode('utf-8')
                
                message = {
                    "type": "frame",
                    "data": jpeg_base64,
                    "timestamp": time.time(),
                    "frame_number": frame_count
                }
                
                try:
                    await self.websocket.send_json(message)
                except Exception as send_error:
                    logger.warning(f"WebSocket send error: {send_error}")
                    break
                
                await asyncio.sleep(0.001)
                
            except Exception as e:
                logger.error(f"Frame processing error: {e}")
                error_count += 1
                if error_count >= max_consecutive_errors:
                    break
                await asyncio.sleep(0.1)

        logger.info(f"Preview loop ended for session {self.session_id}, {frame_count} frames sent")

    def stop(self):
        logger.info(f"Stopping preview for session {self.session_id}")
        self.running = False

    def cleanup(self):
        if self.cap:
            self.cap.release()
            logger.info(f"Released video capture for session {self.session_id}")
        
        session = session_manager.get_session(self.session_id)
        if session:
            session.preview_active = False


async def handle_preview_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected for session {session_id}")
    
    streamer = PreviewStreamer(session_id, websocket)
    
    try:
        await streamer.start()
    except Exception as e:
        logger.error(f"WebSocket handler error: {e}")
    finally:
        streamer.cleanup()
        logger.info(f"WebSocket closed for session {session_id}")
