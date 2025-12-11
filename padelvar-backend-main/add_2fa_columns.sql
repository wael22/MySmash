-- Script SQL pour ajouter les colonnes 2FA à la table user
-- À exécuter manuellement pour résoudre le problème de migration

ALTER TABLE user ADD COLUMN two_factor_secret VARCHAR(255);
ALTER TABLE user ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0;
ALTER TABLE user ADD COLUMN two_factor_backup_codes TEXT;
