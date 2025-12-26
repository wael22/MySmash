"""Migration pour ajouter les champs de vérification d'email"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'padelvar.db')

def add_email_verification_fields():
    """Ajouter les champs nécessaires pour la vérification d'email"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🚀 Ajout des champs de vérification d'email...")
        
        # Vérifier si les colonnes existent déjà
        cursor.execute("PRAGMA table_info(user)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Ajouter email_verified si elle n'existe pas
        if 'email_verified' not in columns:
            cursor.execute("""
                ALTER TABLE user ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT 0
            """)
            print("✅ Colonne 'email_verified' ajoutée")
        else:
            print("ℹ️  Colonne 'email_verified' existe déjà")
        
        # Ajouter email_verification_token (sans UNIQUE car SQLite ne le supporte pas sur ALTER TABLE)
        if 'email_verification_token' not in columns:
            cursor.execute("""
                ALTER TABLE user ADD COLUMN email_verification_token TEXT
            """)
            print("✅ Colonne 'email_verification_token' ajoutée")
        else:
            print("ℹ️  Colonne 'email_verification_token' existe déjà")

        
        # Ajouter email_verification_sent_at
        if 'email_verification_sent_at' not in columns:
            cursor.execute("""
                ALTER TABLE user ADD COLUMN email_verification_sent_at TIMESTAMP
            """)
            print("✅ Colonne 'email_verification_sent_at' ajoutée")
        else:
            print("ℹ️  Colonne 'email_verification_sent_at' existe déjà")
        
        # Note: email_verified_at existe déjà dans le schéma
        
        conn.commit()
        print("\n✅ Migration terminée avec succès !")
        print("\n📋 Résumé des champs de vérification d'email :")
        print("   - email_verified (Boolean)")
        print("   - email_verification_token (String, unique)")
        print("   - email_verification_sent_at (DateTime)")
        print("   - email_verified_at (DateTime) - déjà existant")
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration : {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    add_email_verification_fields()
