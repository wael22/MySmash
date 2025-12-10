"""
Migration: Ajout du champ credits_balance à la table club
"""
import sqlite3
import os

# Chemin vers la base de données
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'padelvar.db')

print(f"📊 Migration de la base de données: {db_path}")

# Se connecter à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Vérifier si la colonne existe déjà
    cursor.execute("PRAGMA table_info(club)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'credits_balance' in columns:
        print("✅ La colonne 'credits_balance' existe déjà dans la table 'club'")
    else:
        print("➕ Ajout de la colonne 'credits_balance' à la table 'club'...")
        
        # Ajouter la colonne avec une valeur par défaut de 0
        cursor.execute("ALTER TABLE club ADD COLUMN credits_balance INTEGER DEFAULT 0 NOT NULL")
        
        conn.commit()
        print("✅ Colonne 'credits_balance' ajoutée avec succès!")
        print("   Tous les clubs existants ont maintenant un solde de 0 crédits")
        
        # Afficher les clubs mis à jour
        cursor.execute("SELECT id, name, credits_balance FROM club")
        clubs = cursor.fetchall()
        
        if clubs:
            print(f"\n📋 Clubs mis à jour ({len(clubs)}):")
            for club_id, name, balance in clubs:
                print(f"   - {name} (ID: {club_id}): {balance} crédits")
        else:
            print("\n📋 Aucun club dans la base de données")
    
except Exception as e:
    print(f"❌ Erreur lors de la migration: {e}")
    conn.rollback()
finally:
    conn.close()

print("\n✅ Migration terminée!")
