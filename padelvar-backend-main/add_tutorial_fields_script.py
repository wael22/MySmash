#!/usr/bin/env python
# Script pour ajouter les champs tutorial à la table user

import sqlite3
import os
import glob

# Chercher le fichier de base de données
db_files = glob.glob('*.db')
if not db_files:
    print("❌ Aucun fichier .db trouvé!")
    exit(1)

db_path = db_files[0]
print(f"📁 Base de données trouvée: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Vérifier si les colonnes existent déjà
    cursor.execute("PRAGMA table_info(user)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'tutorial_completed' in columns:
        print("ℹ️  La colonne 'tutorial_completed' existe déjà")
    else:
        cursor.execute('ALTER TABLE user ADD COLUMN tutorial_completed BOOLEAN NOT NULL DEFAULT 0')
        print("✅ Colonne 'tutorial_completed' ajoutée")
    
    if 'tutorial_step' in columns:
        print("ℹ️  La colonne 'tutorial_step' existe déjà")
    else:
        cursor.execute('ALTER TABLE user ADD COLUMN tutorial_step INTEGER DEFAULT NULL')
        print("✅ Colonne 'tutorial_step' ajoutée")
    
    # Marquer tous les utilisateurs existants comme ayant complété le tutoriel
    cursor.execute('UPDATE user SET tutorial_completed = 1 WHERE tutorial_completed = 0')
    affected = cursor.rowcount
    
    conn.commit()
    print(f"✅ {affected} utilisateurs existants marqués comme ayant complété le tutoriel")
    
    # Afficher le résultat
    cursor.execute('''
        SELECT COUNT(*) as total_users, 
               SUM(CASE WHEN tutorial_completed = 1 THEN 1 ELSE 0 END) as users_with_tutorial_completed
        FROM user
    ''')
    result = cursor.fetchone()
    print(f"\n📊 Résumé:")
    print(f"   Total utilisateurs: {result[0]}")
    print(f"   Tutoriel complété: {result[1]}")
    
    conn.close()
    print("\n✅ Migration terminée avec succès!")
    
except sqlite3.OperationalError as e:
    print(f"❌ Erreur SQL: {e}")
    if "duplicate column name" in str(e):
        print("ℹ️  Les colonnes existent déjà, pas besoin de migration")
except Exception as e:
    print(f"❌ Erreur: {e}")
    if conn:
        conn.rollback()
        conn.close()
