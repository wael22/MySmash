import logging
import sys
from pathlib import Path
from typing import List
from datetime import datetime

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from app.config import config
from app.proxy_manager import proxy_manager
from app.session_manager import session_manager
from app.preview import handle_preview_websocket
from app.recording import start_recording, stop_recording, get_recording_status, cleanup_all_recordings
from subprocess import Popen
import shutil

logging.basicConfig(
    level=getattr(logging, config.get("log_level", "INFO").upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI(title="Camera Recorder", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

videos_dir = Path(config["videos_dir"])
videos_dir.mkdir(parents=True, exist_ok=True)

static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


class OpenSessionRequest(BaseModel):
    url: str


class CloseSessionRequest(BaseModel):
    session_id: str


class StartRecordingRequest(BaseModel):
    session_id: str
    duration_seconds: int


class StopRecordingRequest(BaseModel):
    session_id: str


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Camera Recorder application")
    try:
        proxy_manager.ensure_binaries()
        logger.info("Proxy binaries ready")
    except Exception as e:
        logger.error(f"Failed to ensure proxy binaries: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Camera Recorder application")
    try:
        cleanup_all_recordings()
        session_manager.cleanup()
        proxy_manager.cleanup()
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


@app.get("/")
async def root():
    return FileResponse(str(static_dir / "index.html"))


@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/session/open")
async def open_session(request: OpenSessionRequest):
    try:
        session = session_manager.create_session(request.url)
        return {
            "session_id": session.session_id,
            "source_url": session.source_url,
            "local_rtsp_url": session.local_rtsp_url,
            "verified": session.verified,
            "source_type": session.source_type,
            "created_at": session.created_at.isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to open session: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/session/close")
async def close_session(request: CloseSessionRequest):
    try:
        session_manager.close_session(request.session_id)
        return {"status": "closed", "session_id": request.session_id}
    except Exception as e:
        logger.error(f"Failed to close session: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/session/list")
async def list_sessions():
    sessions = session_manager.get_all_sessions()
    return {
        "sessions": [
            {
                "session_id": s.session_id,
                "source_url": s.source_url,
                "source_type": s.source_type,
                "local_rtsp_url": s.local_rtsp_url,
                "recording": s.recording,
                "preview_active": s.preview_active,
                "created_at": s.created_at.isoformat()
            }
            for s in sessions.values()
        ],
        "count": len(sessions),
        "max_sessions": session_manager.max_sessions
    }


@app.websocket("/stream")
async def websocket_stream(websocket: WebSocket, session_id: str):
    await handle_preview_websocket(websocket, session_id)


@app.post("/record/start")
async def record_start(request: StartRecordingRequest):
    try:
        output_path = start_recording(request.session_id, request.duration_seconds)
        return {
            "status": "recording",
            "session_id": request.session_id,
            "duration_seconds": request.duration_seconds,
            "output_path": output_path
        }
    except Exception as e:
        logger.error(f"Failed to start recording: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/record/stop")
async def record_stop(request: StopRecordingRequest):
    try:
        result = stop_recording(request.session_id)
        return {
            "status": "stopped",
            "session_id": request.session_id,
            "message": result
        }
    except Exception as e:
        logger.error(f"Failed to stop recording: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/record/status/{session_id}")
async def record_status(session_id: str):
    try:
        status = get_recording_status(session_id)
        return status
    except Exception as e:
        logger.error(f"Failed to get recording status: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/videos")
async def list_videos():
    try:
        video_files = []
        for video_file in videos_dir.glob("*.mp4"):
            stat = video_file.stat()
            video_files.append({
                "filename": video_file.name,
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        
        video_files.sort(key=lambda x: x["modified"], reverse=True)
        
        return {
            "videos": video_files,
            "count": len(video_files)
        }
    except Exception as e:
        logger.error(f"Failed to list videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/videos/{filename}")
async def get_video(filename: str):
    try:
        video_path = videos_dir / filename
        if not video_path.exists():
            raise HTTPException(status_code=404, detail="Video not found")
        
        if not video_path.is_relative_to(videos_dir):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return FileResponse(
            str(video_path),
            media_type="video/mp4",
            filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/open/vlc')
async def open_vlc(req: CloseSessionRequest):
    """Start VLC on the server to play the session's local RTSP URL.

    Note: this launches VLC on the machine running the server. It does not
    attempt to launch VLC on the client/browser machine.
    """
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')

    vlc_cmd = config.get('vlc_path', 'vlc')
    # prefer full path if provided
    if not shutil.which(vlc_cmd):
        # maybe it's an absolute path
        if not Path(vlc_cmd).exists():
            raise HTTPException(status_code=400, detail=f'VLC executable not found: {vlc_cmd}')

    url = session.local_rtsp_url
    try:
        # Windows: use start-process semantics; here just launch the process detached
        Popen([vlc_cmd, url], shell=False)
        return { 'status': 'launched', 'cmd': [vlc_cmd, url] }
    except Exception as e:
        logger.error(f'Failed to launch VLC: {e}')
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        log_level=config.get("log_level", "info").lower(),
        reload=False
    )
