#!/usr/bin/env python3
"""
Script pour nettoyer les emojis du code JavaScript/JSX qui causent des problèmes avec Vite
"""

import os
import re

def clean_emojis_in_file(file_path):
    """Nettoie les emojis dans un fichier JS/JSX"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Dictionnaire de remplacement des emojis courants dans les logs
        emoji_replacements = {
            '❌': '[ERROR]',
            '✅': '[OK]',
            '⚠️': '[WARNING]',
            '🔍': '[SEARCH]',
            '📊': '[STATS]',
            '💥': '[CRASH]',
            '🚀': '[START]',
            '🎯': '[TARGET]',
            '📄': '[INFO]',
            '🔧': '[CONFIG]',
            '📁': '[FILE]',
            '⏰': '[TIME]',
            '🎉': '[SUCCESS]',
            '🏆': '[SCORE]'
        }
        
        # Remplacer les emojis dans les console.log/error/warn
        for emoji, replacement in emoji_replacements.items():
            content = content.replace(f"'{emoji}", f"'{replacement}")
            content = content.replace(f'"{emoji}', f'"{replacement}')
            content = content.replace(f'`{emoji}', f'`{replacement}')
        
        # Sauvegarder si des changements ont été faits
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Nettoyé: {file_path}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"✗ Erreur dans {file_path}: {e}")
        return False

def find_js_jsx_files(directory):
    """Trouve tous les fichiers JS/JSX dans un répertoire"""
    js_files = []
    for root, dirs, files in os.walk(directory):
        # Ignorer node_modules et dist
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', '.git']]
        
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                js_files.append(os.path.join(root, file))
    return js_files

def main():
    """Fonction principale"""
    print("🧹 NETTOYAGE DES EMOJIS FRONTEND")
    print("=" * 50)
    
    # Répertoire source à nettoyer
    src_dir = "src"
    if not os.path.exists(src_dir):
        print(f"❌ Répertoire {src_dir} non trouvé")
        return
    
    # Trouver tous les fichiers JS/JSX
    js_files = find_js_jsx_files(src_dir)
    print(f"📁 {len(js_files)} fichiers JS/JSX trouvés")
    
    # Nettoyer chaque fichier
    cleaned_count = 0
    for file_path in js_files:
        if clean_emojis_in_file(file_path):
            cleaned_count += 1
    
    print("=" * 50)
    print(f"🎉 Nettoyage terminé: {cleaned_count} fichiers modifiés")
    
    if cleaned_count > 0:
        print("⚠️  Redémarrez le serveur Vite pour appliquer les changements")

if __name__ == "__main__":
    main()