"""
Script amélioré pour ajouter les colonnes 2FA à TOUTES les bases de données
"""
import sqlite3
import os
import glob

# Trouver toutes les bases de données dans le dossier instance
db_files = glob.glob(os.path.join('instance', '*.db'))

if not db_files:
    print("❌ Aucune base de données trouvée dans le dossier 'instance'")
    exit(1)

print(f"📁 {len(db_files)} base(s) de données trouvée(s)")

for db_path in db_files:
    print(f"\n{'='*60}")
    print(f"🔧 Traitement de: {db_path}")
    print(f"{'='*60}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Vérifier si les colonnes existent déjà
        cursor.execute("PRAGMA table_info(user)")
        columns = [column[1] for column in cursor.fetchall()]
        
        print(f"📋 Colonnes actuelles: {', '.join(columns[:5])}... ({len(columns)} total)")
        
        changes_made = False
        
        # Ajouter two_factor_secret
        if 'two_factor_secret' not in columns:
            print("  ➕ Ajout de 'two_factor_secret'...")
            cursor.execute("ALTER TABLE user ADD COLUMN two_factor_secret VARCHAR(255)")
            changes_made = True
            print("  ✅ 'two_factor_secret' ajoutée")
        else:
            print("  ⏭️  'two_factor_secret' existe déjà")
        
        # Ajouter two_factor_enabled
        if 'two_factor_enabled' not in columns:
            print("  ➕ Ajout de 'two_factor_enabled'...")
            cursor.execute("ALTER TABLE user ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0")
            changes_made = True
            print("  ✅ 'two_factor_enabled' ajoutée")
        else:
            print("  ⏭️  'two_factor_enabled' existe déjà")
        
        # Ajouter two_factor_backup_codes
        if 'two_factor_backup_codes' not in columns:
            print("  ➕ Ajout de 'two_factor_backup_codes'...")
            cursor.execute("ALTER TABLE user ADD COLUMN two_factor_backup_codes TEXT")
            changes_made = True
            print("  ✅ 'two_factor_backup_codes' ajoutée")
        else:
            print("  ⏭️  'two_factor_backup_codes' existe déjà")
        
        if changes_made:
            conn.commit()
            print(f"  💾 Changements sauvegardés pour {db_path}")
        else:
            print(f"  ℹ️  Aucun changement nécessaire pour {db_path}")
        
    except Exception as e:
        print(f"  ❌ Erreur: {e}")
        conn.rollback()
    finally:
        conn.close()

print(f"\n{'='*60}")
print("✅ Migration 2FA terminée pour toutes les bases de données!")
print("🚀 Redémarrez le serveur backend maintenant")
print(f"{'='*60}\n")
