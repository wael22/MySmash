"""Script pour activer tous les packages de crédits dans la DB"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'padelvar.db')

def activate_all_packages():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Activer tous les packages
        cursor.execute("UPDATE credit_package SET is_active = 1")
        conn.commit()
        
        # Afficher tous les packages
        cursor.execute("SELECT id, credits, price_dt, package_type, is_active, is_popular FROM credit_package ORDER BY package_type, credits")
        packages = cursor.fetchall()
        
        print(f"\n✅ Tous les packages ont été activés !\n")
        print(f"{'ID':<20} {'Crédits':<10} {'Prix DT':<10} {'Type':<10} {'Actif':<8} {'Populaire'}")
        print("-" * 80)
        
        for pkg in packages:
            print(f"{pkg[0]:<20} {pkg[1]:<10} {pkg[2]:<10} {pkg[3]:<10} {pkg[4] == 1 :<8} {pkg[5] == 1}")
        
        print(f"\n📊 Total : {len(packages)} packages")
        
    except Exception as e:
        print(f"❌ Erreur : {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    activate_all_packages()
