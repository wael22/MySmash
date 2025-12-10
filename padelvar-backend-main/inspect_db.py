"""
Script pour vérifier directement le contenu de la base de données
"""
import sqlite3
import os

db_path = "instance/padelvar.db"

if not os.path.exists(db_path):
    print(f"❌ Base de données n'existe pas : {db_path}")
    exit(1)

print(f"📁 Base de données : {os.path.abspath(db_path)}")
print(f"📊 Taille : {os.path.getsize(db_path)} bytes\n")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Lister toutes les tables
print("📋 Tables dans la base :")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
for table in tables:
    print(f"   - {table[0]}")

print("\n🔍 Analyse de la table notifications:")

# Vérifier si la table existe
try:
    cursor.execute("SELECT COUNT(*) FROM notifications")
    total = cursor.fetchone()[0]
    print(f"   Total: {total} notifications")
    
    if total > 0:
        # Afficher toutes les notifications
        cursor.execute("SELECT id, user_id, title, message, created_at FROM notifications ORDER BY created_at DESC")
        notifs = cursor.fetchall()
        print(f"\n📝 Liste des notifications:")
        for n in notifs:
            print(f"      ID:{n[0]} User:{n[1]} - {n[2]}")
            print(f"         Message: {n[3][:50]}...")
            print(f"         Créée: {n[4]}")
            
        # Groupe par utilisateur
        cursor.execute("SELECT user_id, COUNT(*) FROM notifications GROUP BY user_id")
        by_user = cursor.fetchall()
        print(f"\n👥 Par utilisateur:")
        for user_id, count in by_user:
            print(f"      User {user_id}: {count} notification(s)")
    else:
        print("   ❌ AUCUNE notification trouvée!")
        
except sqlite3.OperationalError as e:
    print(f"   ❌ Erreur: {e}")
    print("   La table 'notifications' n'existe probablement pas")

conn.close()
