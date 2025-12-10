import logging
import uuid
import time
from typing import Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import urlparse

from app.config import config
from app.proxy_manager import proxy_manager

logger = logging.getLogger(__name__)

# cv2 may be missing or incompatible (numpy/opencv build mismatch).
# Defer import errors until we actually need to access OpenCV features.
try:
    import cv2  # type: ignore
except Exception:
    cv2 = None  # type: ignore


@dataclass
class CameraSession:
    session_id: str
    source_url: str
    source_type: str
    local_rtsp_url: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    recording: bool = False
    recording_process: Optional[object] = None
    preview_active: bool = False
    verified: bool = False


class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, CameraSession] = {}
        self.max_sessions = config["max_sessions"]

    def create_session(self, source_url: str) -> CameraSession:
        if len(self.sessions) >= self.max_sessions:
            raise ValueError(f"Maximum number of sessions ({self.max_sessions}) reached")

        session_id = str(uuid.uuid4())
        source_type = self.detect_source_type(source_url)
        
        logger.info(f"Creating session {session_id} for {source_type} source: {source_url}")

        if source_type == "rtsp":
            local_rtsp_url = self.setup_rtsp_proxy(session_id, source_url)
        elif source_type == "mjpeg":
            local_rtsp_url = self.setup_mjpeg_proxy(session_id, source_url)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")

        # Try to verify the stream, but don't fail session creation if verification
        # cannot be completed (e.g. OpenCV/numpy incompatibility). We log a
        # warning and continue — preview may be unavailable until cv2 is fixed.
        try:
            verified = self.verify_stream(local_rtsp_url)
        except Exception as e:
            logger.warning(f"Stream verification skipped/failed for session {session_id}: {e}")
            verified = False

        session = CameraSession(
            session_id=session_id,
            source_url=source_url,
            source_type=source_type,
            local_rtsp_url=local_rtsp_url
        )
        session.verified = verified
        self.sessions[session_id] = session
        
        logger.info(f"Session {session_id} created successfully with local RTSP: {local_rtsp_url}")
        return session

    def detect_source_type(self, url: str) -> str:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        
        if scheme in ["rtsp", "rtsps"]:
            return "rtsp"
        elif scheme in ["http", "https"]:
            if "mjpg" in url.lower() or "mjpeg" in url.lower():
                return "mjpeg"
            return "mjpeg"
        else:
            raise ValueError(f"Cannot determine source type from URL: {url}")

    def setup_rtsp_proxy(self, session_id: str, source_url: str) -> str:
        try:
            proxy_manager.start_mediamtx()
        except Exception as e:
            logger.warning(f"MediaMTX start failed, falling back to go2rtc: {e}")
            return self.setup_mjpeg_proxy(session_id, source_url)
        
        local_url = proxy_manager.get_mediamtx_publish_url(session_id)
        
        logger.info(f"RTSP proxy configured for session {session_id}")
        logger.info(f"To publish, use: ffmpeg -re -i {source_url} -c copy -f rtsp {local_url}")
        
        return local_url

    def setup_mjpeg_proxy(self, session_id: str, source_url: str) -> str:
        proxy_manager.start_go2rtc()
        local_url = proxy_manager.add_go2rtc_stream(session_id, source_url)
        logger.info(f"MJPEG proxy configured via go2rtc for session {session_id}")
        return local_url

    def verify_stream(self, stream_url: str, max_attempts: int = 3) -> bool:
        timeout = config["stream_verification_timeout"]
        frames_to_check = config["stream_verification_frames"]
        
        # Ensure cv2 is available when we actually try to verify a stream.
        global cv2
        if cv2 is None:
            try:
                import importlib
                cv2 = importlib.import_module("cv2")
            except Exception as e:
                raise RuntimeError(
                    "OpenCV (cv2) is not available or incompatible. "
                    "Install a compatible combination of numpy and opencv-python. "
                    f"Original error: {e}"
                )

        for attempt in range(max_attempts):
            try:
                logger.info(f"Verifying stream {stream_url} (attempt {attempt + 1}/{max_attempts})")
                cap = cv2.VideoCapture(stream_url)
                
                if not cap.isOpened():
                    logger.warning(f"Failed to open stream on attempt {attempt + 1}")
                    time.sleep(2)
                    continue
                
                frames_read = 0
                start_time = time.time()
                
                while frames_read < frames_to_check:
                    if time.time() - start_time > timeout:
                        logger.warning(f"Stream verification timeout after {timeout}s")
                        break
                    
                    ret, frame = cap.read()
                    if ret:
                        frames_read += 1
                    else:
                        time.sleep(0.1)
                
                cap.release()
                
                if frames_read >= 3:
                    logger.info(f"Stream verified: read {frames_read} frames")
                    return True
                else:
                    logger.warning(f"Only read {frames_read} frames, retrying...")
                    time.sleep(2)
                    
            except Exception as e:
                logger.error(f"Stream verification error on attempt {attempt + 1}: {e}")
                time.sleep(2)
        
        raise RuntimeError(f"Failed to verify stream {stream_url} after {max_attempts} attempts")

    def get_session(self, session_id: str) -> Optional[CameraSession]:
        return self.sessions.get(session_id)

    def close_session(self, session_id: str):
        session = self.sessions.get(session_id)
        if not session:
            logger.warning(f"Session {session_id} not found")
            return

        logger.info(f"Closing session {session_id}")

        if session.recording and session.recording_process:
            try:
                from app.recording import stop_recording
                stop_recording(session_id)
            except Exception as e:
                logger.error(f"Error stopping recording for session {session_id}: {e}")

        if session.source_type == "mjpeg":
            proxy_manager.remove_go2rtc_stream(session_id)

        del self.sessions[session_id]
        logger.info(f"Session {session_id} closed")

    def get_all_sessions(self) -> Dict[str, CameraSession]:
        return self.sessions.copy()

    def cleanup(self):
        session_ids = list(self.sessions.keys())
        for session_id in session_ids:
            self.close_session(session_id)


session_manager = SessionManager()
