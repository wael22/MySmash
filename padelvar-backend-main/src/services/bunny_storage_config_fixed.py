"""
FICHIER CORRECTIF pour bunny_storage_service.py
Copiez cette classe BunnyStorageConfig dans bunny_storage_service.py (lignes 23-57)
"""

import os
import logging

logger = logging.getLogger(__name__)


class BunnyStorageConfig:
    """Configuration centralisée pour Bunny Storage"""
    
    def __init__(self):
        # 🆕 Charger depuis la base de données au lieu des variables d'environnement
        try:
            from src.models.system_configuration import SystemConfiguration
            
            bunny_config = SystemConfiguration.get_bunny_cdn_config()
            
            if bunny_config:
                self.api_key = bunny_config.get('api_key', '')
                self.library_id = str(bunny_config.get('library_id', ''))
                self.cdn_hostname = bunny_config.get('cdn_hostname', '')
                logger.info(f"✅ Configuration Bunny chargée depuis DB (Library: {self.library_id})")
            else:
                # Fallback sur variables d'environnement si pas de config DB
                logger.warning("⚠️ Pas de configuration Bunny en DB, utilisation des variables d'environnement")
                self.api_key = os.environ.get('BUNNY_API_KEY', '')
                self.library_id = os.environ.get('BUNNY_LIBRARY_ID', '')
                self.cdn_hostname = os.environ.get('BUNNY_CDN_HOSTNAME', '')
        except Exception as e:
            logger.error(f"❌ Erreur chargement config Bunny: {e}")
            # Fallback ultime
            self.api_key = os.environ.get('BUNNY_API_KEY', '')
            self.library_id = os.environ.get('BUNNY_LIBRARY_ID', '')
            self.cdn_hostname = os.environ.get('BUNNY_CDN_HOSTNAME', '')
        
        # URLs API
        self.api_base_url = f"https://video.bunnycdn.com/library/{self.library_id}"
        
        # Headers API
        self.headers = {
            "AccessKey": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Configuration avancée
        self.chunk_size = 8 * 1024 * 1024  # 8MB chunks pour upload
        self.max_retries = 3
        self.retry_delay = 5  # secondes
        self.timeout = 300  # 5 minutes
        self.max_concurrent_uploads = 2
    
    def is_valid(self) -> bool:
        """Vérifie si la configuration est valide"""
        return (
            bool(self.api_key) and 
            len(self.api_key) > 10 and
            bool(self.library_id) and 
            self.library_id.isdigit() and
            bool(self.cdn_hostname) and 
            '.' in self.cdn_hostname
        )
