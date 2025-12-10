import sqlite3
import os
from datetime import datetime

# Chemin vers la base de données
DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'padelvar.db')

def create_credit_packages_table():
    """Créer la table credit_package et insérer les packages par défaut"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Créer la table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS credit_package (
                id TEXT PRIMARY KEY,
                credits INTEGER NOT NULL,
                price_dt INTEGER NOT NULL,
                package_type TEXT NOT NULL,
                description TEXT,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                is_popular BOOLEAN NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        ''')
        
        print("✅ Table 'credit_package' créée avec succès")
        
        # Vérifier si des packages existent déjà
        cursor.execute("SELECT COUNT(*) FROM credit_package")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"ℹ️  {count} package(s) déjà présent(s) dans la table")
            return
        
        # Packages par défaut pour les joueurs
        player_packages = [
            ('pack_1', 1, 10, 'player', '1 crédit pour débloquer une vidéo', 0, 0),
            ('pack_5', 5, 45, 'player', 'Pack 5 crédits avec 10% de remise', 0, 0),
            ('pack_10', 10, 80, 'player', 'Pack populaire - 10 crédits avec 20% d\'économie', 1, 1),
            ('pack_25', 25, 187, 'player', 'Meilleure offre - 25 crédits avec 25% d\'économie', 0, 0),
        ]
        
        # Packages par défaut pour les clubs
        club_packages = [
            ('pack_100', 100, 700, 'club', 'Pour débuter', 0, 0),
            ('pack_500', 500, 3000, 'club', 'Le plus populaire', 1, 1),
            ('pack_1000', 1000, 5500, 'club', 'Meilleure offre', 0, 0),
            ('pack_5000', 5000, 25000, 'club', 'Pour grands clubs', 0, 0),
        ]
        
        # Insérer les packages joueurs
        for pkg in player_packages:
            cursor.execute('''
                INSERT INTO credit_package (id, credits, price_dt, package_type, description, is_popular, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', pkg)
        
        print(f"✅ {len(player_packages)} packages joueurs insérés")
        
        # Insérer les packages clubs
        for pkg in club_packages:
            cursor.execute('''
                INSERT INTO credit_package (id, credits, price_dt, package_type, description, is_popular, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', pkg)
        
        print(f"✅ {len(club_packages)} packages clubs insérés")
        
        conn.commit()
        print("✅ Migration terminée avec succès !")
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration : {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    print("🚀 Démarrage de la migration pour créer la table credit_package...")
    create_credit_packages_table()
