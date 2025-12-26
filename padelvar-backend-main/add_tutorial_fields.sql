-- Migration pour ajouter les champs tutorial au modèle User
-- À exécuter dans la base de données SQLite

-- Ajouter la colonne tutorial_completed (Boolean, default False)
ALTER TABLE user ADD COLUMN tutorial_completed BOOLEAN NOT NULL DEFAULT 0;

-- Ajouter la colonne tutorial_step (Integer, nullable)
ALTER TABLE user ADD COLUMN tutorial_step INTEGER DEFAULT NULL;

-- Marquer tous les utilisateurs existants comme ayant complété le tutoriel
UPDATE user SET tutorial_completed = 1 WHERE tutorial_completed = 0;

-- Afficher le résultat
SELECT COUNT(*) as total_users, 
       SUM(CASE WHEN tutorial_completed = 1 THEN 1 ELSE 0 END) as users_with_tutorial_completed
FROM user;
