"""Script pour auto-vérifier tous les utilisateurs existants"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'padelvar.db')

def auto_verify_existing_users():
    """Marque tous les utilisateurs existants comme vérifiés"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🚀 Auto-vérification des utilisateurs existants...")
        
        # Compter les utilisateurs non vérifiés
        cursor.execute("SELECT COUNT(*) FROM user WHERE email_verified = 0 OR email_verified IS NULL")
        count = cursor.fetchone()[0]
        
        if count == 0:
            print("ℹ️  Aucun utilisateur à vérifier")
            return
        
        print(f"📊 {count} utilisateur(s) non vérifié(s) trouvé(s)")
        
        # Mettre à jour tous les utilisateurs non vérifiés
        now = datetime.utcnow().isoformat()
        cursor.execute("""
            UPDATE user 
            SET email_verified = 1,
                email_verified_at = ?,
                email_verification_token = NULL,
                email_verification_sent_at = NULL
            WHERE email_verified = 0 OR email_verified IS NULL
        """, (now,))
        
        conn.commit()
        print(f"✅ {count} utilisateur(s) auto-vérifié(s) avec succès!")
        
        # Afficher quelques exemples
        cursor.execute("""
            SELECT email, name, created_at 
            FROM user 
            WHERE email_verified = 1
            LIMIT 5
        """)
        
        print("\n📋 Exemples d'utilisateurs vérifiés:")
        for row in cursor.fetchall():
            print(f"   - {row[1]} ({row[0]})")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    auto_verify_existing_users()
