#!/usr/bin/env python
"""
Script de diagnostic et migration complète des bases de données
Analyse tous les fichiers .db et applique la migration tutorial
"""

import sqlite3
import os
import sys
from pathlib import Path

def analyze_db(db_path):
    """Analyse une base de données et retourne les informations"""
    try:
        conn = sqlite3.connect(db_path, timeout=2)
        cursor = conn.cursor()
        
        # Vérifier si la table user existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
        has_user_table = cursor.fetchone() is not None
        
        if not has_user_table:
            conn.close()
            return {"has_user_table": False, "error": "No user table"}
        
        # Obtenir les colonnes de la table user
        cursor.execute("PRAGMA table_info(user)")
        columns = {col[1]: col[2] for col in cursor.fetchall()}
        
        # Compter les utilisateurs
        cursor.execute("SELECT COUNT(*) FROM user")
        user_count = cursor.fetchone()[0]
        
        # Vérifier les colonnes tutorial
        has_tutorial_completed = 'tutorial_completed' in columns
        has_tutorial_step = 'tutorial_step' in columns
        
        conn.close()
        
        return {
            "has_user_table": True,
            "user_count": user_count,
            "has_tutorial_completed": has_tutorial_completed,
            "has_tutorial_step": has_tutorial_step,
            "columns": list(columns.keys()),
           "needs_migration": not (has_tutorial_completed and has_tutorial_step)
        }
    except sqlite3.OperationalError as e:
        if "database is locked" in str(e):
            return {"error": "DATABASE LOCKED - Stop the server first!"}
        return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}

def migrate_db(db_path):
    """Applique la migration sur une base de données"""
    try:
        conn = sqlite3.connect(db_path, timeout=2)
        cursor = conn.cursor()
        
        # Vérifier les colonnes existantes
        cursor.execute("PRAGMA table_info(user)")
        columns = [col[1] for col in cursor.fetchall()]
        
        changes = []
        
        if 'tutorial_completed' not in columns:
            cursor.execute('ALTER TABLE user ADD COLUMN tutorial_completed BOOLEAN NOT NULL DEFAULT 0')
            changes.append("tutorial_completed")
        
        if 'tutorial_step' not in columns:
            cursor.execute('ALTER TABLE user ADD COLUMN tutorial_step INTEGER DEFAULT NULL')
            changes.append("tutorial_step")
        
        if changes:
            # Marquer tous les utilisateurs existants comme ayant complété le tutoriel
            cursor.execute('UPDATE user SET tutorial_completed = 1 WHERE id > 0')
            affected = cursor.rowcount
            conn.commit()
            return {"success": True, "columns_added": changes, "users_updated": affected}
        else:
            conn.close()
            return {"success": True, "message": "Already migrated"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if conn:
            conn.close()

def main():
    print("="*70)
    print(" DIAGNOSTIC COMPLET DES BASES DE DONNÉES")
    print("="*70)
    print()
    
    # Trouver tous les fichiers .db
    db_files = []
    for pattern in ['*.db', 'instance/*.db']:
        db_files.extend(Path('.').glob(pattern))
    
    if not db_files:
        print("❌ Aucun fichier .db trouvé!")
        return 1
    
    print(f"📊 {len(db_files)} base(s) de données trouvée(s):\n")
    
    # Analyser chaque base de données
    results = {}
    for db_file in db_files:
        db_path = str(db_file)
        print(f"🔍 Analyse: {db_path}")
        info = analyze_db(db_path)
        results[db_path] = info
        
        if "error" in info:
            print(f"   ❌ Erreur: {info['error']}")
        elif not info.get("has_user_table"):
            print(f"   ⚠️  Pas de table 'user'")
        else:
            print(f"   ✓ Table user: {info['user_count']} utilisateurs")
            print(f"   ✓ tutorial_completed: {'✅' if info['has_tutorial_completed'] else '❌'}")
            print(f"   ✓ tutorial_step: {'✅' if info['has_tutorial_step'] else '❌'}")
            if info['needs_migration']:
                print(f"   ⚠️  MIGRATION NÉCESSAIRE")
        print()
    
    # Identifier la base de données principale
    print("="*70)
    print(" MIGRATION")
    print("="*70)
    print()
    
    # Essayer de migrer toutes les bases qui en ont besoin
    migrated = False
    for db_path, info in results.items():
        if info.get("needs_migration") and info.get("has_user_table"):
            print(f"🔧 Migration de: {db_path}")
            result = migrate_db(db_path)
            
            if result.get("success"):
                if "columns_added" in result:
                    print(f"   ✅ Colonnes ajoutées: {', '.join(result['columns_added'])}")
                    print(f"   ✅ Utilisateurs mis à jour: {result['users_updated']}")
                    migrated = True
                else:
                    print(f"   ℹ️  {result.get('message', 'OK')}")
            else:
                print(f"   ❌ Erreur: {result.get('error')}")
            print()
    
    if migrated:
        print("="*70)
        print("✅ MIGRATION TERMINÉE AVEC SUCCÈS!")
        print("="*70)
        print()
        print("Vous pouvez maintenant:")
        print("1. Redémarrer le serveur backend: python .\\app.py")
        print("2. Le tutoriel fonctionnera pour les nouveaux utilisateurs")
        print()
        return 0
    elif not any(r.get("needs_migration") for r in results.values()):
        print("✅ Toutes les bases de données sont déjà migrées!")
        print()
        print("Si le serveur affiche toujours des erreurs:")
        print("1. Vérifiez que le bon fichier .db est utilisé")
        print("2. Redémarrez complètement le serveur")
        return 0
    else:
        print("❌ Impossible de migrer - base de données verrouillée")
        print("Arrêtez le serveur backend (CTRL+C) et relancez ce script")
        return 1

if __name__ == "__main__":
    sys.exit(main())
