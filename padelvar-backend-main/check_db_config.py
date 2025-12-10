"""
Script pour afficher le chemin de la base de données utilisée
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import Config

print("🔍 Configuration de la base de données:")
print(f"   URI: {Config.get_database_uri()}")
print(f"   FLASK_ENV: {os.environ.get('FLASK_ENV', 'development')}")
