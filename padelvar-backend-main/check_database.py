"""
Script pour vérifier le chemin de la base de données et afficher son contenu
"""
import os
import sys
import sqlite3

# Ajouter le chemin du projet
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import Config

# Afficher le chemin de la DB
db_uri = Config.get_database_uri()
print(f"🔍 URI de la base de données: {db_uri}")

# Extract the database une path from URI
if db_uri.startswith('sqlite:///'):
    db_path = db_uri.replace('sqlite:///', '')
    print(f"📁 Chemin du fichier: {db_path}")
    
    # Vérifier si le fichier existe
    if os.path.exists(db_path):
        print(f"✅ Le fichier de base de données existe")
        
        # Afficher la taille
        size_bytes = os.path.getsize(db_path)
        size_mb = size_bytes / (1024 * 1024)
        print(f"📊 Taille: {size_mb:.2f} MB ({size_bytes} bytes)")
        
        # Afficher le contenu
        print(f"\n📋 Tables dans la base de données:")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"   - {table_name}: {count} lignes")
        
        # Afficher les notifications
        try:
            cursor.execute("SELECT COUNT(*) FROM notifications")
            notif_count = cursor.fetchone()[0]
            print(f"\n🔔 Total notifications: {notif_count}")
            
            if notif_count > 0:
                cursor.execute("SELECT user_id, COUNT(*) FROM notifications GROUP BY user_id")
                notif_by_user = cursor.fetchall()
                print(f"   Par utilisateur:")
                for user_id, count in notif_by_user:
                    print(f"     - User {user_id}: {count} notifications")
        except:
            print(f"\n⚠️ Table notifications n'existe pas encore")
        
        conn.close()
    else:
        print(f"❌ Le fichier de base de données n'existe PAS")
        print(f"   Il sera créé au premier démarrage du serveur")
