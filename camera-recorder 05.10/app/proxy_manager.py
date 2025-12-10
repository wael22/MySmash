import logging
import subprocess
import time
import requests
import zipfile
import io
import yaml
from pathlib import Path
from typing import Optional, Dict
import platform

from app.config import config

logger = logging.getLogger(__name__)


class ProxyManager:
    def __init__(self):
        self.mediamtx_process: Optional[subprocess.Popen] = None
        self.go2rtc_process: Optional[subprocess.Popen] = None
        self.bin_dir = Path(config["bin_dir"])
        self.bin_dir.mkdir(parents=True, exist_ok=True)
        
        self.mediamtx_port = config["mediamtx_port"]
        self.go2rtc_port = config["go2rtc_port"]
        
        self.mediamtx_binary = self.bin_dir / "mediamtx.exe"
        self.go2rtc_binary = self.bin_dir / "go2rtc.exe"
        
        self.mediamtx_config_path = self.bin_dir / "mediamtx.yml"
        self.go2rtc_config_path = self.bin_dir / "go2rtc.yaml"
        
        self.go2rtc_streams: Dict[str, str] = {}

    def ensure_binaries(self):
        if not self.mediamtx_binary.exists():
            logger.info("MediaMTX binary not found, downloading...")
            self.download_mediamtx()
        
        if not self.go2rtc_binary.exists():
            logger.info("go2rtc binary not found, downloading...")
            self.download_go2rtc()

    def download_mediamtx(self):
        try:
            url = config["mediamtx_download_url"]
            logger.info(f"Downloading MediaMTX from {url}")
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
                for member in zf.namelist():
                    if member.endswith("mediamtx.exe"):
                        with open(self.mediamtx_binary, 'wb') as f:
                            f.write(zf.read(member))
                        logger.info(f"MediaMTX extracted to {self.mediamtx_binary}")
                        return
            
            logger.error("mediamtx.exe not found in archive")
        except Exception as e:
            logger.error(f"Failed to download MediaMTX: {e}")
            raise

    def download_go2rtc(self):
        try:
            url = config["go2rtc_download_url"]
            logger.info(f"Downloading go2rtc from {url}")
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
                for member in zf.namelist():
                    if member.endswith("go2rtc.exe") or member == "go2rtc.exe":
                        with open(self.go2rtc_binary, 'wb') as f:
                            f.write(zf.read(member))
                        logger.info(f"go2rtc extracted to {self.go2rtc_binary}")
                        return
            
            logger.error("go2rtc.exe not found in archive")
        except Exception as e:
            logger.error(f"Failed to download go2rtc: {e}")
            raise

    def generate_mediamtx_config(self):
        config_data = {
            "rtspAddress": f":{self.mediamtx_port}",
            "rtpAddress": ":8000",
            "rtcpAddress": ":8001",
            "logLevel": "info",
            "readTimeout": "10s",
            "writeTimeout": "10s",
            "paths": {
                "all": {
                    "source": "publisher"
                }
            }
        }
        
        with open(self.mediamtx_config_path, 'w') as f:
            yaml.dump(config_data, f, default_flow_style=False)
        
        logger.info(f"Generated MediaMTX config at {self.mediamtx_config_path}")

    def generate_go2rtc_config(self):
        config_data = {
            "rtsp": {
                "listen": f":{self.go2rtc_port}"
            },
            "streams": self.go2rtc_streams,
            "log": {
                "level": "info"
            }
        }
        
        with open(self.go2rtc_config_path, 'w') as f:
            yaml.dump(config_data, f, default_flow_style=False)
        
        logger.info(f"Generated go2rtc config at {self.go2rtc_config_path}")

    def start_mediamtx(self):
        if self.mediamtx_process and self.mediamtx_process.poll() is None:
            logger.info("MediaMTX already running")
            return
        
        self.generate_mediamtx_config()
        
        try:
            creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if platform.system() == "Windows" else 0
            self.mediamtx_process = subprocess.Popen(
                [str(self.mediamtx_binary), str(self.mediamtx_config_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=creationflags,
                cwd=str(self.bin_dir)
            )
            time.sleep(2)
            
            if self.mediamtx_process.poll() is not None:
                logger.error("MediaMTX failed to start")
                raise RuntimeError("MediaMTX startup failed")
            
            logger.info(f"MediaMTX started on port {self.mediamtx_port}")
        except Exception as e:
            logger.error(f"Failed to start MediaMTX: {e}")
            raise

    def start_go2rtc(self):
        if self.go2rtc_process and self.go2rtc_process.poll() is None:
            logger.info("go2rtc already running")
            return
        
        self.generate_go2rtc_config()
        
        try:
            creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if platform.system() == "Windows" else 0
            self.go2rtc_process = subprocess.Popen(
                [str(self.go2rtc_binary), "-c", str(self.go2rtc_config_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=creationflags,
                cwd=str(self.bin_dir)
            )
            time.sleep(2)
            
            if self.go2rtc_process.poll() is not None:
                logger.error("go2rtc failed to start")
                raise RuntimeError("go2rtc startup failed")
            
            logger.info(f"go2rtc started on port {self.go2rtc_port}")
        except Exception as e:
            logger.error(f"Failed to start go2rtc: {e}")
            raise

    def add_go2rtc_stream(self, session_id: str, source_url: str):
        self.go2rtc_streams[f"sess-{session_id}"] = source_url
        self.generate_go2rtc_config()
        
        if self.go2rtc_process and self.go2rtc_process.poll() is None:
            try:
                api_url = f"http://127.0.0.1:1984/api/config"
                requests.post(api_url, json={"streams": self.go2rtc_streams}, timeout=5)
                logger.info(f"Updated go2rtc stream sess-{session_id}")
            except Exception as e:
                logger.warning(f"Failed to update go2rtc via API, restart may be needed: {e}")
        
        return f"rtsp://127.0.0.1:{self.go2rtc_port}/sess-{session_id}"

    def remove_go2rtc_stream(self, session_id: str):
        stream_name = f"sess-{session_id}"
        if stream_name in self.go2rtc_streams:
            del self.go2rtc_streams[stream_name]
            self.generate_go2rtc_config()
            logger.info(f"Removed go2rtc stream {stream_name}")

    def get_mediamtx_publish_url(self, session_id: str) -> str:
        return f"rtsp://127.0.0.1:{self.mediamtx_port}/sess-{session_id}"

    def stop_mediamtx(self):
        if self.mediamtx_process:
            try:
                self.mediamtx_process.terminate()
                self.mediamtx_process.wait(timeout=5)
                logger.info("MediaMTX stopped")
            except Exception as e:
                logger.warning(f"Failed to stop MediaMTX gracefully: {e}")
                self.mediamtx_process.kill()

    def stop_go2rtc(self):
        if self.go2rtc_process:
            try:
                self.go2rtc_process.terminate()
                self.go2rtc_process.wait(timeout=5)
                logger.info("go2rtc stopped")
            except Exception as e:
                logger.warning(f"Failed to stop go2rtc gracefully: {e}")
                self.go2rtc_process.kill()

    def cleanup(self):
        self.stop_mediamtx()
        self.stop_go2rtc()


proxy_manager = ProxyManager()
