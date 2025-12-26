#!/usr/bin/env python
"""
Script d'urgence pour ajouter les colonnes tutorial à la base de données.
URGENT: À exécuter IMMÉDIATEMENT pour réparer l'application.
"""

import sqlite3
import sys
import os

def migrate():
    db_path = 'instance/app.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Base de données '{db_path}' introuvable!")
        return False
    
    try:
        # Se connecter à la base de données
        conn = sqlite3.connect(db_path, timeout=10)
        cursor = conn.cursor()
        
        # Vérifier si les colonnes existent déjà
        cursor.execute("PRAGMA table_info(user)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'tutorial_completed' in columns and 'tutorial_step' in columns:
            print("ℹ️  Les colonnes tutorial existent déjà - Migration non nécessaire")
            conn.close()
            return True
        
        print("🔧 Application de la migration tutorial...")
        
        # Ajouter les colonnes
        if 'tutorial_completed' not in columns:
            cursor.execute('ALTER TABLE user ADD COLUMN tutorial_completed BOOLEAN NOT NULL DEFAULT 0')
            print("✅ Colonne 'tutorial_completed' ajoutée")
        
        if 'tutorial_step' not in columns:
            cursor.execute('ALTER TABLE user ADD COLUMN tutorial_step INTEGER DEFAULT NULL')
            print("✅ Colonne 'tutorial_step' ajoutée")
        
        # Marquer tous les utilisateurs existants comme ayant complété le tutoriel
        cursor.execute('UPDATE user SET tutorial_completed = 1 WHERE id > 0')
        affected = cursor.rowcount
        
        conn.commit()
        print(f"✅ {affected} utilisateurs existants marqués comme ayant complété le tutoriel")
        
        # Vérifier le résultat
        cursor.execute('SELECT COUNT(*) FROM user')
        total = cursor.fetchone()[0]
        
        conn.close()
        
        print(f"\n✅ MIGRATION RÉUSSIE!")
        print(f"   Total utilisateurs: {total}")
        print(f"\n🔄 REDÉMARREZ LE SERVEUR BACKEND maintenant!")
        
        return True
        
    except sqlite3.OperationalError as e:
        if "database is locked" in str(e):
            print(f"\n❌ Base de données verrouillée!")
            print(f"   ARRÊTEZ le serveur backend (CTRL+C)")
            print(f"   puis relancez ce script.")
            return False
        else:
            print(f"❌ Erreur SQL: {e}")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("  MIGRATION D'URGENCE - AJOUT COLONNES TUTORIAL")
    print("="*60)
    print()
    
    success = migrate()
    
    if not success:
        print("\n⚠️  Échec de la migration")
        print("   Arrêtez le serveur et réessayez")
        sys.exit(1)
    else:
        sys.exit(0)
