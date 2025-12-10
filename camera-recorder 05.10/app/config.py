import json
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)


class Config:
    def __init__(self, config_path: str = "config.json"):
        self.config_path = Path(config_path)
        self.data: Dict[str, Any] = {}
        self.load()
        self.validate()

    def load(self):
        if not self.config_path.exists():
            logger.warning(f"Config file {self.config_path} not found, using defaults")
            self.data = self.get_defaults()
            return

        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            logger.info(f"Configuration loaded from {self.config_path}")
        except Exception as e:
            logger.error(f"Failed to load config: {e}, using defaults")
            self.data = self.get_defaults()

    def get_defaults(self) -> Dict[str, Any]:
        return {
            "log_level": "info",
            "max_sessions": 3,
            "mediamtx_port": 8554,
            "go2rtc_port": 8555,
            "ffmpeg_path": "ffmpeg",
            "proxy_fps": 25,
            "preview_jpeg_quality": 70,
            "stream_verification_timeout": 5,
            "stream_verification_frames": 10,
            "ffmpeg_preset": "veryfast",
            "ffmpeg_crf": 23,
            "ffmpeg_audio_bitrate": "128k",
            "videos_dir": "./videos",
            "bin_dir": "./bin",
            "mediamtx_download_url": "https://github.com/bluenviron/mediamtx/releases/download/v1.8.3/mediamtx_v1.8.3_windows_amd64.zip",
            "go2rtc_download_url": "https://github.com/AlexxIT/go2rtc/releases/download/v1.9.2/go2rtc_win64.zip",
            "vlc_path": "vlc"
        }

    def validate(self):
        required_keys = ["max_sessions", "mediamtx_port", "go2rtc_port"]
        for key in required_keys:
            if key not in self.data:
                default_val = self.get_defaults()[key]
                logger.warning(f"Missing config key '{key}', using default: {default_val}")
                self.data[key] = default_val

        if self.data["max_sessions"] < 1:
            logger.warning("max_sessions < 1, setting to 1")
            self.data["max_sessions"] = 1
        elif self.data["max_sessions"] > 10:
            logger.warning("max_sessions > 10, capping at 10")
            self.data["max_sessions"] = 10

    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)

    def __getitem__(self, key: str) -> Any:
        return self.data[key]

    def __contains__(self, key: str) -> bool:
        return key in self.data


config = Config()
