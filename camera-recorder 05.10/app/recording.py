import logging
import subprocess
import signal
import time
import platform
import threading
import io
import shutil
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict
import requests
import importlib

from app.config import config
from app.session_manager import session_manager

logger = logging.getLogger(__name__)

recording_processes: Dict[str, subprocess.Popen] = {}
recording_outputs: Dict[str, Path] = {}
proxy_processes: Dict[str, subprocess.Popen] = {}


def start_recording(session_id: str, duration_seconds: int) -> str:
    session = session_manager.get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    if session.recording:
        raise ValueError(f"Session {session_id} is already recording")

    videos_dir = Path(config["videos_dir"])
    videos_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    output_filename = f"{session_id}_{timestamp}.mp4"
    output_path = videos_dir / output_filename

    ffmpeg_path = config["ffmpeg_path"]
    preset = config["ffmpeg_preset"]
    crf = config["ffmpeg_crf"]
    audio_bitrate = config["ffmpeg_audio_bitrate"]

    # Resolve ffmpeg executable: allow either a full path in config or a bare command
    ffmpeg_exec = ffmpeg_path
    try:
        if os.path.isabs(ffmpeg_path):
            if not Path(ffmpeg_path).exists():
                # try with .exe on Windows
                if platform.system() == "Windows" and not Path(ffmpeg_path + ".exe").exists():
                    raise FileNotFoundError(ffmpeg_path)
                ffmpeg_exec = ffmpeg_path
        else:
            resolved = shutil.which(ffmpeg_path)
            if not resolved and platform.system() == "Windows":
                resolved = shutil.which(ffmpeg_path + ".exe")
            if not resolved:
                raise FileNotFoundError(ffmpeg_path)
            ffmpeg_exec = resolved
    except FileNotFoundError:
        logger.error(f"ffmpeg executable not found: '{ffmpeg_path}'. "
                     "Set config['ffmpeg_path'] to the full path to ffmpeg.exe or add it to PATH")
        raise

    # Use the original source URL for MJPEG sources (ffmpeg can read MJPEG HTTP directly).
    input_url = session.local_rtsp_url
    if getattr(session, "source_type", None) == "mjpeg":
        input_url = session.source_url

    # Optionally start a local proxy to stabilize the stream and force a consistent FPS.
    # We'll launch video_proxy_server.py on a free localhost port and point ffmpeg to it.
    proxy_port = None
    proxy_proc = None
    try:
        # choose a port starting from 8080 upwards
        base_port = 8080
        for p in range(base_port, base_port + 50):
            import socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                try:
                    s.bind(('127.0.0.1', p))
                    proxy_port = p
                    break
                except OSError:
                    continue

        if proxy_port:
            # start python process running video_proxy_server.py from this package's directory
            proxy_script = Path(__file__).resolve().parents[0] / 'video_proxy_server.py'
            if proxy_script.exists():
                py_exec = sys.executable if 'sys' in globals() else shutil.which('python') or 'python'
                proxy_cmd = [py_exec, str(proxy_script), '--source', session.source_url,
                             '--port', str(proxy_port), '--fps', str(config.get('proxy_fps', 25))]
                logger.info(
                    f"Starting local proxy for session {session_id} on port {proxy_port} using: {proxy_cmd[0]} {proxy_script}"
                )
                proxy_proc = subprocess.Popen(
                    proxy_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    creationflags=(subprocess.CREATE_NEW_PROCESS_GROUP if platform.system() == 'Windows' else 0),
                )
                proxy_processes[session_id] = proxy_proc

                # wait for the proxy to serve /stream.mjpg
                proxy_url = f"http://127.0.0.1:{proxy_port}/stream.mjpg"
                ready = False
                deadline = time.time() + config.get('stream_verification_timeout', 5)
                while time.time() < deadline:
                    try:
                        resp = requests.get(proxy_url, stream=True, timeout=2)
                        if resp.status_code == 200:
                            ready = True
                            # close response
                            resp.close()
                            break
                    except Exception:
                        pass
                    time.sleep(0.2)

                if ready:
                    input_url = proxy_url
                    logger.info(f"Using proxy input URL for ffmpeg: {input_url}")
                else:
                    logger.warning("Proxy did not become ready in time, falling back to original input URL")
            else:
                logger.debug("video_proxy_server.py not found in app/; skipping proxy creation")
    except Exception as e:
        logger.debug(f"Error while launching proxy for session {session_id}: {e}")

    # Wait for the input stream to be ready before starting ffmpeg.
    def wait_for_stream(url: str, timeout: int = config.get("stream_verification_timeout", 5)) -> bool:
        # If it's a local go2rtc RTSP url, poll go2rtc API for the stream presence.
        try:
            parsed = url
            go2rtc_port = config.get("go2rtc_port", 8555)
            if f"127.0.0.1:{go2rtc_port}" in url and url.startswith("rtsp://"):
                # stream name is last path component
                stream_name = url.rsplit('/', 1)[-1]
                api_url = "http://127.0.0.1:1984/api/streams"
                deadline = time.time() + timeout
                while time.time() < deadline:
                    try:
                        resp = requests.get(api_url, timeout=2)
                        if resp.status_code == 200:
                            try:
                                data = resp.json()
                            except Exception:
                                data = {}
                            # data may be dict of streams; check both keys and producer URLs
                            if isinstance(data, dict):
                                # direct stream key match
                                if stream_name in data:
                                    logger.info(f"go2rtc reports stream '{stream_name}' present")
                                    return True
                                # search producers for the original source URL
                                for key, info in data.items():
                                    try:
                                        producers = info.get('producers') or []
                                        for p in producers:
                                            purl = p.get('url') if isinstance(p, dict) else None
                                            if purl and (purl == url or purl == session.source_url):
                                                logger.info(f"go2rtc stream '{key}' has producer matching source URL")
                                                return True
                                    except Exception:
                                        continue
                    except Exception:
                        # go2rtc API not ready yet
                        pass
                    time.sleep(0.5)
                return False

            # Otherwise, attempt a lightweight OpenCV check if available
            try:
                cv2 = importlib.import_module('cv2')
                cap = cv2.VideoCapture(url)
                if not cap.isOpened():
                    cap.release()
                    return False
                # try to read a few frames
                got = 0
                start = time.time()
                while time.time() - start < timeout and got < 1:
                    ret, _ = cap.read()
                    if ret:
                        got += 1
                        break
                    time.sleep(0.1)
                cap.release()
                return got >= 1
            except Exception:
                # No cv2 available or other error - assume ready
                return True
        except Exception:
            return True

    ready = wait_for_stream(input_url, timeout=config.get("stream_verification_timeout", 5))
    if not ready:
        logger.error(f"Stream {input_url} not ready after waiting; aborting recording")
        raise RuntimeError(f"Input stream not ready: {input_url}")

    cmd = [
        ffmpeg_exec,
        "-i", input_url,
        "-t", str(duration_seconds),
        "-c:v", "libx264",
        "-preset", preset,
        "-crf", str(crf),
        "-c:a", "aac",
        "-b:a", audio_bitrate,
        "-y",
        str(output_path)
    ]

    logger.info(f"Starting recording for session {session_id}")
    logger.info(f"Command: {' '.join(cmd)}")

    try:
        if platform.system() == "Windows":
            creationflags = subprocess.CREATE_NEW_PROCESS_GROUP
        else:
            creationflags = 0

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=creationflags
        )

        # Start background threads to continuously log ffmpeg stdout/stderr and write to a per-recording log file.
        log_path = output_path.with_suffix('.ffmpeg.log')
        try:
            log_file = open(log_path, 'a', encoding='utf-8', errors='replace')
        except Exception:
            log_file = None

        def _log_stream(stream, log_fn, sid: str, fh=None):
            if not stream:
                return
            try:
                text_stream = io.TextIOWrapper(stream, encoding='utf-8', errors='replace')
                for line in text_stream:
                    line = line.rstrip('\n')
                    if line:
                        try:
                            if fh:
                                fh.write(line + '\n')
                                fh.flush()
                        except Exception:
                            pass
                        log_fn(f"[ffmpeg][{sid}] {line}")
            except Exception as e:
                logger.debug(f"Error reading ffmpeg stream for session {sid}: {e}")

        threading.Thread(target=_log_stream, args=(process.stderr, logger.error, session_id, log_file), daemon=True).start()
        threading.Thread(target=_log_stream, args=(process.stdout, logger.info, session_id, log_file), daemon=True).start()

        # Close the log file when the process exits
        def _close_log_when_done(p: subprocess.Popen, fh):
            try:
                p.wait()
            finally:
                try:
                    if fh:
                        fh.close()
                except Exception:
                    pass

        threading.Thread(target=_close_log_when_done, args=(process, log_file), daemon=True).start()

        recording_processes[session_id] = process
        recording_outputs[session_id] = output_path
        # keep proxy process mapping (if any)
        if proxy_proc:
            proxy_processes[session_id] = proxy_proc
        session.recording = True
        session.recording_process = process

        logger.info(f"Recording started for session {session_id}, PID: {process.pid}, output: {output_path}")

        return str(output_path)

    except Exception as e:
        logger.error(f"Failed to start recording for session {session_id}: {e}")
        raise


def stop_recording(session_id: str) -> Optional[str]:
    session = session_manager.get_session(session_id)
    if not session:
        logger.warning(f"Session {session_id} not found")
        return None

    if not session.recording:
        logger.warning(f"Session {session_id} is not recording")
        return None

    process = recording_processes.get(session_id)
    if not process:
        logger.warning(f"No recording process found for session {session_id}")
        session.recording = False
        return None

    logger.info(f"Stopping recording for session {session_id}, PID: {process.pid}")

    try:
        if platform.system() == "Windows":
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32
                kernel32.GenerateConsoleCtrlEvent(1, process.pid)
                logger.info(f"Sent CTRL_BREAK_EVENT to PID {process.pid}")
            except Exception as e:
                logger.warning(f"Failed to send CTRL_BREAK_EVENT: {e}, using terminate()")
                process.terminate()
        else:
            process.send_signal(signal.SIGINT)

        try:
            process.wait(timeout=10)
            logger.info(f"Recording process {process.pid} terminated gracefully")
        except subprocess.TimeoutExpired:
            logger.warning(f"Recording process {process.pid} did not stop gracefully, killing")
            process.kill()
            process.wait(timeout=5)

    except Exception as e:
        logger.error(f"Error stopping recording for session {session_id}: {e}")
        try:
            process.kill()
        except:
            pass

    finally:
        if session_id in recording_processes:
            del recording_processes[session_id]
        # ensure proxy process stopped if started
        pproxy = proxy_processes.get(session_id)
        if pproxy:
            try:
                logger.info(f"Stopping proxy process for session {session_id}, PID: {pproxy.pid}")
                if platform.system() == "Windows":
                    pproxy.terminate()
                else:
                    pproxy.terminate()
                pproxy.wait(timeout=5)
            except Exception:
                try:
                    pproxy.kill()
                except Exception:
                    pass
            try:
                del proxy_processes[session_id]
            except KeyError:
                pass
        session.recording = False
        session.recording_process = None
        logger.info(f"Recording stopped for session {session_id}")

    return "Recording stopped"


def get_recording_status(session_id: str) -> Dict:
    session = session_manager.get_session(session_id)
    if not session:
        return {"recording": False, "error": "Session not found"}

    process = recording_processes.get(session_id)
    
    if session.recording and process:
        poll_result = process.poll()
        if poll_result is not None:
            logger.info(f"Recording process for session {session_id} has ended with code {poll_result}")
            session.recording = False
            if session_id in recording_processes:
                del recording_processes[session_id]
            # Check output file size and surface ffmpeg log tail if the file is unexpectedly small.
            output_path = recording_outputs.pop(session_id, None)
            if output_path:
                try:
                    if output_path.exists():
                        size = output_path.stat().st_size
                        min_size = int(config.get("min_recording_size_bytes", 50 * 1024))
                        if size < min_size:
                            log_path = output_path.with_suffix('.ffmpeg.log')
                            tail = None
                            try:
                                if log_path.exists():
                                    with open(log_path, 'rb') as lf:
                                        lf.seek(0, os.SEEK_END)
                                        length = lf.tell()
                                        start = max(0, length - 4000)
                                        lf.seek(start)
                                        tail = lf.read().decode('utf-8', errors='replace')
                            except Exception:
                                tail = None

                            logger.error(f"Recording output {output_path} is too small ({size} bytes). ffmpeg log tail:\n{tail}")
                except Exception as e:
                    logger.debug(f"Error while checking recording output for session {session_id}: {e}")

            return {"recording": False, "completed": True}
        
        return {"recording": True, "pid": process.pid}
    
    return {"recording": False}


def cleanup_all_recordings():
    logger.info("Cleaning up all recording processes")
    session_ids = list(recording_processes.keys())
    for session_id in session_ids:
        try:
            stop_recording(session_id)
        except Exception as e:
            logger.error(f"Error cleaning up recording for session {session_id}: {e}")
